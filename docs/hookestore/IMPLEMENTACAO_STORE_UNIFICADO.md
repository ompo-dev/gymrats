# 🚀 IMPLEMENTAÇÃO - STORE UNIFICADO E HOOK MODULAR

## 📋 VISÃO GERAL

Este documento detalha a implementação completa do store unificado e hook modular para o student, seguindo o plano de ação definido em `PLANO_ACAO_STORE_UNIFICADO.md`.

---

## ✅ FASE 1: STORE UNIFICADO

### 1.1 Criar Interface de Dados

**Arquivo:** `lib/types/student-data.ts` (NOVO)

```typescript
// Definir todas as interfaces de dados do student
// Consolidar tipos de stores antigos
```

### 1.2 Criar Store Unificado

**Arquivo:** `stores/student-unified-store.ts` (NOVO)

**Funcionalidades:**
- ✅ Estado unificado com todos os dados do student
- ✅ Actions para carregar dados (loadAll, loadProgress, etc)
- ✅ Actions para atualizar dados (updateProgress, addWeight, etc)
- ✅ Actions para sincronização (syncAll, syncProgress, etc)
- ✅ Persist middleware para cache local
- ✅ Otimistic updates
- ✅ Gerenciamento de loading e errors

### 1.3 Criar Server Action Unificada

**Arquivo:** `app/student/actions-unified.ts` (NOVO)

**Funções:**
- ✅ `getAllStudentData()` - Busca TUDO de uma vez
- ✅ `getStudentDataSection(section)` - Busca seção específica
- ✅ Fallback para server actions antigas

---

## ✅ FASE 2: HOOK MODULAR

### 2.1 Criar Hook Principal

**Arquivo:** `hooks/use-student.ts` (NOVO)

**Funcionalidades:**
- ✅ Seletores dinâmicos baseados em strings
- ✅ Carregamento automático na primeira chamada
- ✅ Cache inteligente
- ✅ Exposição de actions
- ✅ TypeScript completo com autocomplete

### 2.2 Criar Helpers

**Arquivo:** `lib/utils/student-selectors.ts` (NOVO)

**Funções:**
- ✅ `selectUser(data)` - Seleciona dados do user
- ✅ `selectProgress(data)` - Seleciona progress
- ✅ `selectProfile(data)` - Seleciona profile
- ✅ `selectWeightHistory(data)` - Seleciona weight history
- ✅ etc...

**Arquivo:** `lib/utils/student-transformers.ts` (NOVO)

**Funções:**
- ✅ Transformar dados do DB para formato do store
- ✅ Transformar dados do store para formato da API
- ✅ Normalização de datas
- ✅ Parse de JSON fields

---

## ✅ FASE 3: API UNIFICADA

### 3.1 Criar Endpoint Unificado

**Arquivo:** `app/api/students/all/route.ts` (NOVO)

**Endpoint:** `GET /api/students/all`

**Query Params:**
- `sections` - Array de seções para buscar (ex: `?sections=progress,profile,workouts`)
- Se não especificado, retorna tudo

**Resposta:**
```json
{
  "user": { ... },
  "student": { ... },
  "progress": { ... },
  "profile": { ... },
  "weightHistory": [ ... ],
  "units": [ ... ],
  "workoutHistory": [ ... ],
  "personalRecords": [ ... ],
  "dailyNutrition": { ... },
  "subscription": { ... },
  "memberships": [ ... ],
  "payments": [ ... ],
  "paymentMethods": [ ... ],
  "dayPasses": [ ... ],
  "friends": { ... }
}
```

---

## ✅ FASE 4: ATUALIZAR COMPONENTES

### 4.1 Atualizar `app/student/page-content.tsx`

**Antes:**
```typescript
const progress = useStudentStore((state) => state.progress);
const profileData = props.profileData;
```

**Depois:**
```typescript
const { progress, profile, user } = useStudent('progress', 'profile', 'user');
```

### 4.2 Atualizar `app/student/profile/profile-content.tsx`

**Antes:**
```typescript
const [weightHistory, setWeightHistory] = useState(props.weightHistory);
const progress = useStudentStore((state) => state.progress);
```

**Depois:**
```typescript
const { weightHistory, progress, profile } = useStudent('weightHistory', 'progress', 'profile');
const { addWeight } = useStudent('actions');
```

### 4.3 Atualizar `app/student/diet/diet-page.tsx`

**Antes:**
```typescript
const { dailyNutrition, ... } = useNutritionHandlers();
```

**Depois:**
```typescript
const { dailyNutrition, updateNutrition } = useStudent('dailyNutrition', 'actions');
```

### 4.4 Atualizar `app/student/learn/learning-path.tsx`

**Antes:**
```typescript
const units = props.units;
```

**Depois:**
```typescript
const { units } = useStudent('units');
```

### 4.5 Atualizar `app/student/payments/student-payments-page.tsx`

**Antes:**
```typescript
const { data: memberships } = useQuery({ queryKey: ["memberships"], ... });
const { subscription } = useSubscription();
```

**Depois:**
```typescript
const { memberships, subscription, payments, paymentMethods } = useStudent(
  'memberships', 
  'subscription', 
  'payments', 
  'paymentMethods'
);
```

---

## ✅ FASE 5: LIMPEZA

### 5.1 Remover Stores Antigos

**Arquivos para DELETAR:**
- ❌ `stores/student-store.ts`
- ❌ `stores/nutrition-store.ts` (ou manter temporariamente)
- ❌ `stores/subscription-store.ts` (ou manter temporariamente)

**Arquivos para MANTER (temporariamente):**
- ⚠️ `stores/workout-store.ts` - Manter para workout progress (pode ser integrado depois)

### 5.2 Remover Hooks Antigos

**Arquivos para DELETAR:**
- ❌ `hooks/use-nutrition-handlers.ts`
- ❌ `hooks/use-student-data.ts`

**Arquivos para MANTER:**
- ✅ `hooks/use-subscription.ts` - Pode ser mantido como wrapper

### 5.3 Atualizar Exports

**Arquivo:** `stores/index.ts`

**Antes:**
```typescript
export { useStudentStore } from "./student-store";
export { useNutritionStore } from "./nutrition-store";
export { useSubscriptionStore } from "./subscription-store";
```

**Depois:**
```typescript
export { useStudentUnifiedStore } from "./student-unified-store";
// Deprecated - usar useStudent() hook
export { useStudentStore } from "./student-store";
export { useNutritionStore } from "./nutrition-store";
export { useSubscriptionStore } from "./subscription-store";
```

---

## 🔄 FLUXO DE SINCRONIZAÇÃO

### Carregamento Inicial

```
1. Componente monta e chama useStudent('progress')
2. Hook verifica se dados estão no store (cache)
3. Se não, chama loadProgress() do store
4. Store verifica se já está carregando (evitar duplicatas)
5. Se não, chama API /api/students/all?sections=progress
6. Dados são salvos no store
7. Hook retorna dados do store
8. Componente renderiza
```

### Atualização Otimista

```
1. Usuário completa workout
2. Componente chama updateProgress({ totalXP: +100 })
3. Store atualiza imediatamente (optimistic update)
4. UI atualiza instantaneamente
5. Store chama API em background
6. Se sucesso, confirma atualização
7. Se erro, reverte mudança e mostra erro
```

### Sincronização Automática

```
1. Store detecta mudanças pendentes (timestamp)
2. Se lastSync > 5 minutos, sincroniza automaticamente
3. Ou se mudança crítica (ex: completar workout), sincroniza imediatamente
4. Atualiza lastSync timestamp
5. Notifica componentes via Zustand
```

---

## 📊 ESTRUTURA DE DADOS NO STORE

### Hierarquia

```
StudentData
├── user (UserInfo)
├── student (StudentInfo)
├── progress (UserProgress)
├── profile (StudentProfile)
├── weightHistory (WeightHistoryItem[])
├── units (Unit[])
├── workoutHistory (WorkoutHistory[])
├── personalRecords (PersonalRecord[])
├── dailyNutrition (DailyNutrition)
├── subscription (Subscription | null)
├── memberships (StudentGymMembership[])
├── payments (StudentPayment[])
├── paymentMethods (PaymentMethod[])
├── dayPasses (DayPass[])
├── friends (FriendsData)
├── activeWorkout (ActiveWorkout | null)
└── metadata (Metadata)
```

---

## 🎯 EXEMPLOS DE IMPLEMENTAÇÃO

### Exemplo 1: Store Unificado

```typescript
// stores/student-unified-store.ts
export const useStudentUnifiedStore = create<StudentUnifiedState>()(
  persist(
    (set, get) => ({
      data: initialStudentData,
      
      loadAll: async () => {
        set({ metadata: { ...get().metadata, isLoading: true } });
        try {
          const response = await fetch('/api/students/all');
          const data = await response.json();
          set({ 
            data: transformStudentData(data),
            metadata: { 
              ...get().metadata, 
              isLoading: false,
              lastSync: new Date(),
              errors: {}
            }
          });
        } catch (error) {
          set({ 
            metadata: { 
              ...get().metadata, 
              isLoading: false,
              errors: { loadAll: error.message }
            }
          });
        }
      },
      
      updateProgress: async (updates) => {
        // Optimistic update
        set((state) => ({
          data: {
            ...state.data,
            progress: { ...state.data.progress, ...updates }
          }
        }));
        
        // Sync with backend
        try {
          await fetch('/api/students/progress', {
            method: 'PUT',
            body: JSON.stringify(updates)
          });
        } catch (error) {
          // Revert on error
          // ...
        }
      },
      
      // ... outras actions
    }),
    {
      name: 'student-unified-storage',
      partialize: (state) => ({
        data: state.data,
        metadata: { ...state.metadata, isLoading: false }
      })
    }
  )
);
```

### Exemplo 2: Hook Modular

```typescript
// hooks/use-student.ts
export function useStudent(...selectors: string[]) {
  const store = useStudentUnifiedStore();
  const { data, loadAll, ...actions } = store;
  
  // Carregar dados na primeira vez
  useEffect(() => {
    if (!data.metadata.isInitialized) {
      loadAll();
    }
  }, []);
  
  // Seletores dinâmicos
  const selectedData: any = {};
  selectors.forEach(selector => {
    if (selector === 'actions') {
      selectedData.actions = actions;
    } else if (selector === 'loaders') {
      selectedData.loaders = { loadAll, loadProgress, ... };
    } else {
      selectedData[selector] = selectFromData(data, selector);
    }
  });
  
  // Se nenhum seletor, retorna tudo
  if (selectors.length === 0) {
    return data;
  }
  
  // Se apenas um seletor, retorna diretamente
  if (selectors.length === 1) {
    return selectedData[selectors[0]];
  }
  
  // Múltiplos seletores, retorna objeto
  return selectedData;
}
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Store Unificado
- [ ] Criar `lib/types/student-data.ts`
- [ ] Criar `stores/student-unified-store.ts`
- [ ] Implementar todas as actions
- [ ] Testar store isoladamente
- [ ] Criar `app/student/actions-unified.ts`

### Fase 2: Hook Modular
- [ ] Criar `hooks/use-student.ts`
- [ ] Criar `lib/utils/student-selectors.ts`
- [ ] Criar `lib/utils/student-transformers.ts`
- [ ] Implementar seletores dinâmicos
- [ ] Testar hook isoladamente

### Fase 3: API Unificada
- [ ] Criar `app/api/students/all/route.ts`
- [ ] Implementar busca de todas as seções
- [ ] Implementar filtros por seção
- [ ] Testar API

### Fase 4: Atualizar Componentes
- [ ] Atualizar `app/student/page-content.tsx`
- [ ] Atualizar `app/student/profile/profile-content.tsx`
- [ ] Atualizar `app/student/diet/diet-page.tsx`
- [ ] Atualizar `app/student/learn/learning-path.tsx`
- [ ] Atualizar `app/student/payments/student-payments-page.tsx`
- [ ] Testar cada página

### Fase 5: Limpeza
- [ ] Marcar stores antigos como deprecated
- [ ] Remover stores antigos
- [ ] Remover hooks antigos
- [ ] Atualizar imports
- [ ] Atualizar documentação

---

**Status:** 📝 DOCUMENTAÇÃO CRIADA
**Data:** 2025-01-XX
**Próximo Passo:** Iniciar implementação da Fase 1

