# utils

- Caminho: `lib/api/utils`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `api-wrapper.ts`: Arquivo da camada local.
- `error.utils.ts`: Arquivo da camada local.
- `response.utils.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `api-wrapper.ts`
- O que faz: implementa o módulo `api-wrapper.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `zod`, `../middleware/auth.middleware`
- Expõe: `createSafeHandler`
- Comunica com: Autenticação/sessão
- Onde é usado/importado: `app/api/gyms/checkin/route.ts`, `app/api/gyms/checkout/route.ts`, `app/api/gyms/equipment/route.ts`, `app/api/gyms/expenses/route.ts`, `app/api/gyms/members/route.ts`, `app/api/gyms/payments/route.ts`, `app/api/gyms/plans/route.ts`, `app/api/students/all/route.ts`, `app/api/students/profile/route.ts`, `app/api/students/progress/route.ts`, `app/api/workouts/chat/route.ts`

### `error.utils.ts`
- O que faz: implementa o módulo `error.utils.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./response.utils`
- Expõe: `handleApiError`, `withErrorHandling`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `response.utils.ts`
- O que faz: implementa o módulo `response.utils.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`
- Expõe: `successResponse`, `errorResponse`, `badRequestResponse`, `unauthorizedResponse`, `forbiddenResponse`, `notFoundResponse`, `internalErrorResponse`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
