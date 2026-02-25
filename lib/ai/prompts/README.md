# prompts

- Caminho: `lib/ai/prompts`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `nutrition.ts`: Arquivo da camada local.
- `workout.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `nutrition.ts`
- O que faz: implementa o módulo `nutrition.ts` da camada `prompts`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `NUTRITION_SYSTEM_PROMPT`, `NUTRITION_INITIAL_MESSAGE`
- Comunica com: Serviços de IA
- Onde é usado/importado: `app/api/nutrition/chat-stream/route.ts`, `app/api/nutrition/chat/route.ts`, `components/organisms/modals/food-search-chat.tsx`, `server/handlers/nutrition-ai.ts`

### `workout.ts`
- O que faz: implementa o módulo `workout.ts` da camada `prompts`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `WORKOUT_SYSTEM_PROMPT`, `WORKOUT_INITIAL_MESSAGE`
- Comunica com: Serviços de IA
- Onde é usado/importado: `app/api/workouts/chat-stream/route.ts`, `app/api/workouts/chat/route.ts`, `components/organisms/modals/workout-chat.tsx`, `server/handlers/workouts-ai.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
