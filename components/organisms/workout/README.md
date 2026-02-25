# workout

- Caminho: `components/organisms/workout`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- `execution/`: subdomínio de `components/organisms/workout/execution`.
- `workout/`: subdomínio de `components/organisms/workout/workout`.

## Arquivos
- `functional-workout.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `workout-modal.tsx`: Arquivo da camada local.
- `workout-node.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `functional-workout.tsx`
- O que faz: implementa o componente `functional-workout`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `FunctionalWorkout`, `filter`, `includes`, `map`, `setSelectedAudience`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/components/molecules/selectors/option-selector`, `@/lib/functional-exercises-data`, `@/lib/types`
- Expõe: `FunctionalWorkout`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/cardio/cardio-functional-page.tsx`, `components/organisms/workout/index.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./functional-workout`, `./workout-modal`, `./workout-node`, `./workout-node`
- Expõe: `FunctionalWorkout`, `WorkoutModal`, `WorkoutNode`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/index.ts`

### `workout-modal.tsx`
- O que faz: implementa o componente `workout-modal`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WorkoutModal`, `useWorkoutExecution`, `reduce`, `filter`, `getState`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `@/hooks/use-workout-execution`, `@/stores`, `../modals/exercise-alternative-selector`, `./workout/cardio-config-modal`, `./workout/exercise-card-view`, `./workout/weight-tracker-overlay`, `./workout/workout-completion-view`, `./workout/workout-footer`, `./workout/workout-header`
- Expõe: `WorkoutModal`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/layout-content.tsx`, `components/organisms/workout/index.ts`

### `workout-node.tsx`
- O que faz: implementa o componente `workout-node`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WorkoutNode`, `useWorkoutStore`, `isWorkoutCompleted`, `every`, `isWorkoutInProgress`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/components/atoms/progress/progress-ring`, `@/components/ui/workout-node-button`, `@/lib/types`, `@/lib/utils`, `@/stores/workout-store`
- Expõe: `WorkoutNode`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/learn/learning-path.tsx`, `components/organisms/workout/index.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
