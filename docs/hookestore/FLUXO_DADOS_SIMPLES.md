# 🔄 Fluxo de Dados - Explicação Simples

## 📍 Visão Geral

Este documento explica de forma simples como os dados fluem no sistema, desde o login até o armazenamento e uso nos componentes.

---

## 🎯 Fluxo Completo (Passo a Passo)

### 1️⃣ **LOGIN** → Usuário faz login

```
Usuário digita email/senha
    ↓
app/auth/login/page.tsx
    ↓
POST /api/auth/sign-in
    ↓
Backend valida e cria sessão
    ↓
Retorna: { user: {...}, session: { token: "..." } }
    ↓
Token salvo no localStorage: "auth_token"
    ↓
Redireciona para /student
```

**Onde fica guardado:**

- ✅ Token no `localStorage` (chave: `auth_token`)
- ✅ Dados básicos do usuário no `auth-store` (Zustand)

---

### 2️⃣ **CARREGAMENTO AUTOMÁTICO** → Dados são buscados

Quando o usuário chega em `/student`, o sistema automaticamente:

```
app/student/layout-content.tsx carrega
    ↓
useStudentInitializer() detecta sessão válida
    ↓
Verifica: "É STUDENT ou ADMIN? Tem token?"
    ↓
SIM → Chama loadAll() do store
    ↓
GET /api/students/all (com token no header)
    ↓
Backend retorna TODOS os dados do student:
    - User info
    - Progress (XP, streak, level)
    - Profile (altura, peso, objetivos)
    - Weight history
    - Workouts
    - Nutrition
    - Subscription
    - Payments
    - etc...
    ↓
Dados chegam no store (Zustand)
    ↓
Store salva no localStorage (persist)
```

**Onde fica guardado:**

- ✅ **Zustand Store** (memória do navegador) - `student-unified-store.ts`
- ✅ **localStorage** (persistência) - chave: `student-unified-storage`

**Estrutura no localStorage:**

```json
{
  "state": {
    "data": {
      "user": { "id": "...", "name": "...", "email": "..." },
      "progress": { "totalXP": 1500, "currentLevel": 5, ... },
      "profile": { "height": 175, "weight": 80, ... },
      "weightHistory": [...],
      "units": [...],
      "dailyNutrition": {...},
      ...
    }
  }
}
```

---

### 3️⃣ **USO NOS COMPONENTES** → Componentes acessam dados

Quando um componente precisa de dados:

```
Componente precisa de dados
    ↓
Usa hook: useStudent('progress')
    ↓
Hook acessa Zustand Store
    ↓
Store retorna dados da memória (ou localStorage se necessário)
    ↓
Componente recebe dados e renderiza
```

**Exemplo prático:**

```typescript
// Em qualquer componente
import { useStudent } from "@/hooks/use-student";

function MeuComponente() {
  // Busca apenas XP e level do store
  const { totalXP, currentLevel } = useStudent("totalXP", "currentLevel");

  // Dados vêm direto do Zustand (rápido, sem chamada de API)
  return (
    <div>
      XP: {totalXP} | Level: {currentLevel}
    </div>
  );
}
```

---

### 4️⃣ **ATUALIZAÇÃO DE DADOS** → Usuário muda algo

Quando o usuário atualiza algo (ex: adiciona peso):

```
Usuário adiciona peso: 82kg
    ↓
Componente chama: addWeight(82)
    ↓
Store faz "optimistic update" (atualiza UI imediatamente)
    ↓
Em paralelo: POST /api/students/weight (com token)
    ↓
Backend salva no banco de dados
    ↓
Se sucesso: Store confirma atualização
    ↓
Se erro: Store reverte para valor anterior
```

**Onde fica guardado:**

- ✅ **UI atualizada imediatamente** (optimistic update)
- ✅ **Backend salva no banco** (PostgreSQL via Prisma)
- ✅ **Store atualizado** (Zustand + localStorage)

---

## 🗂️ Onde os Dados Ficam Guardados?

### 1. **localStorage** (Navegador)

```
Chave: "auth_token"
Valor: "1766621786283-2559cofrqcm-7jzaepuw2ql"
```

- ✅ Token de autenticação
- ✅ Persiste mesmo após fechar o navegador

### 2. **localStorage** (Navegador)

```
Chave: "student-unified-storage"
Valor: { state: { data: {...todos os dados...} } }
```

- ✅ Todos os dados do student
- ✅ Cache local para acesso rápido
- ✅ Persiste mesmo após fechar o navegador

### 3. **Zustand Store** (Memória)

```
useStudentUnifiedStore
```

- ✅ Dados em memória (acesso instantâneo)
- ✅ Reativo (componentes atualizam automaticamente)
- ✅ Sincronizado com localStorage

### 4. **Banco de Dados** (PostgreSQL)

```
Tabelas:
- users
- students
- student_progress
- weight_history
- workouts
- daily_nutrition
- etc...
```

- ✅ Fonte da verdade (dados permanentes)
- ✅ Acessado via Prisma ORM
- ✅ APIs fazem queries aqui

---

## 🔄 Fluxo Visual Simplificado

```
┌─────────────────────────────────────────────────────────┐
│                   1. LOGIN                              │
│                                                         │
│  Usuário → Login Page → API → Token → localStorage     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│             2. CARREGAMENTO AUTOMÁTICO                  │
│                                                         │
│  Layout carrega → useStudentInitializer → loadAll()   │
│                                                         │
│  API /students/all → Backend → PostgreSQL              │
│                                                         │
│  Dados retornam → Zustand Store → localStorage        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           3. USO NOS COMPONENTES                        │
│                                                         │
│  Componente → useStudent() → Zustand Store             │
│                                                         │
│  Dados vêm da memória (rápido!) → Renderiza           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           4. ATUALIZAÇÃO                                │
│                                                         │
│  Usuário muda algo → Componente → Store (optimistic)  │
│                                                         │
│  Em paralelo: API → Backend → PostgreSQL              │
│                                                         │
│  Sucesso: Confirma | Erro: Reverte                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Pontos Importantes

### ✅ **Por que localStorage?**

- Dados persistem mesmo fechando o navegador
- Acesso rápido (sem precisar buscar na API toda vez)
- Melhor experiência do usuário (dados aparecem instantaneamente)

### ✅ **Por que Zustand Store?**

- Dados em memória (mais rápido que localStorage)
- Reatividade automática (componentes atualizam sozinhos)
- Fácil de usar (hook simples: `useStudent()`)

### ✅ **Por que Banco de Dados?**

- Fonte da verdade (dados permanentes)
- Sincronização entre dispositivos
- Backup e segurança

### ✅ **Por que Optimistic Updates?**

- UI responde instantaneamente
- Melhor experiência do usuário
- Se der erro, reverte automaticamente

---

## 📝 Exemplo Prático Completo

### Cenário: Usuário adiciona peso

1. **Usuário preenche formulário**: "82kg"
2. **Componente chama**: `addWeight(82)`
3. **Store atualiza UI imediatamente**: Peso aparece na tela
4. **Em background**: `POST /api/students/weight` com `{ weight: 82 }`
5. **Backend salva**: Prisma salva no banco `weight_history`
6. **Se sucesso**: Store confirma (dados já estão atualizados)
7. **Se erro**: Store reverte peso para valor anterior

**Resultado:**

- ✅ UI atualizada instantaneamente
- ✅ Dados salvos no banco
- ✅ Store sincronizado
- ✅ localStorage atualizado

---

## 🔍 Como Ver os Dados?

### No Navegador (DevTools):

1. **Abrir DevTools** (F12)
2. **Aba Application** → **Local Storage**
3. Ver chaves:
   - `auth_token` → Token de autenticação
   - `student-unified-storage` → Todos os dados do student

### No Código:

```typescript
// Ver dados do store
const data = useStudent(); // Todos os dados
const progress = useStudent("progress"); // Apenas progresso
const xp = useStudent("totalXP"); // Apenas XP
```

---

## 🚀 Resumo Ultra-Simples

1. **Login** → Token salvo
2. **App carrega** → Busca todos os dados → Salva no store + localStorage
3. **Componentes usam** → Pegam do store (rápido!)
4. **Usuário muda algo** → Atualiza store → Salva no banco
5. **Refresh** → Dados vêm do localStorage primeiro (rápido!) → Depois sincroniza com banco

**Princípio:** Dados ficam em 3 lugares:

- 🧠 **Memória** (Zustand) - Mais rápido
- 💾 **localStorage** - Persistência
- 🗄️ **Banco de Dados** - Fonte da verdade

---

## ❓ Perguntas Frequentes

### "Onde os dados são salvos quando faço login?"

→ Token no `localStorage`, dados do usuário no `auth-store`

### "Onde ficam os dados do student?"

→ No `student-unified-store` (Zustand) + `localStorage` + Banco de Dados

### "Como os componentes pegam os dados?"

→ Usam o hook `useStudent()` que acessa o Zustand Store

### "O que acontece quando atualizo algo?"

→ UI atualiza imediatamente (optimistic) → Salva no banco em background

### "O que acontece quando dou refresh?"

→ Dados vêm do `localStorage` primeiro (rápido!) → Depois sincroniza com banco se necessário

### "Os dados são perdidos se fechar o navegador?"

→ Não! Ficam salvos no `localStorage` e no banco de dados

---

## 🎓 Conclusão

O sistema usa uma estratégia de **cache em múltiplas camadas**:

1. **Memória (Zustand)** → Mais rápido, mas temporário
2. **localStorage** → Persistente, acesso rápido
3. **Banco de Dados** → Fonte da verdade, permanente

Isso garante:

- ✅ Performance (dados rápidos)
- ✅ Persistência (não perde dados)
- ✅ Sincronização (dados sempre atualizados)
- ✅ Experiência do usuário (tudo instantâneo)
