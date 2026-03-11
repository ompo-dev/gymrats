# selectors

- Caminho: `components/molecules/selectors`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `index.ts`: Arquivo da camada local.
- `option-selector.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./option-selector`, `./option-selector`
- Expõe: `OptionSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/index.ts`

### `option-selector.tsx`
- O que faz: implementa o componente `option-selector`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `useState`, `setIsTapping`, `isArray`, `OptionSelector`, `useMemo`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `react`, `@/lib/utils`
- Expõe: `OptionSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/muscle-explorer.tsx`, `app/student/payments/student-payments-page.tsx`, `components/molecules/selectors/index.ts`, `components/organisms/education/components/lesson-filters.tsx`, `components/organisms/education/muscle-explorer.tsx`, `components/organisms/modals/add-meal-modal.tsx`, `components/organisms/modals/equipment-search.tsx`, `components/organisms/modals/food-search.tsx`, `components/organisms/sections/gym-map.tsx`, `components/organisms/trackers/cardio-tracker.tsx`, `components/organisms/workout/functional-workout.tsx`, `components/ui/_compat.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
