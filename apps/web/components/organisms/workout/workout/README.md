# workout

- Caminho: `components/organisms/workout/workout`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `cardio-config-modal.tsx`: Arquivo da camada local.
- `cardio-exercise-view.tsx`: Arquivo da camada local.
- `exercise-card-view.tsx`: Arquivo da camada local.
- `strength-exercise-view.tsx`: Arquivo da camada local.
- `weight-tracker-overlay.tsx`: Arquivo da camada local.
- `workout-actions.tsx`: Arquivo da camada local.
- `workout-completion-screen.tsx`: Arquivo da camada local.
- `workout-completion-view.tsx`: Arquivo da camada local.
- `workout-footer.tsx`: Arquivo da camada local.
- `workout-header.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `cardio-config-modal.tsx`
- O que faz: implementa o componente `cardio-config-modal`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `CardioConfigModal`, `onClose`, `stopPropagation`, `onSelectPreference`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`
- Expõe: `CardioConfigModal`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/workout/workout-modal.tsx`

### `cardio-exercise-view.tsx`
- O que faz: implementa o componente `cardio-exercise-view`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `CardioExerciseView`, `floor`, `toString`, `padStart`, `formatTime`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@/lib/types`
- Expõe: `CardioExerciseView`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `exercise-card-view.tsx`
- O que faz: implementa o componente `exercise-card-view`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ExerciseCardView`, `floor`, `toString`, `padStart`, `formatTime`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/lib/types`
- Expõe: `ExerciseCardView`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/workout/workout-modal.tsx`

### `strength-exercise-view.tsx`
- O que faz: implementa o componente `strength-exercise-view`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `StrengthExerciseView`, `round`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@/lib/types`
- Expõe: `StrengthExerciseView`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `weight-tracker-overlay.tsx`
- O que faz: implementa o componente `weight-tracker-overlay`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `sanitizeExistingLog`, `isArray`, `filter`, `map`, `WeightTrackerOverlay`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/atoms/progress/exercise-steppers`, `@/lib/types`, `../../trackers/weight-tracker`
- Expõe: `WeightTrackerOverlay`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/workout/workout-modal.tsx`

### `workout-actions.tsx`
- O que faz: implementa o componente `workout-actions`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WorkoutActions`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/lib/types`, `@/lib/utils`
- Expõe: `WorkoutActions`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `workout-completion-screen.tsx`
- O que faz: implementa o componente `workout-completion-screen`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WorkoutCompletionScreen`, `log`, `map`, `toLowerCase`, `includes`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/fade-in`, `@/components/atoms/buttons/button`, `@/lib/types`
- Expõe: `WorkoutCompletionScreen`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `workout-completion-view.tsx`
- O que faz: implementa o componente `workout-completion-view`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WorkoutCompletionView`, `floor`, `toString`, `padStart`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/fade-in`, `@/components/atoms/buttons/button`, `@/lib/types`
- Expõe: `WorkoutCompletionView`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/workout/workout-modal.tsx`

### `workout-footer.tsx`
- O que faz: implementa o componente `workout-footer`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WorkoutFooter`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/lib/types`, `@/lib/utils`
- Expõe: `WorkoutFooter`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/workout/workout-modal.tsx`

### `workout-header.tsx`
- O que faz: implementa o componente `workout-header`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WorkoutHeader`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/atoms/progress/exercise-steppers`
- Expõe: `WorkoutHeader`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/workout/workout-modal.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
