# cards

- Caminho: `components/molecules/cards`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `duo-card.tsx`: Arquivo da camada local.
- `history-card.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `macro-card.tsx`: Arquivo da camada local.
- `meal-card.tsx`: Arquivo da camada local.
- `record-card.tsx`: Arquivo da camada local.
- `section-card.tsx`: Arquivo da camada local.
- `stat-card-large.tsx`: Arquivo da camada local.
- `stat-card.tsx`: Arquivo da camada local.
- `step-card.tsx`: Arquivo da camada local.
- `water-intake-card.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `duo-card.tsx`
- O que faz: implementa o componente `duo-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `DuoCard`, `cn`, `duoCardVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `react`, `@/lib/utils`
- Expõe: `DuoCard`, `duoCardVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/financial/financial-coupons-tab.tsx`, `app/gym/components/financial/financial-expenses-tab.tsx`, `app/gym/components/financial/financial-overview-tab.tsx`, `app/gym/components/financial/financial-payments-tab.tsx`, `app/gym/components/financial/financial-referrals-tab.tsx`, `app/gym/components/financial/subscription-plans-selector.tsx`, `app/gym/components/financial/subscription-status-card.tsx`, `app/gym/components/financial/subscription-trial-card.tsx`, `app/student/cardio/cardio-functional-page.tsx`, `app/student/education/education-page.tsx`, `app/student/payments/student-payments-page.tsx`, `app/welcome/page.tsx`

### `history-card.tsx`
- O que faz: implementa o componente `history-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `HistoryCard`, `toLocaleDateString`, `cn`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`, `./duo-card`, `./status-badge`
- Expõe: `HistoryCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/cards/index.ts`, `components/ui/_compat.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./duo-card`, `./duo-card`, `./history-card`, `./history-card`, `./macro-card`, `./macro-card`, `./meal-card`, `./meal-card`, `./record-card`, `./record-card`, `./section-card`, `./section-card`
- Expõe: `DuoCard`, `duoCardVariants`, `HistoryCard`, `MacroCard`, `MealCard`, `RecordCard`, `SectionCard`, `StatCard`, `StatCardLarge`, `StepCard`, `WaterIntakeCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/index.ts`

### `macro-card.tsx`
- O que faz: implementa o componente `macro-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `MacroCard`, `round`, `cn`, `min`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`, `./duo-card`
- Expõe: `MacroCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/cards/index.ts`, `components/organisms/trackers/nutrition-tracker.tsx`, `components/ui/_compat.ts`

### `meal-card.tsx`
- O que faz: implementa o componente `meal-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `MealCard`, `includes`, `cn`, `getMealIcon`, `stopPropagation`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/components/ui/food-item-card`, `@/lib/types`, `@/lib/utils`, `./duo-card`
- Expõe: `MealCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/cards/index.ts`, `components/organisms/trackers/nutrition-tracker.tsx`, `components/ui/_compat.ts`

### `record-card.tsx`
- O que faz: implementa o componente `record-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `RecordCard`, `toLocaleDateString`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`, `./duo-card`
- Expõe: `RecordCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/cards/index.ts`, `components/ui/_compat.ts`

### `section-card.tsx`
- O que faz: implementa o componente `section-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `SectionCard`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/lib/utils`, `./duo-card`
- Expõe: `SectionCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/financial/financial-coupons-tab.tsx`, `app/gym/components/financial/financial-expenses-tab.tsx`, `app/gym/components/financial/financial-overview-tab.tsx`, `app/gym/components/financial/financial-payments-tab.tsx`, `app/gym/components/financial/financial-referrals-tab.tsx`, `app/gym/components/financial/subscription-plans-selector.tsx`, `app/gym/components/financial/subscription-status-card.tsx`, `app/student/cardio/cardio-functional-page.tsx`, `app/student/education/muscle-explorer.tsx`, `app/student/learn/learning-path.tsx`, `app/student/payments/student-payments-page.tsx`, `components/molecules/cards/index.ts`

### `stat-card-large.tsx`
- O que faz: implementa o componente `stat-card-large`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `StatCardLarge`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/lib/utils`, `./duo-card`
- Expõe: `StatCardLarge`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/financial/financial-overview-tab.tsx`, `app/student/cardio/cardio-functional-page.tsx`, `app/student/diet/diet-page.tsx`, `app/student/page-content.tsx`, `app/student/payments/student-payments-page.tsx`, `components/molecules/cards/index.ts`, `components/organisms/trackers/cardio-tracker.tsx`, `components/organisms/trackers/weight-tracker.tsx`, `components/ui/_compat.ts`

### `stat-card.tsx`
- O que faz: implementa o componente `stat-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `StatCard`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`, `./duo-card`
- Expõe: `StatCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/cards/index.ts`, `components/ui/_compat.ts`

### `step-card.tsx`
- O que faz: implementa o componente `step-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `StepCard`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `react`, `@/components/ui/card`
- Expõe: `StepCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/onboarding/steps/step1.tsx`, `app/gym/onboarding/steps/step2.tsx`, `app/gym/onboarding/steps/step3.tsx`, `app/gym/onboarding/steps/step4.tsx`, `app/student/onboarding/steps/consolidated-step1.tsx`, `app/student/onboarding/steps/consolidated-step3.tsx`, `app/student/onboarding/steps/step1.tsx`, `app/student/onboarding/steps/step2.tsx`, `app/student/onboarding/steps/step3.tsx`, `app/student/onboarding/steps/step4.tsx`, `app/student/onboarding/steps/step5.tsx`, `app/student/onboarding/steps/step6.tsx`

### `water-intake-card.tsx`
- O que faz: implementa o componente `water-intake-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WaterIntakeCard`, `min`, `from`, `map`, `onToggleGlass`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/lib/utils`, `./section-card`
- Expõe: `WaterIntakeCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/cards/index.ts`, `components/organisms/trackers/nutrition-tracker.tsx`, `components/ui/_compat.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
