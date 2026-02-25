# home

- Caminho: `components/home`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `level-progress-card.tsx`: Arquivo da camada local.
- `recent-workouts-card.tsx`: Arquivo da camada local.
- `weight-progress-card.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `level-progress-card.tsx`
- O que faz: implementa o componente `level-progress-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LevelProgressCard`, `floor`, `min`, `toLocaleString`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/ui/section-card`
- Expõe: `LevelProgressCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `recent-workouts-card.tsx`
- O que faz: implementa o componente `recent-workouts-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `RecentWorkoutsCard`, `slice`, `setDate`, `getDate`, `toDateString`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/ui/duo-card`, `@/components/ui/section-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `RecentWorkoutsCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `weight-progress-card.tsx`
- O que faz: implementa o componente `weight-progress-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WeightProgressCard`, `getWeightIcon`, `slice`, `reverse`, `max`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/ui/section-card`, `@/lib/utils`
- Expõe: `WeightProgressCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
