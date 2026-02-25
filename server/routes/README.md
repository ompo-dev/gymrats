# routes

- Caminho: `server/routes`
- Finalidade: backend Elysia: bootstrap, rotas, handlers, plugins e utilitários.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `auth.ts`: Arquivo da camada local.
- `exercises.ts`: Arquivo da camada local.
- `foods.ts`: Arquivo da camada local.
- `gym-subscriptions.ts`: Arquivo da camada local.
- `gyms.ts`: Arquivo da camada local.
- `memberships.ts`: Arquivo da camada local.
- `nutrition.ts`: Arquivo da camada local.
- `payment-methods.ts`: Arquivo da camada local.
- `payments.ts`: Arquivo da camada local.
- `students.ts`: Arquivo da camada local.
- `subscriptions.ts`: Arquivo da camada local.
- `users.ts`: Arquivo da camada local.
- `workouts.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `auth.ts`
- O que faz: registra rotas Elysia do domínio `auth`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `post`, `validateBody`, `badRequestResponse`, `join`, `signInUseCase`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `node:crypto`, `bcryptjs`, `elysia`, `@/lib/api/schemas`, `@/lib/auth-config`, `@/lib/db`, `@/lib/services/email.service`, `@/lib/use-cases/auth`, `@/lib/utils/session`, `../utils/cookies`, `../utils/request`, `../utils/response`
- Expõe: `authRoutes`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `exercises.ts`
- O que faz: registra rotas Elysia do domínio `exercises`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `get`, `searchExercisesHandler`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/exercises`
- Expõe: `exercisesRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `foods.ts`
- O que faz: registra rotas Elysia do domínio `foods`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `searchFoodsHandler`, `getFoodByIdHandler`, `post`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/foods`, `../handlers/nutrition`, `../plugins/auth-roles`
- Expõe: `foodsRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `gym-subscriptions.ts`
- O que faz: registra rotas Elysia do domínio `gym-subscriptions`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `getCurrentGymSubscriptionHandler`, `post`, `createGymSubscriptionHandler`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/gym-subscriptions`, `../plugins/auth-roles`
- Expõe: `gymSubscriptionsRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `gyms.ts`
- O que faz: registra rotas Elysia do domínio `gyms`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `listGymsHandler`, `post`, `createGymHandler`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/gyms`, `../plugins/auth-macro`
- Expõe: `gymsRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `memberships.ts`
- O que faz: registra rotas Elysia do domínio `memberships`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `getMembershipsHandler`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/payments`, `../plugins/auth-roles`
- Expõe: `membershipsRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `nutrition.ts`
- O que faz: registra rotas Elysia do domínio `nutrition`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `getDailyNutritionHandler`, `post`, `updateDailyNutritionHandler`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/nutrition`, `../handlers/nutrition-ai`, `../plugins/auth-roles`
- Expõe: `nutritionRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `payment-methods.ts`
- O que faz: registra rotas Elysia do domínio `payment-methods`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `getPaymentMethodsHandler`, `post`, `addPaymentMethodHandler`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/payments`, `../plugins/auth-macro`
- Expõe: `paymentMethodsRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `payments.ts`
- O que faz: registra rotas Elysia do domínio `payments`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `getPaymentsHandler`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/payments`, `../plugins/auth-roles`
- Expõe: `paymentsRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `students.ts`
- O que faz: registra rotas Elysia do domínio `students`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `getAllStudentDataHandler`, `getStudentProfileHandler`, `post`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/students`, `../plugins/auth-roles`
- Expõe: `studentsRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `subscriptions.ts`
- O que faz: registra rotas Elysia do domínio `subscriptions`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `getCurrentSubscriptionHandler`, `post`, `createSubscriptionHandler`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/subscriptions`, `../plugins/auth-roles`
- Expõe: `subscriptionsRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `users.ts`
- O que faz: registra rotas Elysia do domínio `users`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `post`, `validateBody`, `badRequestResponse`, `join`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `@/lib/api/schemas`, `@/lib/db`, `@/lib/utils/auto-trial`, `../plugins/auth-macro`, `../utils/response`, `../utils/validation`
- Expõe: `usersRoutes`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/app.ts`

### `workouts.ts`
- O que faz: registra rotas Elysia do domínio `workouts`.
- Como: declara paths/métodos, middlewares/plugins e delega execução aos handlers; integrações: `Elysia`, `use`, `get`, `getUnitsHandler`, `post`, `createUnitHandler`.
- Por que: organiza contratos por contexto de negócio e evita dispersão de endpoints.
- Importa principalmente: `elysia`, `../handlers/workout-management`, `../handlers/workouts`, `../handlers/workouts-ai`, `../plugins/auth-roles`
- Expõe: `workoutsRoutes`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/app.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
