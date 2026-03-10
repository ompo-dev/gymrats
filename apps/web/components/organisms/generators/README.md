# generators

- Caminho: `components/organisms/generators`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `ai-diet-generator.tsx`: Arquivo da camada local.
- `ai-workout-generator.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `ai-diet-generator.tsx`
- O que faz: implementa o componente `ai-diet-generator`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `AIDietGenerator`, `useState`, `setIsGenerating`, `join`, `generateDietWithAI`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/lib/types` (nota: `lib/mock-data` foi removido; usar APIs reais)
- Expõe: `AIDietGenerator`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/generators/index.ts`

### `ai-workout-generator.tsx`
- O que faz: implementa o componente `ai-workout-generator`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `AIWorkoutGenerator`, `useState`, `useEffect`, `getItem`, `parse`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/lib/types` (nota: `lib/mock-data` foi removido; usar APIs reais)
- Expõe: `AIWorkoutGenerator`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/generators/index.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./ai-diet-generator`, `./ai-workout-generator`
- Expõe: `AIDietGenerator`, `AIWorkoutGenerator`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/index.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
