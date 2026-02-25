# schemas

- Caminho: `lib/api/schemas`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `auth.schemas.ts`: Arquivo da camada local.
- `gyms.schemas.ts`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `nutrition.schemas.ts`: Arquivo da camada local.
- `payments.schemas.ts`: Arquivo da camada local.
- `students.schemas.ts`: Arquivo da camada local.
- `subscriptions.schemas.ts`: Arquivo da camada local.
- `workouts.schemas.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `auth.schemas.ts`
- O que faz: implementa o módulo `auth.schemas.ts` da camada `schemas`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `zod`
- Expõe: `signUpSchema`, `signInSchema`, `updateRoleSchema`, `updateUserRoleSchema`, `forgotPasswordSchema`, `verifyResetCodeSchema`, `resetPasswordSchema`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `gyms.schemas.ts`
- O que faz: implementa o módulo `gyms.schemas.ts` da camada `schemas`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `zod`
- Expõe: `createGymSchema`, `setActiveGymSchema`, `gymLocationsQuerySchema`, `gymMembersQuerySchema`, `createGymMemberSchema`, `gymExpensesQuerySchema`, `createGymExpenseSchema`, `gymPaymentsQuerySchema`, `createGymPaymentSchema`, `gymPlansQuerySchema`, `createGymPlanSchema`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `index.ts`
- O que faz: implementa o módulo `index.ts` da camada `schemas`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./auth.schemas`, `./gyms.schemas`, `./nutrition.schemas`, `./payments.schemas`, `./students.schemas`, `./subscriptions.schemas`, `./workouts.schemas`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, `app/api/auth/sign-in/route.ts`, `app/api/auth/sign-up/route.ts`, `app/api/auth/update-role/route.ts`, `app/api/auth/verify-reset-code/route.ts`, `app/api/users/update-role/route.ts`, `lib/api/handlers/gym-subscriptions.handler.ts`, `lib/api/handlers/gyms.handler.ts`, `lib/api/handlers/nutrition.handler.ts`, `lib/api/handlers/payments.handler.ts`, `lib/api/handlers/students.handler.ts`

### `nutrition.schemas.ts`
- O que faz: implementa o módulo `nutrition.schemas.ts` da camada `schemas`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `zod`
- Expõe: `updateDailyNutritionSchema`, `dailyNutritionUpdateSchema`, `dailyNutritionQuerySchema`, `searchFoodsQuerySchema`, `foodSearchQuerySchema`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `payments.schemas.ts`
- O que faz: implementa o módulo `payments.schemas.ts` da camada `schemas`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `zod`
- Expõe: `paymentsQuerySchema`, `addPaymentMethodSchema`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `students.schemas.ts`
- O que faz: implementa o módulo `students.schemas.ts` da camada `schemas`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `zod`
- Expõe: `updateStudentProfileSchema`, `addWeightSchema`, `weightHistoryQuerySchema`, `studentSectionsQuerySchema`, `updateStudentProgressSchema`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `subscriptions.schemas.ts`
- O que faz: implementa o módulo `subscriptions.schemas.ts` da camada `schemas`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `zod`
- Expõe: `createSubscriptionSchema`, `createGymSubscriptionSchema`, `startTrialSchema`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `workouts.schemas.ts`
- O que faz: implementa o módulo `workouts.schemas.ts` da camada `schemas`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `zod`
- Expõe: `createUnitSchema`, `updateUnitSchema`, `createWorkoutSchema`, `updateWorkoutSchema`, `createWorkoutExerciseSchema`, `updateWorkoutExerciseSchema`, `completeWorkoutSchema`, `saveWorkoutProgressSchema`, `workoutHistoryQuerySchema`, `updateExerciseLogSchema`, `updateWorkoutProgressExerciseSchema`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
