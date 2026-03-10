# inputs

- Caminho: `components/atoms/inputs`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `index.ts`: Arquivo da camada local.
- `input.tsx`: Arquivo da camada local.
- `select.tsx`: Arquivo da camada local.
- `textarea.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./input`, `./select`, `./textarea`
- Expõe: `Input`, `Select`, `SelectOption`, `Textarea`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/index.ts`

### `input.tsx`
- O que faz: implementa o componente `input`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Input`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`
- Expõe: `Input`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/inputs/index.ts`, `components/ui/_compat.ts`

### `select.tsx`
- O que faz: implementa o componente `select`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `useState`, `find`, `useEffect`, `contains`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `lucide-react`, `react`, `@/lib/utils`
- Expõe: `Select`, `selectTriggerVariants`, `selectDropdownVariants`, `selectItemVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/inputs/index.ts`, `components/organisms/navigation/gym-selector.tsx`, `components/ui/_compat.ts`

### `textarea.tsx`
- O que faz: implementa o componente `textarea`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Textarea`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`
- Expõe: `Textarea`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/inputs/index.ts`, `components/ui/_compat.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
