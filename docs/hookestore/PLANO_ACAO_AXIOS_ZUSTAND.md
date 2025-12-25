# 🎯 PLANO DE AÇÃO - IMPLEMENTAÇÃO AXIOS + ZUSTAND

## 📋 OBJETIVO

Implementar o fluxo de dados unificado: **API → Zustand → Components** com optimistic updates usando axios client em todas as requisições.

## 🔄 FLUXO DE DADOS

### Carregamento (GET)

```
API → axios → Zustand Store → Components
```

### Atualização (POST/PUT/PATCH)

```
Component → Zustand (optimistic update) → axios → API → Zustand (confirmação) → Components
```

## ✅ IMPLEMENTAÇÕES REALIZADAS

### 1. Axios Client

- ✅ `lib/api/client.ts` - Cliente axios configurado com interceptors
- ✅ Suporte para autenticação automática
- ✅ Tratamento de erros 401 (redirect para login)

### 2. Store Unificado

- ✅ Importado `apiClient` no store
- ✅ `loadSection()` - Usa axios
- ✅ `loadAllData()` - Usa axios
- ✅ `loadNutrition()` - Usa axios
- ✅ `updateProgress()` - Usa axios com optimistic update
- ✅ `updateProfile()` - Usa axios com optimistic update
- ✅ `addWeight()` - Usa axios com optimistic update
- ✅ `updateNutrition()` - Usa axios com optimistic update
- ✅ `addDayPass()` - Usa axios com optimistic update
- ✅ `completeWorkout()` - Usa axios com optimistic update
- ✅ `addPersonalRecord()` - Usa axios com optimistic update
- ✅ `updatePersonalRecord()` - Usa axios com optimistic update
- ✅ `deletePersonalRecord()` - Usa axios com optimistic update

## 📝 PÁGINAS A ATUALIZAR

### 1. `app/student/page.tsx` e `page-content.tsx`

**Status:** ⏳ Pendente

**Mudanças necessárias:**

- Remover server actions diretas (manter apenas para SSR inicial)
- Usar `useStudent()` hook para todos os dados
- Garantir que dados vêm do store (API → Zustand → Component)
- Manter props apenas para SSR inicial

**Componentes a verificar:**

- `ShopCard` - Já usa `useStudent('totalXP')` ✅
- `WeightProgressCard` - Usar `useStudent('weightHistory', 'weightGain')`
- `RecentWorkoutsCard` - Usar `useStudent('workoutHistory')`
- `LevelProgressCard` - Usar `useStudent('progress')`

### 2. `app/student/diet/diet-page.tsx`

**Status:** ⏳ Pendente

**Mudanças necessárias:**

- Já usa `useNutritionHandlers()` ✅
- `useNutritionHandlers` já usa `useStudent()` ✅
- Verificar se todos os componentes filhos usam dados do store

**Componentes relacionados:**

- `NutritionTracker` - Recebe dados via props do hook ✅
- `FoodSearch` - Recebe dados via props do hook ✅
- `AddMealModal` - Recebe dados via props do hook ✅

### 3. `app/student/learn/learning-path.tsx`

**Status:** ⏳ Pendente

**Mudanças necessárias:**

- Remover fetch direto de `/api/workouts/units`
- Usar `useStudent('units')` e `loadWorkouts()` do store
- Quando workout completar, usar `completeWorkout()` do store
- Store faz optimistic update e sincroniza com API

**Componentes relacionados:**

- `WorkoutNode` - Já recebe units via props
- `WorkoutModal` - Já usa `useStudent('actions')` ✅

### 4. `app/student/payments/student-payments-page.tsx`

**Status:** ⏳ Pendente

**Mudanças necessárias:**

- Remover `useQuery` do React Query
- Usar `useStudent('subscription', 'memberships', 'payments', 'paymentMethods')`
- Garantir que dados vêm do store
- Ações de pagamento devem usar store com optimistic updates

**Componentes relacionados:**

- `SubscriptionSection` - Verificar se usa dados do store
- `SubscriptionCancelDialog` - Verificar se usa actions do store

### 5. `app/student/profile/profile-content.tsx`

**Status:** ⏳ Pendente

**Mudanças necessárias:**

- Remover fetch direto de `/api/auth/session`
- Usar `useStudent('user')` para dados do usuário
- Usar `useStudent('progress', 'weightHistory', 'profile')` para dados do perfil
- `addWeight()` já usa store ✅
- Verificar se todas as atualizações usam store

**Componentes relacionados:**

- `ProfileHeader` - Recebe dados via props
- `HistoryCard` - Recebe dados via props
- `RecordCard` - Recebe dados via props

## 🔍 COMPONENTES A VERIFICAR

### Componentes que podem ter fetch direto:

1. `components/workout-modal.tsx` - Verificar se usa store
2. `components/nutrition-tracker.tsx` - Verificar se recebe dados via props
3. `components/food-search.tsx` - Verificar se recebe dados via props
4. `components/subscription-section.tsx` - Verificar se usa store
5. `components/home/weight-progress-card.tsx` - Verificar se recebe dados via props
6. `components/home/recent-workouts-card.tsx` - Verificar se recebe dados via props
7. `components/home/level-progress-card.tsx` - Verificar se recebe dados via props

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Store Unificado

- [x] Importar `apiClient`
- [x] Atualizar `loadSection()` para usar axios
- [x] Atualizar `loadAllData()` para usar axios
- [x] Atualizar `loadNutrition()` para usar axios
- [x] Atualizar `updateProgress()` para usar axios
- [x] Atualizar `updateProfile()` para usar axios
- [x] Atualizar `addWeight()` para usar axios
- [x] Atualizar `updateNutrition()` para usar axios

### Páginas

- [x] `app/student/page.tsx` - Remover server actions desnecessárias
- [x] `app/student/page-content.tsx` - Garantir uso do store (startTrial usa axios)
- [x] `app/student/diet/diet-page.tsx` - Verificar componentes filhos (todos ok)
- [x] `app/student/learn/learning-path.tsx` - Remover fetch direto (já atualizado)
- [x] `app/student/payments/student-payments-page.tsx` - Remover React Query (import removido)
- [x] `app/student/profile/profile-content.tsx` - Remover fetch direto (logout usa axios)

### Componentes

- [x] Verificar todos os componentes filhos
- [x] Garantir que não há fetch direto
- [x] Garantir que dados vêm via props do store
- [x] `components/workout-modal.tsx` - Atualizado para usar axios client
- [x] `components/food-search.tsx` - Atualizado para usar axios client
- [x] `components/add-meal-modal.tsx` - Não faz chamadas de API, apenas recebe callbacks
- [x] `components/ai-diet-generator.tsx` - Usa mock data, não faz chamadas de API
- [x] `components/ai-workout-generator.tsx` - Usa mock data, não faz chamadas de API
- [x] `hooks/use-user-session.ts` - Atualizado para usar axios client
- [x] `stores/gyms-list-store.ts` - Atualizado para usar axios client

## 🎯 PRÓXIMOS PASSOS

1. **Atualizar `app/student/page-content.tsx`**

   - Garantir que todos os dados vêm do store
   - Remover dependências de props quando dados estão no store

2. **Atualizar `app/student/learn/learning-path.tsx`**

   - Remover fetch direto
   - Usar `loadWorkouts()` do store
   - Usar `completeWorkout()` do store

3. **Atualizar `app/student/payments/student-payments-page.tsx`**

   - Remover `useQuery`
   - Usar dados do store
   - Ações via store

4. **Atualizar `app/student/profile/profile-content.tsx`**

   - Remover fetch direto
   - Usar dados do store

5. **Verificar componentes filhos**
   - Garantir que não há fetch direto
   - Garantir que dados vêm via props

## ✅ VERIFICAÇÃO FINAL DE COMPONENTES

### Componentes Verificados e Atualizados:

1. **`components/workout-modal.tsx`** ✅

   - Atualizado: `saveWorkoutToBackend()` agora usa `apiClient` (axios)
   - Duas ocorrências de `fetch()` substituídas por `apiClient.post()`

2. **`components/food-search.tsx`** ✅

   - Atualizado: busca de alimentos agora usa `apiClient.get()`
   - Removido `fetch()` direto

3. **`components/add-meal-modal.tsx`** ✅

   - Não faz chamadas de API, apenas recebe callbacks via props
   - Não requer atualização

4. **`components/ai-diet-generator.tsx`** ✅

   - Usa `generateDietWithAI()` que é mock data
   - Não faz chamadas de API reais

5. **`components/ai-workout-generator.tsx`** ✅

   - Usa `generateWorkoutWithAI()` que é mock data
   - Não faz chamadas de API reais

6. **`hooks/use-user-session.ts`** ✅

   - Atualizado: `fetchSession()` agora usa `apiClient.get()`
   - Removido `fetch()` direto

7. **`stores/gyms-list-store.ts`** ✅
   - Atualizado: `loadGyms()` agora usa `apiClient.get()`
   - Atualizado: `setActiveGymId()` agora usa `apiClient.post()`
   - Removidos `fetch()` diretos

### Componentes que usam `useQueryState` (nuqs) - CORRETO:

- `components/gym-more-menu.tsx` - Usa `useQueryState` do `nuqs` para gerenciar query params na URL (não é React Query)
- `components/app-layout.tsx` - Usa `useQueryState` do `nuqs` para gerenciar query params na URL (não é React Query)

### Componentes que não fazem chamadas de API:

- `components/performance-optimizer.tsx` - Apenas manipula DOM para adicionar preconnect links
- `components/add-meal-modal.tsx` - Apenas recebe callbacks via props
- `components/nutrition-tracker.tsx` - Recebe dados via props
- `components/subscription-section.tsx` - Recebe dados e callbacks via props
- `components/subscription-cancel-dialog.tsx` - Recebe callbacks via props

---

**Status:** ✅ VERIFICAÇÃO COMPLETA
**Data:** 2025-01-25
**Resultado:** Todos os componentes verificados e atualizados conforme necessário
