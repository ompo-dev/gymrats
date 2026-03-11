# handlers

- Caminho: `server/handlers`
- Finalidade: backend Elysia: bootstrap, rotas, handlers, plugins e utilitários.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `exercises.ts`: Arquivo da camada local.
- `foods.ts`: Arquivo da camada local.
- `gym-subscriptions.ts`: Arquivo da camada local.
- `gyms.ts`: Arquivo da camada local.
- `nutrition-ai.ts`: Arquivo da camada local.
- `nutrition.ts`: Arquivo da camada local.
- `payments.ts`: Arquivo da camada local.
- `students.ts`: Arquivo da camada local.
- `subscriptions.ts`: Arquivo da camada local.
- `workout-management.ts`: Arquivo da camada local.
- `workouts-ai.ts`: Arquivo da camada local.
- `workouts.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `exercises.ts`
- O que faz: implementa casos de uso do domínio `exercises` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `coerceInt`, `parseInt`, `isNaN`, `min`, `max`, `searchExercisesHandler`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/educational-data`, `../utils/response`
- Expõe: `searchExercisesHandler`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/routes/exercises.ts`

### `foods.ts`
- O que faz: implementa casos de uso do domínio `foods` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `uploadFoodsHandler`, `formData`, `get`, `text`, `join`, `cwd`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `node:fs/promises`, `node:path`, `elysia`, `@/lib/services/upload-foods-from-csv`, `../utils/response`
- Expõe: `uploadFoodsHandler`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/routes/foods.ts`

### `gym-subscriptions.ts`
- O que faz: implementa casos de uso do domínio `gym-subscriptions` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `getActiveGymId`, `findUnique`, `getCurrentGymSubscriptionHandler`, `successResponse`, `count`, `max`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/api/schemas`, `@/lib/db`, `@/lib/utils/subscription`, `../utils/response`, `../utils/validation`
- Expõe: `getCurrentGymSubscriptionHandler`, `createGymSubscriptionHandler`, `startGymTrialHandler`, `cancelGymSubscriptionHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/routes/gym-subscriptions.ts`

### `gyms.ts`
- O que faz: implementa casos de uso do domínio `gyms` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `listGymsHandler`, `findMany`, `some`, `map`, `successResponse`, `error`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/api/schemas`, `@/lib/db`, `../utils/json`, `../utils/response`, `../utils/validation`
- Expõe: `listGymsHandler`, `createGymHandler`, `getGymProfileHandler`, `setActiveGymHandler`, `getGymLocationsHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/routes/gyms.ts`

### `nutrition-ai.ts`
- O que faz: implementa casos de uso do domínio `nutrition-ai` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `nutritionChatHandler`, `findUnique`, `hasActivePremiumStatus`, `toISOString`, `split`, `findFirst`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/ai/client`, `@/lib/ai/parsers/nutrition-parser`, `@/lib/ai/prompts/nutrition`, `@/lib/db`, `@/lib/utils/subscription`, `../utils/response`
- Expõe: `nutritionChatHandler`
- Comunica com: Banco de dados (Prisma), Runtime Elysia
- Onde é usado/importado: `server/routes/nutrition.ts`

### `nutrition.ts`
- O que faz: implementa casos de uso do domínio `nutrition` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `getDailyNutritionHandler`, `validateQuery`, `badRequestResponse`, `join`, `toISOString`, `split`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/api/schemas/nutrition.schemas`, `@/lib/db`, `../utils/response`, `../utils/validation`
- Expõe: `getDailyNutritionHandler`, `updateDailyNutritionHandler`, `searchFoodsHandler`, `getFoodByIdHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/routes/foods.ts`, `server/routes/nutrition.ts`

### `payments.ts`
- O que faz: implementa casos de uso do domínio `payments` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `getPaymentsHandler`, `internalErrorResponse`, `validateQuery`, `badRequestResponse`, `join`, `findMany`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/api/schemas`, `@/lib/db`, `../utils/response`, `../utils/validation`
- Expõe: `getPaymentsHandler`, `getPaymentMethodsHandler`, `addPaymentMethodHandler`, `getMembershipsHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/routes/memberships.ts`, `server/routes/payment-methods.ts`, `server/routes/payments.ts`

### `students.ts`
- O que faz: implementa casos de uso do domínio `students` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `formatProfileResponse`, `getAllStudentDataHandler`, `validateQuery`, `badRequestResponse`, `join`, `split`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `zod`, `@/lib/api/schemas`, `@/lib/db`, `@/lib/types`, `@/lib/utils/auto-trial`, `../utils/json`, `../utils/response`, `../utils/validation`
- Expõe: `getAllStudentDataHandler`, `getStudentProfileHandler`, `updateStudentProfileHandler`, `getWeightHistoryHandler`, `addWeightHandler`, `getWeightHistoryFilteredHandler`, `getStudentProgressHandler`, `updateStudentProgressHandler`, `getStudentInfoHandler`, `getPersonalRecordsHandler`, `getDayPassesHandler`, `getFriendsHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/routes/students.ts`

### `subscriptions.ts`
- O que faz: implementa casos de uso do domínio `subscriptions` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `getCurrentSubscriptionHandler`, `findUnique`, `successResponse`, `error`, `internalErrorResponse`, `createSubscriptionHandler`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/api/schemas/subscriptions.schemas`, `@/lib/db`, `../utils/response`, `../utils/validation`
- Expõe: `getCurrentSubscriptionHandler`, `createSubscriptionHandler`, `startTrialHandler`, `cancelSubscriptionHandler`, `activatePremiumHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/routes/subscriptions.ts`

### `workout-management.ts`
- O que faz: implementa casos de uso do domínio `workout-management` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `createUnitHandler`, `safeParse`, `badRequestResponse`, `findFirst`, `create`, `successResponse`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/api/schemas/workouts.schemas`, `@/lib/db`, `@/lib/educational-data`, `@/lib/services/personalized-workout-generator`, `@/lib/types`, `../utils/response`
- Expõe: `createUnitHandler`, `updateUnitHandler`, `deleteUnitHandler`, `createWorkoutHandler`, `updateWorkoutHandler`, `deleteWorkoutHandler`, `createExerciseHandler`, `updateExerciseHandler`, `deleteExerciseHandler`, `createExerciseAlternatives`, `inferExerciseFromProfile`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/routes/workouts.ts`

### `workouts-ai.ts`
- O que faz: implementa casos de uso do domínio `workouts-ai` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `generateWorkoutsHandler`, `findUnique`, `count`, `deleteMany`, `parse`, `generatePersonalizedWorkoutPlan`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/ai/client`, `@/lib/ai/parsers/workout-parser`, `@/lib/ai/prompts/workout`, `@/lib/db`, `@/lib/educational-data`, `@/lib/utils/subscription`, `@/lib/services/personalized-workout-generator`, `@/lib/services/populate-workout-exercises-educational-data`, `@/lib/types`, `../utils/response`
- Expõe: `generateWorkoutsHandler`, `updateAlternativesHandler`, `populateEducationalDataHandler`, `processWorkoutsCommandHandler`, `chatWorkoutsHandler`, `chatStreamWorkoutsHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Runtime Elysia, Observabilidade/logs
- Onde é usado/importado: `server/routes/workouts.ts`

### `workouts.ts`
- O que faz: implementa casos de uso do domínio `workouts` no backend.
- Como: aplica validação, consulta/mutação e composição de resposta em um fluxo coeso; operações-chave: `getUnitsHandler`, `badRequestResponse`, `findMany`, `Set`, `map`, `has`.
- Por que: mantém rotas finas, favorece testabilidade e separa protocolo HTTP da lógica de aplicação.
- Importa principalmente: `elysia`, `@/lib/api/schemas/workouts.schemas`, `@/lib/db`, `@/lib/types`, `../utils/json`, `../utils/response`, `../utils/validation`
- Expõe: `getUnitsHandler`, `completeWorkoutHandler`, `saveWorkoutProgressHandler`, `getWorkoutProgressHandler`, `deleteWorkoutProgressHandler`, `getWorkoutHistoryHandler`, `updateExerciseLogHandler`, `updateWorkoutProgressExerciseHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Runtime Elysia
- Onde é usado/importado: `server/routes/workouts.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
