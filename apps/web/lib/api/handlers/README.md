# handlers

- Caminho: `lib/api/handlers`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `gym-subscriptions.handler.ts`: Arquivo da camada local.
- `gyms.handler.ts`: Arquivo da camada local.
- `nutrition.handler.ts`: Arquivo da camada local.
- `payments.handler.ts`: Arquivo da camada local.
- `students.handler.ts`: Arquivo da camada local.
- `subscriptions.handler.ts`: Arquivo da camada local.
- `workout-management.handler.ts`: Arquivo da camada local.
- `workouts.handler.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `gym-subscriptions.handler.ts`
- O que faz: implementa o módulo `gym-subscriptions.handler.ts` da camada `handlers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `@/app/gym/actions`, `@/lib/db`, `@/lib/utils/subscription`, `../middleware/auth.middleware`, `../middleware/validation.middleware`, `../schemas`, `../utils/response.utils`
- Expõe: `getCurrentGymSubscriptionHandler`, `createGymSubscriptionHandler`, `startGymTrialHandler`, `cancelGymSubscriptionHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `gyms.handler.ts`
- O que faz: implementa o módulo `gyms.handler.ts` da camada `handlers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `@/lib/db`, `../middleware/auth.middleware`, `../middleware/validation.middleware`, `../schemas`, `../utils/response.utils`
- Expõe: `listGymsHandler`, `createGymHandler`, `getGymProfileHandler`, `setActiveGymHandler`, `getGymLocationsHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `nutrition.handler.ts`
- O que faz: implementa o módulo `nutrition.handler.ts` da camada `handlers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `zod`, `@/lib/db`, `@/lib/utils/brazil-nutrition-date`, `../middleware/auth.middleware`, `../middleware/validation.middleware`, `../schemas`, `../utils/response.utils`
- Expõe: `getDailyNutritionHandler`, `updateDailyNutritionHandler`, `searchFoodsHandler`, `getFoodByIdHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `payments.handler.ts`
- O que faz: implementa o módulo `payments.handler.ts` da camada `handlers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `zod`, `@/lib/db`, `../middleware/auth.middleware`, `../middleware/validation.middleware`, `../schemas`, `../utils/response.utils`
- Expõe: `getPaymentsHandler`, `getPaymentMethodsHandler`, `addPaymentMethodHandler`, `getMembershipsHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `students.handler.ts`
- O que faz: implementa o módulo `students.handler.ts` da camada `handlers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `@/app/student/actions-unified`, `@/lib/db`, `@/lib/utils/auto-trial`, `../middleware/auth.middleware`, `../middleware/validation.middleware`, `../schemas`, `../utils/response.utils`
- Expõe: `getAllStudentDataHandler`, `getStudentProfileHandler`, `updateStudentProfileHandler`, `getWeightHistoryHandler`, `addWeightHandler`, `getWeightHistoryFilteredHandler`, `getStudentProgressHandler`, `updateStudentProgressHandler`, `getStudentInfoHandler`, `getPersonalRecordsHandler`, `getDayPassesHandler`, `getFriendsHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `subscriptions.handler.ts`
- O que faz: implementa o módulo `subscriptions.handler.ts` da camada `handlers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `@/app/student/actions`, `@/lib/db`, `@/lib/utils/auto-trial`, `@/lib/utils/subscription`, `../middleware/auth.middleware`, `../middleware/validation.middleware`, `../schemas`, `../utils/response.utils`
- Expõe: `getCurrentSubscriptionHandler`, `createSubscriptionHandler`, `startTrialHandler`, `cancelSubscriptionHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `workout-management.handler.ts`
- O que faz: implementa o módulo `workout-management.handler.ts` da camada `handlers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `@/lib/db`, `@/lib/educational-data`, `@/lib/services/personalized-workout-generator`, `@/lib/types`, `../middleware/auth.middleware`, `../schemas/workouts.schemas`, `../utils/response.utils`
- Expõe: `createUnitHandler`, `updateUnitHandler`, `deleteUnitHandler`, `createWorkoutHandler`, `updateWorkoutHandler`, `deleteWorkoutHandler`, `createExerciseHandler`, `updateExerciseHandler`, `deleteExerciseHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo, Observabilidade/logs
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `workouts.handler.ts`
- O que faz: implementa o módulo `workouts.handler.ts` da camada `handlers`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `@/lib/db`, `../middleware/auth.middleware`, `../middleware/validation.middleware`, `../schemas`, `../utils/response.utils`
- Expõe: `getUnitsHandler`, `completeWorkoutHandler`, `saveWorkoutProgressHandler`, `getWorkoutProgressHandler`, `deleteWorkoutProgressHandler`, `getWorkoutHistoryHandler`, `updateExerciseLogHandler`, `updateWorkoutProgressExerciseHandler`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
