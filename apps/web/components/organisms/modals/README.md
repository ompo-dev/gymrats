# modals

- Caminho: `components/organisms/modals`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `add-meal-modal.tsx`: Arquivo da camada local.
- `create-unit-modal.tsx`: Arquivo da camada local.
- `delete-confirmation-modal.tsx`: Arquivo da camada local.
- `edit-unit-modal.tsx`: Arquivo da camada local.
- `empty-state.tsx`: Arquivo da camada local.
- `end-of-list-state.tsx`: Arquivo da camada local.
- `equipment-search.tsx`: Arquivo da camada local.
- `exercise-alternative-selector.tsx`: Arquivo da camada local.
- `exercise-search.tsx`: Arquivo da camada local.
- `food-search-chat.tsx`: Arquivo da camada local.
- `food-search.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `loading-more-state.tsx`: Arquivo da camada local.
- `loading-state.tsx`: Arquivo da camada local.
- `modal-container.tsx`: Arquivo da camada local.
- `modal-content.tsx`: Arquivo da camada local.
- `modal-header.tsx`: Arquivo da camada local.
- `search-input.tsx`: Arquivo da camada local.
- `streak-modal.tsx`: Arquivo da camada local.
- `subscription-cancel-dialog.tsx`: Arquivo da camada local.
- `workout-chat.tsx`: Arquivo da camada local.
- `workout-preview-card.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `add-meal-modal.tsx`
- O que faz: implementa o componente `add-meal-modal`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `AddMealModal`, `setSelectedTypes`, `includes`, `filter`, `setTimes`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/selectors/option-selector`, `@/lib/types`
- Expõe: `AddMealModal`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/diet/diet-page.tsx`, `components/organisms/modals/index.ts`

### `create-unit-modal.tsx`
- O que faz: implementa o componente `create-unit-modal`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `CreateUnitModal`, `useState`, `useStudent`, `trim`, `error`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `sonner`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/hooks/use-student`, `@/stores/student-unified-store`
- Expõe: `CreateUnitModal`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `app/student/learn/learning-path.tsx`

### `delete-confirmation-modal.tsx`
- O que faz: implementa o componente `delete-confirmation-modal`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `DeleteConfirmationModal`, `stopPropagation`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/atoms/buttons/button`
- Expõe: `DeleteConfirmationModal`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/edit-unit-modal.tsx`

### `edit-unit-modal.tsx`
- O que faz: implementa o componente `edit-unit-modal`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `EditUnitModal`, `useRouter`, `useModalStateWithParam`, `useStudent`, `useState`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `react`, `sonner`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/hooks/use-modal-state`, `@/hooks/use-student`, `@/lib/types`, `@/lib/utils`, `@/stores/student-unified-store`
- Expõe: `EditUnitModal`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `app/student/learn/learning-path.tsx`, `components/organisms/modals/index.ts`

### `empty-state.tsx`
- O que faz: implementa o componente `empty-state`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `EmptyState`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`
- Expõe: `EmptyState`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/exercise-search.tsx`

### `end-of-list-state.tsx`
- O que faz: implementa o componente `end-of-list-state`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `EndOfListState`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`
- Expõe: `EndOfListState`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/exercise-search.tsx`

### `equipment-search.tsx`
- O que faz: implementa o componente `equipment-search`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `EquipmentSearch`, `useState`, `map`, `forEach`, `filter`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/selectors/option-selector`, `@/lib/equipment-database`, `@/lib/equipment-database`
- Expõe: `EquipmentSearch`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/onboarding/steps/step4.tsx`, `components/organisms/modals/index.ts`

### `exercise-alternative-selector.tsx`
- O que faz: implementa o componente `exercise-alternative-selector`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ExerciseAlternativeSelector`, `onSelect`, `map`, `stopPropagation`, `setSelectedId`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `ExerciseAlternativeSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/index.ts`, `components/organisms/workout/workout-modal.tsx`

### `exercise-search.tsx`
- O que faz: implementa o componente `exercise-search`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `toLowerCase`, `ExerciseSearch`, `useStudent`, `useState`, `Map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `sonner`, `@/components/atoms/buttons/button`, `@/hooks/use-student`, `@/lib/api/client`, `@/lib/educational-data`, `@/lib/types`, `@/lib/utils`, `./empty-state`, `./end-of-list-state`
- Expõe: `ExerciseSearch`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `components/organisms/modals/edit-unit-modal.tsx`

### `food-search-chat.tsx`
- O que faz: implementa o componente `food-search-chat`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `FoodSearchChat`, `useStudent`, `useState`, `useEffect`, `scrollIntoView`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/hooks/use-student`, `@/lib/ai/parsers/nutrition-parser`, `@/lib/ai/prompts/nutrition`, `@/lib/types`, `@/stores/student-unified-store`
- Expõe: `FoodSearchChat`
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: `components/organisms/modals/food-search.tsx`

### `food-search.tsx`
- O que faz: implementa o componente `food-search`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `FoodSearch`, `useStudent`, `useMemo`, `hasActivePremiumStatus`, `useState`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/selectors/option-selector`, `@/hooks/use-student`, `@/lib/api/client`, `@/lib/types`, `@/lib/utils`, `@/lib/utils/subscription-helpers`, `./food-search-chat`
- Expõe: `FoodSearch`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/student/diet/diet-page.tsx`, `components/organisms/modals/index.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./add-meal-modal`, `./add-meal-modal`, `./edit-unit-modal`, `./equipment-search`, `./equipment-search`, `./exercise-alternative-selector`, `./exercise-alternative-selector`, `./food-search`, `./food-search`, `./streak-modal`, `./streak-modal`, `./subscription-cancel-dialog`
- Expõe: `AddMealModal`, `EditUnitModal`, `EquipmentSearch`, `ExerciseAlternativeSelector`, `FoodSearch`, `StreakModal`, `SubscriptionCancelDialog`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/layout-content.tsx`, `components/organisms/index.ts`

### `loading-more-state.tsx`
- O que faz: implementa o componente `loading-more-state`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LoadingMoreState`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`
- Expõe: `LoadingMoreState`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/exercise-search.tsx`

### `loading-state.tsx`
- O que faz: implementa o componente `loading-state`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LoadingState`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`
- Expõe: `LoadingState`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/exercise-search.tsx`

### `modal-container.tsx`
- O que faz: implementa o componente `modal-container`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ModalContainer`, `stopPropagation`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `react`
- Expõe: `ModalContainer`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/edit-unit-modal.tsx`, `components/organisms/modals/exercise-search.tsx`

### `modal-content.tsx`
- O que faz: implementa o componente `modal-content`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `react`
- Expõe: `ModalContent`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/edit-unit-modal.tsx`, `components/organisms/modals/exercise-search.tsx`

### `modal-header.tsx`
- O que faz: implementa o componente `modal-header`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ModalHeader`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`
- Expõe: `ModalHeader`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/edit-unit-modal.tsx`, `components/organisms/modals/exercise-search.tsx`

### `search-input.tsx`
- O que faz: implementa o componente `search-input`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `SearchInput`, `onChange`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`
- Expõe: `SearchInput`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/exercise-search.tsx`

### `streak-modal.tsx`
- O que faz: implementa o componente `streak-modal`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `StreakModal`, `getDay`, `map`, `cn`, `filter`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/ui/dialog`
- Expõe: `StreakModal`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/index.ts`, `components/organisms/navigation/app-header.tsx`

### `subscription-cancel-dialog.tsx`
- O que faz: implementa o componente `subscription-cancel-dialog`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `SubscriptionCancelDialog`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/ui/alert-dialog`
- Expõe: `SubscriptionCancelDialog`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/payments/student-payments-page.tsx`, `components/organisms/modals/index.ts`

### `workout-chat.tsx`
- O que faz: implementa o componente `workout-chat`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WorkoutChat`, `useStudent`, `find`, `useState`, `useToast`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/hooks/use-student`, `@/hooks/use-toast`, `@/lib/ai/prompts/workout`, `@/lib/api/client`, `@/lib/types`, `@/stores/student-unified-store`, `./workout-preview-card`
- Expõe: `WorkoutChat`
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: `components/organisms/modals/edit-unit-modal.tsx`

### `workout-preview-card.tsx`
- O que faz: implementa o componente `workout-preview-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ExerciseItemCard`, `stopPropagation`, `onReference`, `onToggle`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/molecules/cards/duo-card`, `@/lib/utils`
- Expõe: `WorkoutPreviewCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/modals/workout-chat.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
