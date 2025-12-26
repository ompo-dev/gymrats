# Mapeamento de Modais e Migração para Search Parameters (nuqs)

## Objetivo
Migrar todos os modais, dialogs e componentes que abrem/fecham nas páginas do student para usar search parameters com nuqs, permitindo controle através da URL.

## Estrutura de Search Parameters

### Convenção de Nomenclatura
- **Modal principal**: `modal=<nome-do-modal>`
- **Parâmetros adicionais**: `modalId=<id>` ou `<param>=<value>`

## Modais Identificados

### 1. Diet Page (`/student?tab=diet`)

#### AddMealModal
- **Estado atual**: `showAddMealModal` (useState local)
- **Search param**: `modal=add-meal`
- **Arquivo**: `app/student/diet/diet-page.tsx`
- **Componente**: `components/organisms/modals/add-meal-modal.tsx`

#### FoodSearch
- **Estado atual**: `showFoodSearch` (UIStore)
- **Search param**: `modal=food-search`
- **Parâmetros adicionais**: 
  - `mealId=<id>` (opcional, para adicionar direto em uma refeição)
- **Arquivo**: `app/student/diet/diet-page.tsx`
- **Componente**: `components/organisms/modals/food-search.tsx`

### 2. Profile Page (`/student?tab=profile`)

#### WeightModal
- **Estado atual**: `isWeightModalOpen` (useState local)
- **Search param**: `modal=weight`
- **Arquivo**: `app/student/profile/profile-content.tsx`
- **Componente**: Modal inline no mesmo arquivo

### 3. Payments Page (`/student?tab=payments`)

#### SubscriptionCancelDialog
- **Estado atual**: `showCancelDialog` (useState local)
- **Search param**: `modal=cancel-subscription`
- **Arquivo**: `app/student/payments/student-payments-page.tsx`
- **Componente**: `components/organisms/modals/subscription-cancel-dialog.tsx`

### 4. Learn Page (`/student?tab=learn`)

#### WorkoutModal
- **Estado atual**: `openWorkoutId` (WorkoutStore)
- **Search param**: `modal=workout&workoutId=<id>`
- **Arquivo**: `app/student/layout-content.tsx` (renderizado globalmente)
- **Componente**: `components/organisms/workout/workout-modal.tsx`
- **Sub-modais internos**:
  - `modal=weight-tracker` (dentro do workout)
  - `modal=alternative-selector` (dentro do workout)
  - `modal=cardio-config` (dentro do workout)

### 5. Cardio Page (`/student?tab=cardio`)

#### Modais internos (a verificar)
- CardioTracker pode ter modais
- FunctionalWorkout pode ter modais

### 6. Education Page (`/student?tab=education`)

#### Já usa search params
- `view=<menu|muscles|lessons>`
- `muscle=<id>`
- `exercise=<id>`
- `lesson=<id>`

## Plano de Implementação

### Fase 1: Hook Utilitário ✅
- [x] Criar `hooks/use-modal-state.ts` para facilitar uso de modais com nuqs
- [x] Criar `useModalState` para modais simples
- [x] Criar `useModalStateWithParam` para modais com parâmetros adicionais

### Fase 2: Migração Diet Page ✅
- [x] Migrar AddMealModal
- [x] Migrar FoodSearch
- [x] Atualizar botões/triggers

### Fase 3: Migração Profile Page ✅
- [x] Migrar WeightModal
- [x] Atualizar botão de editar peso

### Fase 4: Migração Payments Page ✅
- [x] Migrar SubscriptionCancelDialog
- [x] Atualizar botão de cancelar

### Fase 5: Migração WorkoutModal ✅
- [x] Migrar WorkoutModal principal
- [x] Migrar sub-modais (weight-tracker, alternative-selector, cardio-config)
- [x] Atualizar todos os triggers
- [x] Atualizar learning-path para usar search params

### Fase 6: Verificação e Limpeza ⏳
- [ ] Verificar modais no CardioTracker e FunctionalWorkout
- [ ] Remover estados não utilizados dos stores (showFoodSearch, openWorkoutId)
- [ ] Testar todos os fluxos

## Convenções de Uso

### Abrir Modal
```typescript
const [modal, setModal] = useQueryState("modal", parseAsString);
// Abrir
setModal("add-meal");
// Com parâmetros
setModal("food-search");
setMealId("meal-123");
```

### Fechar Modal
```typescript
// Fechar
setModal(null);
// Ou remover todos os params relacionados
setModal(null);
setMealId(null);
```

### Verificar se está aberto
```typescript
const [modal] = useQueryState("modal", parseAsString);
const isOpen = modal === "add-meal";
```

## Benefícios

1. **URL compartilhável**: Links diretos para modais específicos
2. **Navegação do browser**: Voltar/frente funciona corretamente
3. **Estado persistente**: Refresh mantém modal aberto
4. **Debug facilitado**: Estado visível na URL
5. **SEO friendly**: URLs descritivas

