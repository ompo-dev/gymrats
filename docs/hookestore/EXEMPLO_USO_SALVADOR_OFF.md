# 🚀 Exemplo de Uso - SalvadorOff

## 📍 Visão Geral

O **SalvadorOff** gerencia offline/online automaticamente. Você só precisa chamar as funções normalmente, e ele cuida de tudo!

---

## 🎯 Uso Básico

### No Store (Já Implementado!)

As actions do store já usam `salvadorOff` automaticamente:

```typescript
// Em qualquer componente
import { useStudent } from "@/hooks/use-student";

function MeuComponente() {
  const { updateProgress, addWeight, updateNutrition } = useStudent("actions");

  // ✅ Funciona online E offline automaticamente!
  const handleUpdateXP = async () => {
    await updateProgress({ totalXP: 1500 });
    // Se online: envia para API
    // Se offline: salva na fila automaticamente
  };

  const handleAddWeight = async () => {
    await addWeight(82);
    // ✅ Funciona offline também!
  };

  return (
    <div>
      <button onClick={handleUpdateXP}>Atualizar XP</button>
      <button onClick={handleAddWeight}>Adicionar Peso</button>
    </div>
  );
}
```

---

## 🎨 Usando o Hook Diretamente

### Hook Especializado

```typescript
import { useUpdateProgress } from "@/hooks/use-offline-action";

function MeuComponente() {
  const updateProgress = useUpdateProgress();

  const handleClick = async () => {
    // ✅ Automaticamente gerencia offline/online
    await updateProgress({ totalXP: 1500 });
  };

  return <button onClick={handleClick}>Atualizar XP</button>;
}
```

### Hook Genérico

```typescript
import { useOfflineAction } from "@/hooks/use-offline-action";

function MeuComponente() {
  const updateCustom = useOfflineAction({
    method: 'PUT',
    url: '/api/custom/endpoint',
    priority: 'high',
    onSuccess: (data) => {
      console.log('✅ Sucesso!', data);
    },
    onQueued: (queueId) => {
      console.log('📦 Salvo offline:', queueId);
    },
    onError: (error) => {
      console.error('❌ Erro:', error);
    },
  });

  const handleClick = async () => {
    await updateCustom({ customData: 'value' });
  };

  return <button onClick={handleClick}>Atualizar</button>;
}
```

---

## 🔧 Usando salvadorOff Diretamente

```typescript
import { salvadorOff } from "@/lib/offline/salvador-off";

async function minhaFuncao() {
  const result = await salvadorOff({
    url: '/api/students/progress',
    method: 'PUT',
    body: { totalXP: 1500 },
    headers: {
      Authorization: `Bearer ${token}`,
    },
    priority: 'high',
  });

  if (result.success) {
    if (result.queued) {
      console.log('📦 Salvo offline:', result.queueId);
    } else {
      console.log('✅ Enviado com sucesso:', result.data);
    }
  } else {
    console.error('❌ Erro:', result.error);
  }
}
```

---

## 📝 Exemplos Práticos

### 1. Atualizar XP

```typescript
// ✅ Já funciona automaticamente no store!
const { updateProgress } = useStudent("actions");
await updateProgress({ totalXP: 1500 });
```

### 2. Adicionar Peso

```typescript
// ✅ Já funciona automaticamente no store!
const { addWeight } = useStudent("actions");
await addWeight(82);
```

### 3. Atualizar Nutrição

```typescript
// ✅ Já funciona automaticamente no store!
const { updateNutrition } = useStudent("actions");
await updateNutrition({ 
  meals: [...],
  waterIntake: 500 
});
```

### 4. Atualizar Perfil

```typescript
// ✅ Já funciona automaticamente no store!
const { updateProfile } = useStudent("actions");
await updateProfile({ height: 175 });
```

---

## 🎯 O Que Acontece Automaticamente?

### Quando Online:
1. ✅ Envia para API imediatamente
2. ✅ Retorna resposta
3. ✅ Atualiza UI

### Quando Offline:
1. ✅ Salva na fila (IndexedDB)
2. ✅ Atualiza UI (optimistic update)
3. ✅ Registra Background Sync
4. ✅ Sincroniza automaticamente quando volta online

---

## 🔍 Verificar Status

```typescript
import { useOffline } from "@/hooks/use-offline";

function MeuComponente() {
  const { isOnline, isOffline, queueSize } = useOffline();

  return (
    <div>
      {isOffline && (
        <p>📡 Offline - {queueSize} ações pendentes</p>
      )}
      {isOnline && (
        <p>✅ Online</p>
      )}
    </div>
  );
}
```

---

## 🚀 Sincronização Manual

```typescript
import { syncQueue } from "@/lib/offline/salvador-off";

// Sincronizar fila manualmente
const { synced, failed } = await syncQueue();
console.log(`✅ Sincronizado: ${synced}, ❌ Falhou: ${failed}`);
```

---

## 📦 Ver Fila

```typescript
import { getQueueItems, getQueueSize } from "@/lib/offline/offline-queue";

// Ver tamanho da fila
const size = await getQueueSize();
console.log(`Fila: ${size} itens`);

// Ver itens da fila
const items = await getQueueItems();
console.log('Itens:', items);
```

---

## 🎓 Resumo

### ✅ **Tudo Automático!**

- ✅ Store já usa `salvadorOff` automaticamente
- ✅ Funciona online e offline
- ✅ Sincroniza automaticamente
- ✅ Nada é perdido

### 📝 **Você só precisa:**

```typescript
// Chamar normalmente, como sempre fez!
await updateProgress({ totalXP: 1500 });
await addWeight(82);
await updateNutrition({ meals: [...] });
```

**E o `salvadorOff` cuida de tudo!** 🚀

