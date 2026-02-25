# chat-stream

- Caminho: `app/api/workouts/chat-stream`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.
- Endpoint base deste diretorio: `/api/workouts/chat-stream`

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `route.ts`: Endpoint HTTP (App Router).

## Detalhamento técnico por arquivo

### `route.ts`
- O que faz: implementa o endpoint `/api/workouts/chat-stream` com método(s) `POST`.
- Como: lê request, aplica validações/autorização e delega para handlers/casos de uso (ex.: `sendSSE`, `stringify`, `enqueue`, `TextEncoder`, `encode`), serializando resposta HTTP.
- Por que: isola a borda HTTP do núcleo de negócio e facilita evolução de contrato por rota.
- Importa principalmente: `next/server`, `@/lib/ai/client`, `@/lib/ai/parsers/workout-parser`, `@/lib/ai/prompts/workout`, `@/lib/api/middleware/auth.middleware`, `@/lib/db`, `@/lib/utils/subscription`
- Expõe: `POST`, `maxDuration`, `runtime`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo, Serviços de IA
- Onde é usado/importado: resolvido automaticamente pelo App Router no path da pasta (sem import manual).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
