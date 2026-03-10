# utils

- Caminho: `server/utils`
- Finalidade: backend Elysia: bootstrap, rotas, handlers, plugins e utilitários.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `cookies.ts`: Arquivo da camada local.
- `json.ts`: Arquivo da camada local.
- `logger.ts`: Arquivo da camada local.
- `request.ts`: Arquivo da camada local.
- `response.ts`: Arquivo da camada local.
- `validation.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `cookies.ts`
- O que faz: normaliza escrita/remoção de cookies no backend.
- Como: gera/concatena cabeçalhos `Set-Cookie` com flags e expiração, sem sobrescrever valores existentes.
- Por que: padroniza política de sessão na camada HTTP e evita inconsistências de segurança.
- Importa principalmente: `elysia`
- Expõe: `appendSetCookie`, `setCookieHeader`, `deleteCookieHeader`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/routes/auth.ts`

### `json.ts`
- O que faz: faz parsing JSON tolerante a erro para entradas de rota.
- Como: encapsula parse seguro (objeto/array) com fallback previsível para payload inválido.
- Por que: evita exceções não tratadas durante parse e simplifica validação em handlers.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `parseJsonSafe`, `parseJsonArray`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `server/handlers/gyms.ts`, `server/handlers/students.ts`, `server/handlers/workouts.ts`

### `logger.ts`
- O que faz: padroniza logging estruturado de request/erro no backend.
- Como: expõe utilitários baseados em `pino` para registrar contexto HTTP, latência e falhas com metadados consistentes.
- Por que: melhora observabilidade operacional e acelera diagnóstico em produção.
- Importa principalmente: `pino`
- Expõe: `logApiRequest`, `logApiError`
- Comunica com: Autenticação/sessão, Observabilidade/logs
- Onde é usado/importado: `server/plugins/request-logger.ts`

### `request.ts`
- O que faz: extrai cookies específicos do header bruto da requisição.
- Como: parseia o campo `cookie`, quebra pares chave/valor e aplica decode seguro do valor solicitado.
- Por que: elimina duplicação de parsing e mantém acesso a sessão previsível entre rotas/plugins.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `getCookieValue`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `server/routes/auth.ts`

### `response.ts`
- O que faz: uniformiza envelopes de sucesso/erro e status HTTP na API.
- Como: fornece helpers tipados (`successResponse`, `badRequestResponse`, `internalErrorResponse` etc.) para construir respostas consistentes.
- Por que: preserva contrato estável para clientes e reduz divergência de tratamento de erro por handler.
- Importa principalmente: `elysia`
- Expõe: `successResponse`, `errorResponse`, `badRequestResponse`, `unauthorizedResponse`, `forbiddenResponse`, `notFoundResponse`, `internalErrorResponse`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/handlers/exercises.ts`, `server/handlers/foods.ts`, `server/handlers/gym-subscriptions.ts`, `server/handlers/gyms.ts`, `server/handlers/nutrition-ai.ts`, `server/handlers/nutrition.ts`, `server/handlers/payments.ts`, `server/handlers/students.ts`, `server/handlers/subscriptions.ts`, `server/handlers/workout-management.ts`, `server/handlers/workouts-ai.ts`, `server/handlers/workouts.ts`

### `validation.ts`
- O que faz: padroniza validação de body/query com schemas.
- Como: encapsula chamadas de validação e retorno de erros estruturados quando input não atende ao contrato.
- Por que: evita validação ad-hoc por rota e reduz risco de entrada inválida avançar no fluxo.
- Importa principalmente: `zod`
- Expõe: `validateBody`, `validateQuery`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `server/handlers/gym-subscriptions.ts`, `server/handlers/gyms.ts`, `server/handlers/nutrition.ts`, `server/handlers/payments.ts`, `server/handlers/students.ts`, `server/handlers/subscriptions.ts`, `server/handlers/workouts.ts`, `server/routes/auth.ts`, `server/routes/users.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
