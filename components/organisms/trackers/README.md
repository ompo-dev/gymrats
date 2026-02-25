# trackers

- Caminho: `components/organisms/trackers`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `cardio-tracker.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `nutrition-tracker.tsx`: Arquivo da camada local.
- `weight-tracker.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `cardio-tracker.tsx`
- O que faz: implementa o componente `cardio-tracker`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `CardioTracker`, `useState`, `find`, `calculateTargetHeartRateZone`, `calculateCardioCalories`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/components/molecules/cards/stat-card-large`, `@/components/molecules/selectors/option-selector`, `@/lib/calorie-calculator`, `@/lib/types`
- Expõe: `CardioTracker`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/cardio/cardio-functional-page.tsx`, `components/organisms/trackers/index.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./cardio-tracker`, `./nutrition-tracker`, `./nutrition-tracker`, `./weight-tracker`, `./weight-tracker`
- Expõe: `CardioTracker`, `NutritionTracker`, `WeightTracker`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/index.ts`

### `nutrition-tracker.tsx`
- O que faz: implementa o componente `nutrition-tracker`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `NutritionTracker`, `setExpandedMealId`, `setExpandedFoodId`, `useMemo`, `floor`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/macro-card`, `@/components/molecules/cards/meal-card`, `@/components/molecules/cards/section-card`, `@/components/molecules/cards/water-intake-card`, `@/lib/types`
- Expõe: `NutritionTracker`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/diet/diet-page.tsx`, `components/organisms/trackers/index.ts`

### `weight-tracker.tsx`
- O que faz: implementa o componente `weight-tracker`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `getNotesSafe`, `normalizeExistingLog`, `isArray`, `filter`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/stat-card-large`, `@/lib/types`, `@/lib/utils`
- Expõe: `WeightTracker`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/trackers/index.ts`, `components/organisms/workout/workout/weight-tracker-overlay.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
