# 🔄 Offline-First com Background Sync

## 📍 Visão Geral

Implementação de sistema **Offline-First** com **Background Sync**, similar ao Instagram, WhatsApp e Twitter. O sistema funciona mesmo sem internet, sincronizando automaticamente quando a conexão voltar.

---

## 🎯 Conceitos-Chave

### 1. **Service Worker**
- Intercepta requisições de rede
- Cache de recursos estáticos
- Gerencia fila de ações offline

### 2. **Fila de Ações Offline (Offline Queue)**
- Armazena ações do usuário quando offline
- Reexecuta automaticamente quando online
- Garante que nada seja perdido

### 3. **Background Sync API**
- Sincroniza dados em background
- Funciona mesmo com app fechado
- Prioriza ações importantes

### 4. **Persistência Local (IndexedDB)**
- Banco de dados no navegador
- Mais poderoso que localStorage
- Suporta queries complexas

### 5. **Reexecução Idempotente no Backend**
- Backend aceita requisições duplicadas
- Usa IDs únicos para evitar duplicatas
- Garante consistência

---

## 🏗️ Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO                              │
│  (Faz ação: adiciona peso, completa workout, etc)      │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│              COMPONENTE (React)                         │
│  Chama: addWeight(82) ou updateProgress(...)            │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│              ZUSTAND STORE                              │
│  1. Optimistic Update (UI atualiza imediatamente)       │
│  2. Salva ação na Fila Offline (IndexedDB)             │
└──────────────────────┬──────────────────────────────────┘
                       ↓
         ┌─────────────┴─────────────┐
         ↓                           ↓
┌──────────────────┐      ┌──────────────────┐
│   ONLINE?        │      │    OFFLINE?      │
│                  │      │                  │
│  Envia para API  │      │  Salva na Fila   │
│  imediatamente   │      │  (IndexedDB)     │
└──────────────────┘      └──────────────────┘
         │                           │
         ↓                           ↓
┌──────────────────┐      ┌──────────────────┐
│   API → Backend  │      │  Service Worker  │
│   Sucesso        │      │  Background Sync │
└──────────────────┘      └──────────────────┘
                                   │
                                   ↓ (quando online)
                          ┌──────────────────┐
                          │  Processa Fila   │
                          │  Envia para API  │
                          └──────────────────┘
```

---

## 📦 Estrutura de Implementação

### 1. **Service Worker** (`public/sw.js`)

```javascript
// public/sw.js
const CACHE_NAME = 'gymrats-v1';
const OFFLINE_QUEUE_DB = 'offline-queue';

// Instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/student',
        '/manifest.json',
      ]);
    })
  );
  self.skipWaiting();
});

// Intercepta requisições
self.addEventListener('fetch', (event) => {
  // Se for requisição de API, tenta rede primeiro
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Se sucesso, retorna resposta
          return response;
        })
        .catch(() => {
          // Se offline, salva na fila
          return addToOfflineQueue(event.request);
        })
    );
  } else {
    // Recursos estáticos: cache first
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Background Sync - Sincroniza quando online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Adiciona requisição à fila offline
async function addToOfflineQueue(request) {
  const db = await openDB();
  const queue = db.transaction(['queue'], 'readwrite').objectStore('queue');
  
  const queueItem = {
    id: Date.now() + Math.random(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.clone().text(),
    timestamp: Date.now(),
    retries: 0,
  };
  
  await queue.add(queueItem);
  
  // Registra sync para quando voltar online
  self.registration.sync.register('sync-queue');
  
  // Retorna resposta otimista
  return new Response(JSON.stringify({ 
    success: true, 
    queued: true,
    queueId: queueItem.id 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Sincroniza fila quando online
async function syncOfflineQueue() {
  const db = await openDB();
  const queue = db.transaction(['queue'], 'readwrite').objectStore('queue');
  const items = await queue.getAll();
  
  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      
      if (response.ok) {
        // Sucesso: remove da fila
        await queue.delete(item.id);
      } else {
        // Erro: incrementa retries
        item.retries++;
        if (item.retries < 5) {
          await queue.put(item);
        } else {
          // Muitas tentativas: move para "failed"
          await moveToFailedQueue(db, item);
        }
      }
    } catch (error) {
      // Erro de rede: mantém na fila
      item.retries++;
      if (item.retries < 5) {
        await queue.put(item);
      } else {
        await moveToFailedQueue(db, item);
      }
    }
  }
}

// Abre IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE_DB, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store para fila de ações
      if (!db.objectStoreNames.contains('queue')) {
        const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Store para ações falhadas
      if (!db.objectStoreNames.contains('failed')) {
        const failedStore = db.createObjectStore('failed', { keyPath: 'id' });
        failedStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}
```

---

### 2. **Store com Suporte Offline** (`stores/student-unified-store.ts`)

```typescript
// Adicionar ao store existente

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineQueueDB extends DBSchema {
  queue: {
    key: number;
    value: {
      id: number;
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
      timestamp: number;
      retries: number;
    };
    indexes: { 'by-timestamp': number };
  };
  failed: {
    key: number;
    value: {
      id: number;
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
      timestamp: number;
      retries: number;
      error: string;
    };
    indexes: { 'by-timestamp': number };
  };
}

// Função para verificar se está online
function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

// Função para adicionar à fila offline
async function addToOfflineQueue(
  url: string,
  method: string,
  body: any,
  headers: Record<string, string> = {}
): Promise<{ queued: boolean; queueId?: number }> {
  if (isOnline()) {
    return { queued: false };
  }

  const db = await openDB<OfflineQueueDB>('offline-queue', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('queue')) {
        const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp');
      }
    },
  });

  const queueItem = {
    id: Date.now() + Math.random(),
    url,
    method,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    timestamp: Date.now(),
    retries: 0,
  };

  await db.add('queue', queueItem);

  // Registra sync para quando voltar online
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-queue');
  }

  return { queued: true, queueId: queueItem.id };
}

// Modificar updateProgress para suportar offline
updateProgress: async (updates) => {
  // Optimistic update
  const previousProgress = get().data.progress;
  set((state) => ({
    data: {
      ...state.data,
      progress: { ...state.data.progress, ...updates },
    },
  }));

  try {
    // Tenta enviar para API
    if (isOnline()) {
      await apiClient.put('/api/students/progress', updates);
    } else {
      // Offline: adiciona à fila
      const { queued } = await addToOfflineQueue(
        '/api/students/progress',
        'PUT',
        updates,
        {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        }
      );

      if (queued) {
        console.log('✅ Ação salva na fila offline. Sincronizará quando online.');
      }
    }
  } catch (error: any) {
    // Se erro e estiver online, reverte
    if (isOnline()) {
      console.error('Erro ao atualizar progresso:', error);
      set((state) => ({
        data: {
          ...state.data,
          progress: previousProgress,
        },
      }));
    } else {
      // Offline: ação já está na fila, não precisa reverter
      console.log('Offline: ação será sincronizada quando online.');
    }
  }
},
```

---

### 3. **Hook para Monitorar Status Offline** (`hooks/use-offline.ts`)

```typescript
// hooks/use-offline.ts
"use client";

import { useEffect, useState } from "react";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Verifica tamanho da fila periodicamente
    const checkQueue = async () => {
      if ('indexedDB' in window) {
        try {
          const db = await import('idb').then(m => 
            m.openDB('offline-queue', 1)
          );
          const count = await db.count('queue');
          setQueueSize(count);
        } catch (error) {
          // Ignora erros
        }
      }
    };

    const interval = setInterval(checkQueue, 5000);
    checkQueue(); // Verifica imediatamente

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    queueSize,
  };
}
```

---

### 4. **Componente de Status Offline** (`components/organisms/offline-indicator.tsx`)

```typescript
// components/organisms/offline-indicator.tsx
"use client";

import { useOffline } from "@/hooks/use-offline";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function OfflineIndicator() {
  const { isOffline, queueSize } = useOffline();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            Modo Offline {queueSize > 0 && `(${queueSize} ações pendentes)`}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

### 5. **Backend Idempotente** (`lib/api/handlers/students.handler.ts`)

```typescript
// Adicionar suporte a IDs únicos para evitar duplicatas

export async function updateProgressHandler(
  request: NextRequest,
  options?: { idempotencyKey?: string }
) {
  const auth = await requireStudent(request);
  if ("error" in auth) return auth.response;

  const { studentId } = auth.user;
  const updates = await request.json();

  // Se tiver idempotencyKey, verifica se já foi processado
  if (options?.idempotencyKey) {
    const existing = await db.idempotencyKey.findUnique({
      where: { key: options.idempotencyKey },
    });

    if (existing) {
      // Já foi processado: retorna resultado anterior
      return successResponse({
        message: "Já processado anteriormente",
        data: existing.result,
      });
    }
  }

  // Processa atualização
  const updated = await db.studentProgress.update({
    where: { studentId },
    data: updates,
  });

  // Salva idempotencyKey se fornecido
  if (options?.idempotencyKey) {
    await db.idempotencyKey.create({
      data: {
        key: options.idempotencyKey,
        result: updated,
        createdAt: new Date(),
      },
    });
  }

  return successResponse(updated);
}
```

---

## 🔄 Fluxo Completo Offline-First

### Cenário: Usuário adiciona peso OFFLINE

```
1. Usuário está offline
   ↓
2. Usuário adiciona peso: 82kg
   ↓
3. Componente chama: addWeight(82)
   ↓
4. Store detecta: isOnline() = false
   ↓
5. Store faz:
   - Optimistic update (UI atualiza)
   - Salva ação na fila (IndexedDB)
   - Registra Background Sync
   ↓
6. Usuário vê: "Modo Offline (1 ação pendente)"
   ↓
7. Usuário fecha o app
   ↓
8. Conexão volta
   ↓
9. Service Worker detecta: online
   ↓
10. Background Sync dispara
    ↓
11. Service Worker processa fila:
    - Pega ação da fila
    - Envia para API com idempotencyKey
    - Se sucesso: remove da fila
    - Se erro: incrementa retries
    ↓
12. Backend processa (idempotente):
    - Verifica idempotencyKey
    - Se já processado: retorna resultado anterior
    - Se novo: processa e salva key
    ↓
13. Dados sincronizados! ✅
```

---

## 📦 Estrutura de Dados

### IndexedDB Schema

```typescript
interface OfflineQueueItem {
  id: number; // ID único
  url: string; // URL da API
  method: string; // GET, POST, PUT, PATCH, DELETE
  headers: Record<string, string>; // Headers (incluindo auth)
  body: string; // Body JSON stringificado
  timestamp: number; // Quando foi criado
  retries: number; // Quantas vezes tentou
  idempotencyKey?: string; // Chave para evitar duplicatas
}
```

---

## 🎯 Benefícios

### ✅ **Experiência do Usuário**
- App funciona mesmo offline
- Ações não são perdidas
- Sincronização automática

### ✅ **Confiabilidade**
- Fila persistente (IndexedDB)
- Retry automático
- Idempotência no backend

### ✅ **Performance**
- UI responde instantaneamente
- Sincronização em background
- Não bloqueia interface

---

## 🚀 Implementação Passo a Passo

### Fase 1: Service Worker Básico
1. Criar `public/sw.js`
2. Registrar no `app/layout.tsx`
3. Testar cache de recursos

### Fase 2: IndexedDB e Fila
1. Criar schema IndexedDB
2. Implementar `addToOfflineQueue()`
3. Testar salvamento offline

### Fase 3: Background Sync
1. Implementar `syncOfflineQueue()`
2. Registrar eventos de sync
3. Testar sincronização automática

### Fase 4: Integração com Store
1. Modificar actions do store
2. Adicionar detecção de online/offline
3. Testar fluxo completo

### Fase 5: Backend Idempotente
1. Criar tabela `idempotency_keys`
2. Modificar handlers para aceitar keys
3. Testar duplicatas

---

## 📝 Exemplo de Uso

```typescript
// Em qualquer componente
import { useOffline } from "@/hooks/use-offline";
import { useStudent } from "@/hooks/use-student";

function MeuComponente() {
  const { isOffline, queueSize } = useOffline();
  const { addWeight } = useStudent("actions");

  const handleAddWeight = async () => {
    await addWeight(82);
    
    if (isOffline) {
      console.log("✅ Peso salvo offline. Sincronizará quando online.");
    }
  };

  return (
    <div>
      {isOffline && (
        <p>Offline - {queueSize} ações pendentes</p>
      )}
      <button onClick={handleAddWeight}>
        Adicionar Peso
      </button>
    </div>
  );
}
```

---

## 🎓 Conclusão

Sistema **Offline-First** garante:
- ✅ Funciona sem internet
- ✅ Nada é perdido
- ✅ Sincroniza automaticamente
- ✅ Experiência fluida

Igual ao Instagram, WhatsApp e Twitter! 🚀

