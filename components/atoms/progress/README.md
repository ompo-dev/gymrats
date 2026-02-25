# progress

- Caminho: `components/atoms/progress`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `exercise-steppers.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `progress-ring.tsx`: Arquivo da camada local.
- `progress.tsx`: Arquivo da camada local.
- `stepper-dot.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `exercise-steppers.tsx`
- O que faz: implementa o componente `exercise-steppers`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ExerciseSteppers`, `cn`, `map`, `includes`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@/lib/utils`, `./stepper-dot`
- Expõe: `ExerciseSteppers`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/progress/index.ts`, `components/organisms/workout/workout/weight-tracker-overlay.tsx`, `components/organisms/workout/workout/workout-header.tsx`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./exercise-steppers`, `./progress`, `./progress-ring`, `./stepper-dot`, `./stepper-dot`
- Expõe: `ExerciseSteppers`, `Progress`, `ProgressRing`, `StepperDot`, `stepperDotVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/index.ts`

### `progress-ring.tsx`
- O que faz: implementa o componente `progress-ring`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ProgressRing`, `useState`, `useEffect`, `setAnimatedProgress`, `setInterval`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `react`, `@/lib/utils`
- Expõe: `ProgressRing`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/progress/index.ts`, `components/organisms/workout/workout-node.tsx`, `components/ui/_compat.ts`

### `progress.tsx`
- O que faz: implementa o componente `progress`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Progress`, `min`, `max`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-progress`, `react`, `@/lib/utils`
- Expõe: `Progress`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/progress/index.ts`, `components/ui/_compat.ts`

### `stepper-dot.tsx`
- O que faz: implementa o componente `stepper-dot`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `StepperDot`, `cn`, `stepperDotVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `@/lib/utils`
- Expõe: `StepperDot`, `stepperDotVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/progress/exercise-steppers.tsx`, `components/atoms/progress/index.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
