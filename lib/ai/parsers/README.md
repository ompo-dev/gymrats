# parsers

- Caminho: `lib/ai/parsers`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `nutrition-parser.ts`: Arquivo da camada local.
- `workout-parser.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `nutrition-parser.ts`
- O que faz: implementa o módulo `nutrition-parser.ts` da camada `parsers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/types`
- Expõe: `extractFoodsAndPartialFromStream`, `parseNutritionResponse`, `parsedFoodToFoodItem`
- Comunica com: Serviços de IA
- Onde é usado/importado: `app/api/nutrition/chat-stream/route.ts`, `app/api/nutrition/chat/route.ts`, `components/organisms/modals/food-search-chat.tsx`, `server/handlers/nutrition-ai.ts`

### `workout-parser.ts`
- O que faz: implementa o módulo `workout-parser.ts` da camada `parsers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `extractWorkoutsFromStream`, `extractWorkoutsAndPartialFromStream`, `parseWorkoutResponse`
- Comunica com: Serviços de IA
- Onde é usado/importado: `app/api/workouts/chat-stream/route.ts`, `app/api/workouts/chat/route.ts`, `server/handlers/workouts-ai.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
