# utils

- Caminho: `lib/utils`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `admin-access.ts`: Arquivo da camada local.
- `admin-route-guard.ts`: Arquivo da camada local.
- `auth.ts`: Arquivo da camada local.
- `auto-trial.ts`: Arquivo da camada local.
- `brazil-nutrition-date.ts`: Arquivo da camada local.
- `cookies.ts`: Arquivo da camada local.
- `get-session-token.ts`: Arquivo da camada local.
- `gym-context.ts`: Arquivo da camada local.
- `middleware-auth.ts`: Arquivo da camada local.
- `next-params.ts`: Arquivo da camada local.
- `pwa-detection.ts`: Arquivo da camada local.
- `reminder-helpers.ts`: Arquivo da camada local.
- `role.ts`: Arquivo da camada local.
- `session.ts`: Arquivo da camada local.
- `student-context.ts`: Arquivo da camada local.
- `student-selectors.ts`: Arquivo da camada local.
- `student-transformers.ts`: Arquivo da camada local.
- `subscription-helpers.ts`: Arquivo da camada local.
- `subscription.ts`: Arquivo da camada local.
- `user-info.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `admin-access.ts`
- O que faz: implementa o módulo `admin-access.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `./session`
- Expõe: `getGymAccessForAdmin`, `getStudentAccessForAdmin`, `isAdmin`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `admin-route-guard.ts`
- O que faz: implementa o módulo `admin-route-guard.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/navigation`, `react`, `@/hooks/use-user-session`
- Expõe: `useAdminRouteGuard`, `shouldBlockRoute`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `auth.ts`
- O que faz: implementa o módulo `auth.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@prisma/client`, `@/lib/db`
- Expõe: `getUserRole`, `requireRole`, `requireAnyRole`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `auto-trial.ts`
- O que faz: implementa o módulo `auto-trial.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`
- Expõe: `initializeStudentTrial`, `initializeGymTrial`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `app/api/users/update-role/route.ts`, `app/gym/onboarding/actions.ts`, `app/student/onboarding/actions.ts`, `lib/api/handlers/students.handler.ts`, `lib/api/handlers/subscriptions.handler.ts`, `server/handlers/students.ts`, `server/routes/users.ts`

### `brazil-nutrition-date.ts`
- O que faz: implementa o módulo `brazil-nutrition-date.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `getBrazilNutritionDateKey`, `getBrazilNutritionDayRange`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `hooks/use-nutrition-handlers.ts`, `lib/api/handlers/nutrition.handler.ts`, `stores/student-unified-store.ts`

### `cookies.ts`
- O que faz: implementa o módulo `cookies.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/headers`
- Expõe: `getCookie`, `setCookie`, `deleteCookie`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `get-session-token.ts`
- O que faz: implementa o módulo `get-session-token.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/headers`, `next/server`
- Expõe: `getSessionToken`, `getSessionTokenFromRequest`
- Comunica com: Autenticação/sessão
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `gym-context.ts`
- O que faz: implementa o módulo `gym-context.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/headers`, `next/server`, `@/lib/db`, `@/lib/utils/session`
- Expõe: `getGymContext`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão
- Onde é usado/importado: `app/api/gyms/equipment/[equipId]/maintenance/route.ts`, `app/api/gyms/equipment/[equipId]/route.ts`, `app/api/gyms/members/[membershipId]/route.ts`, `app/api/gyms/payments/[paymentId]/route.ts`, `app/api/gyms/plans/[planId]/route.ts`, `app/api/gyms/students/search/route.ts`, `app/gym/actions.ts`, `app/gym/onboarding/actions.ts`, `lib/api/utils/api-wrapper.ts`

### `middleware-auth.ts`
- O que faz: implementa o módulo `middleware-auth.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `./session`
- Expõe: `getAuthSession`, `isPublicRoute`
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `next-params.ts`
- O que faz: implementa o módulo `next-params.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `react`
- Expõe: `useParams`, `useSearchParams`, `awaitParams`, `awaitSearchParams`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `pwa-detection.ts`
- O que faz: implementa o módulo `pwa-detection.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `isStandaloneMode`, `isMobileDevice`, `isIOS`, `isAndroid`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/auth/callback/page.tsx`, `app/welcome/page.tsx`

### `reminder-helpers.ts`
- O que faz: implementa o módulo `reminder-helpers.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `syncAppDataToServiceWorker`, `checkRemindersNow`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `role.ts`
- O que faz: implementa o módulo `role.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `roleToUserType`, `isStudent`, `isGym`, `isAdmin`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `hooks/use-student-initializer.ts`

### `session.ts`
- O que faz: implementa o módulo `session.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`
- Expõe: `createSession`, `getSession`, `deleteSession`, `deleteAllUserSessions`, `getSessionTokenFromRequest`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão
- Onde é usado/importado: `app/api/auth/session/route.ts`, `app/api/auth/sign-in/route.ts`, `app/api/auth/sign-out/route.ts`, `app/api/auth/sign-up/route.ts`, `app/api/gyms/equipment/[equipId]/maintenance/route.ts`, `app/api/gyms/equipment/[equipId]/route.ts`, `app/api/gyms/members/[membershipId]/route.ts`, `app/api/gyms/payments/[paymentId]/route.ts`, `app/api/gyms/plans/[planId]/route.ts`, `lib/api/middleware/auth.middleware.ts`, `lib/utils/admin-access.ts`, `lib/utils/gym-context.ts`

### `student-context.ts`
- O que faz: implementa o módulo `student-context.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/headers`, `@/lib/db`, `@/lib/utils/session`
- Expõe: `getStudentContext`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão
- Onde é usado/importado: `app/student/actions-unified.ts`, `app/student/actions.ts`, `app/student/onboarding/actions.ts`, `lib/actions/abacate-pay.ts`

### `student-selectors.ts`
- O que faz: implementa o módulo `student-selectors.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/types/student-unified`
- Expõe: `selectUser`, `selectStudent`, `selectProgress`, `selectProfile`, `selectWeightHistory`, `selectWeightGain`, `selectUnits`, `selectWorkoutHistory`, `selectPersonalRecords`, `selectDailyNutrition`, `selectFoodDatabase`, `selectSubscription`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `hooks/use-student.ts`

### `student-transformers.ts`
- O que faz: implementa o módulo `student-transformers.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/types`, `@/lib/types/student-unified`
- Expõe: `transformStudentData`, `transformToAPI`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `subscription-helpers.ts`
- O que faz: implementa o módulo `subscription-helpers.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `isPremiumPlan`, `hasActivePremiumStatus`, `getBillingPeriodFromPlan`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `components/organisms/home/home/nutrition-status-card.tsx`, `components/organisms/modals/food-search.tsx`, `components/organisms/sections/subscription-section.tsx`, `lib/utils/subscription.ts`

### `subscription.ts`
- O que faz: implementa o módulo `subscription.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/api/abacatepay`, `@/lib/api/abacatepay`, `@/lib/db`, `./subscription-helpers`, `./subscription-helpers`
- Expõe: `hasPremiumAccess`, `canUseFeature`, `createStudentSubscriptionBilling`, `createGymSubscriptionBilling`, `isPremiumPlan`, `hasActivePremiumStatus`, `getBillingPeriodFromPlan`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: `app/api/auth/session/route.ts`, `app/api/nutrition/chat-stream/route.ts`, `app/api/nutrition/chat/route.ts`, `app/api/workouts/chat-stream/route.ts`, `app/api/workouts/chat/route.ts`, `lib/api/handlers/gym-subscriptions.handler.ts`, `lib/api/handlers/subscriptions.handler.ts`, `server/handlers/gym-subscriptions.ts`, `server/handlers/nutrition-ai.ts`, `server/handlers/workouts-ai.ts`

### `user-info.ts`
- O que faz: implementa o módulo `user-info.ts` da camada `utils`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `getUserInfoFromStorage`, `isAdminFromStorage`, `getUserInfoFromServer`
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
