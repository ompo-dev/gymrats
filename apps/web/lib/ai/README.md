# ai

- Caminho: `lib/ai`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- `parsers/`: subdomínio de `lib/ai/parsers`.
- `prompts/`: subdomínio de `lib/ai/prompts`.

## Arquivos
- `cache.ts`: Arquivo da camada local.
- `client.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `cache.ts`
- O que faz: implementa o módulo `cache.ts` da camada `ai`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `getCachedResponse`, `cacheResponse`, `cleanupExpiredCache`
- Comunica com: Serviços de IA
- Onde é usado/importado: `lib/ai/client.ts`

### `client.ts`
- O que faz: implementa o módulo `client.ts` da camada `ai`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./cache`
- Expõe: `chatCompletion`, `chatCompletionStream`, `chatCompletionWithRetry`
- Comunica com: Autenticação/sessão, HTTP interno/externo, Serviços de IA
- Onde é usado/importado: `app/api/nutrition/chat-stream/route.ts`, `app/api/nutrition/chat/route.ts`, `app/api/workouts/chat-stream/route.ts`, `app/api/workouts/chat/route.ts`, `server/handlers/nutrition-ai.ts`, `server/handlers/workouts-ai.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
