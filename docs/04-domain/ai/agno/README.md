# agno

- Caminho: `docs/04-domain/ai/agno`
- Finalidade: documentação técnica e funcional organizada por domínio.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `ESTUDO_LLMS_FULL.md`: Arquivo da camada local.
- `PLANO_IMPLEMENTACAO_CHAT_IA.md`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `ESTUDO_LLMS_FULL.md`
- O que faz: documenta decisões e operação referentes a `docs/04-domain/ai/agno/ESTUDO_LLMS_FULL.md`.
- Como: organiza instruções, contexto de arquitetura e referências de manutenção para o time.
- Por que: reduz custo de onboarding e evita conhecimento implícito disperso.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `POST`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Offline/sincronização, Serviços de IA
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `PLANO_IMPLEMENTACAO_CHAT_IA.md`
- O que faz: documenta decisões e operação referentes a `docs/04-domain/ai/agno/PLANO_IMPLEMENTACAO_CHAT_IA.md`.
- Como: organiza instruções, contexto de arquitetura e referências de manutenção para o time.
- Por que: reduz custo de onboarding e evita conhecimento implícito disperso.
- Importa principalmente: `./cache`, `@/lib/utils/subscription`, `@/lib/utils/session`, `next/server`, `crypto`, `@/lib/ai/client`
- Expõe: `chatCompletion`, `chatCompletionWithRetry`, `requirePremium`, `POST`, `mapFoodToDatabase`, `mapExercisesToDatabase`, `getCachedResponse`, `cacheResponse`, `NUTRITION_SYSTEM_PROMPT`, `WORKOUT_SYSTEM_PROMPT`
- Comunica com: Autenticação/sessão, HTTP interno/externo, Serviços de IA
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
