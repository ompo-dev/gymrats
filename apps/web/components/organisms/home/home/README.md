# home

- Caminho: `components/organisms/home/home`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `continue-workout-card.tsx`: Arquivo da camada local.
- `level-progress-card.tsx`: Arquivo da camada local.
- `nutrition-status-card.tsx`: Arquivo da camada local.
- `recent-workouts-card.tsx`: Arquivo da camada local.
- `weight-progress-card.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `continue-workout-card.tsx`
- O que faz: implementa o componente `continue-workout-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ContinueWorkoutCard`, `useRouter`, `find`, `findNextWorkout`, `findLastCompletedWorkout`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/section-card`, `@/lib/types`
- Expõe: `ContinueWorkoutCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`

### `level-progress-card.tsx`
- O que faz: implementa o componente `level-progress-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LevelProgressCard`, `floor`, `min`, `toLocaleString`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/molecules/cards/section-card`
- Expõe: `LevelProgressCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`

### `nutrition-status-card.tsx`
- O que faz: implementa o componente `nutrition-status-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `NutritionStatusCard`, `useRouter`, `useStudent`, `useMemo`, `hasActivePremiumStatus`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/section-card`, `@/hooks/use-student`, `@/lib/types`, `@/lib/utils/subscription-helpers`
- Expõe: `NutritionStatusCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`

### `recent-workouts-card.tsx`
- O que faz: implementa o componente `recent-workouts-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `RecentWorkoutsCard`, `slice`, `setDate`, `getDate`, `toDateString`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `RecentWorkoutsCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`

### `weight-progress-card.tsx`
- O que faz: implementa o componente `weight-progress-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WeightProgressCard`, `getWeightIcon`, `slice`, `reverse`, `max`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/molecules/cards/section-card`, `@/lib/utils`
- Expõe: `WeightProgressCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
