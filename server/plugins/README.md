# plugins

- Caminho: `server/plugins`
- Finalidade: backend Elysia: bootstrap, rotas, handlers, plugins e utilitários.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `auth-macro.ts`: Arquivo da camada local.
- `auth-roles.ts`: Arquivo da camada local.
- `auth.ts`: Arquivo da camada local.
- `cors.ts`: Arquivo da camada local.
- `db.ts`: Arquivo da camada local.
- `request-logger.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `auth-macro.ts`
- O que faz: implementa o módulo `auth-macro.ts` da camada `plugins`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `elysia`, `@/lib/auth-config`, `@/lib/db`
- Expõe: `authMacro`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, Runtime Elysia
- Onde é usado/importado: `server/app.ts`, `server/routes/gyms.ts`, `server/routes/payment-methods.ts`, `server/routes/users.ts`

### `auth-roles.ts`
- O que faz: implementa o módulo `auth-roles.ts` da camada `plugins`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `elysia`, `@/lib/auth-config`, `@/lib/db`
- Expõe: `authRolesMacro`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, Runtime Elysia
- Onde é usado/importado: `server/app.ts`, `server/routes/foods.ts`, `server/routes/gym-subscriptions.ts`, `server/routes/memberships.ts`, `server/routes/nutrition.ts`, `server/routes/payments.ts`, `server/routes/students.ts`, `server/routes/subscriptions.ts`, `server/routes/workouts.ts`

### `auth.ts`
- O que faz: implementa o módulo `auth.ts` da camada `plugins`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@elysiajs/cors`, `elysia`, `@/lib/auth-config`
- Expõe: `betterAuthPlugin`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `cors.ts`
- O que faz: implementa o módulo `cors.ts` da camada `plugins`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@elysiajs/cors`, `elysia`
- Expõe: `corsPlugin`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `db.ts`
- O que faz: implementa o módulo `db.ts` da camada `plugins`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `elysia`, `@/lib/db`
- Expõe: `dbPlugin`
- Comunica com: Banco de dados (Prisma), Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `request-logger.ts`
- O que faz: implementa o módulo `request-logger.ts` da camada `plugins`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `elysia`, `../utils/logger`
- Expõe: `requestLoggerPlugin`
- Comunica com: Runtime Elysia, Observabilidade/logs
- Onde é usado/importado: `server/app.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
