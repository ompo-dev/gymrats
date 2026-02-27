# lib

- Caminho: `lib`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- `actions/`: subdomínio de `lib/actions`.
- `ai/`: subdomínio de `lib/ai`.
- `api/`: subdomínio de `lib/api`.
- `constants/`: subdomínio de `lib/constants`.
- `hooks/`: subdomínio de `lib/hooks`.
- `observability/`: subdomínio de `lib/observability`.
- `offline/`: subdomínio de `lib/offline`.
- `services/`: subdomínio de `lib/services`.
- `types/`: subdomínio de `lib/types`.
- `use-cases/`: subdomínio de `lib/use-cases`.
- `utils/`: subdomínio de `lib/utils`.

## Arquivos
- `auth-client.ts`: Arquivo da camada local.
- `auth-config.ts`: Arquivo da camada local.
- `auth.ts`: Arquivo da camada local.
- `calorie-calculator.ts`: Arquivo da camada local.
- `db.ts`: Arquivo da camada local.
- `educational-data.ts`: Arquivo da camada local.
- `equipment-database.ts`: Arquivo da camada local.
- `functional-exercises-data.ts`: Arquivo da camada local.
- `metabolic-calculator.ts`: Arquivo da camada local.
- `mock-data.ts`: Arquivo da camada local.
- `posture-analysis.ts`: Arquivo da camada local.
- `social-data.ts`: Arquivo da camada local.
- `types.ts`: Arquivo da camada local.
- `utils.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `auth-client.ts`
- O que faz: implementa o módulo `auth-client.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `better-auth/react`
- Expõe: `authClient`
- Comunica com: Autenticação/sessão
- Onde é usado/importado: `app/auth/callback/page.tsx`, `app/welcome/page.tsx`, `lib/api/auth.ts`

### `auth-config.ts`
- O que faz: implementa o módulo `auth-config.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `better-auth`, `better-auth/adapters/prisma`, `better-auth/api`, `./db`
- Expõe: `auth`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: `app/api/auth/[...all]/route.ts`, `app/api/auth/session/route.ts`, `app/api/auth/sign-out/route.ts`, `lib/api/middleware/auth.middleware.ts`, `lib/utils/gym-context.ts`, `lib/utils/student-context.ts`, `server/plugins/auth-macro.ts`, `server/plugins/auth-roles.ts`, `server/plugins/auth.ts`, `server/routes/auth.ts`

### `auth.ts`
- O que faz: implementa o módulo `auth.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `authConfig`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `calorie-calculator.ts`
- O que faz: implementa o módulo `calorie-calculator.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./types`
- Expõe: `calculateCaloriesBurned`, `calculateCardioCalories`, `calculateStrengthTrainingCalories`, `estimateIntensityFromHeartRate`, `calculateTargetHeartRateZone`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/trackers/cardio-tracker.tsx`

### `db.ts`
- O que faz: implementa o módulo `db.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@prisma/client`
- Expõe: `db`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, `app/api/auth/session/route.ts`, `app/api/auth/sign-in/route.ts`, `app/api/auth/sign-up/route.ts`, `app/api/auth/update-role/route.ts`, `app/api/auth/verify-reset-code/route.ts`, `app/api/gyms/checkin/route.ts`, `app/api/gyms/checkout/route.ts`, `app/api/gyms/equipment/[equipId]/maintenance/route.ts`, `app/api/gyms/equipment/[equipId]/route.ts`, `app/api/gyms/equipment/route.ts`

### `educational-data.ts`
- O que faz: implementa o módulo `educational-data.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./types`
- Expõe: `muscleDatabase`, `exerciseDatabase`, `educationalLessons`
- Comunica com: Observabilidade/logs
- Onde é usado/importado: `app/api/exercises/search/route.ts`, `app/api/workouts/process/route.ts`, `app/student/education/educational-lessons.tsx`, `app/student/education/muscle-explorer.tsx`, `components/organisms/education/educational-lessons.tsx`, `components/organisms/education/muscle-explorer.tsx`, `components/organisms/modals/exercise-search.tsx`, `hooks/use-education-data.ts`, `lib/api/handlers/workout-management.handler.ts`, `lib/services/personalized-workout-generator.ts`, `lib/services/populate-workout-exercises-educational-data.ts`, `server/handlers/exercises.ts`

### `equipment-database.ts`
- O que faz: implementa o módulo `equipment-database.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `equipmentDatabase`
- Comunica com: Observabilidade/logs
- Onde é usado/importado: `app/gym/onboarding/steps/step4.tsx`, `app/gym/onboarding/steps/types.ts`, `components/organisms/modals/equipment-search.tsx`

### `functional-exercises-data.ts`
- O que faz: implementa o módulo `functional-exercises-data.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./types`
- Expõe: `functionalExercises`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/workout/functional-workout.tsx`

### `metabolic-calculator.ts`
- O que faz: implementa o módulo `metabolic-calculator.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: `calculateMetabolicData`, `adjustMacros`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/onboarding/steps/step5.tsx`

### ~~`mock-data.ts`~~ (removido)
- O arquivo `mock-data.ts` foi removido. Dados de seed estão em `scripts/seed-database.js`. Componentes devem usar APIs reais.

### `posture-analysis.ts`
- O que faz: implementa o módulo `posture-analysis.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./types`
- Expõe: `analyzeFormWithAI`, `analyzeKeyPoints`, `generateFormProgress`, `mockPostureAnalyses`
- Comunica com: Observabilidade/logs
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `social-data.ts`
- O que faz: implementa o módulo `social-data.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./types`
- Expõe: `searchUsers`, `getWeeklyRankings`, `getActiveChallenges`, `mockFriends`, `mockCurrentUser`, `mockLeaderboard`, `mockChallenges`, `mockActivities`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `types.ts`
- O que faz: implementa o módulo `types.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/api/workouts/process/route.ts`, `app/gym/actions.ts`, `app/gym/components/add-equipment-modal.tsx`, `app/gym/components/add-student-modal.tsx`, `app/gym/components/financial/financial-coupons-tab.tsx`, `app/gym/components/financial/financial-expenses-tab.tsx`, `app/gym/components/financial/financial-overview-tab.tsx`, `app/gym/components/financial/financial-payments-tab.tsx`, `app/gym/components/financial/financial-referrals-tab.tsx`, `app/gym/components/gym-dashboard.tsx`, `app/gym/components/gym-equipment-detail.tsx`, `app/gym/components/gym-equipment.tsx`

### `utils.ts`
- O que faz: implementa o módulo `utils.ts` da camada `lib`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `clsx`, `tailwind-merge`
- Expõe: `cn`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/financial/financial-payments-tab.tsx`, `app/gym/components/financial/financial-referrals-tab.tsx`, `app/gym/components/financial/subscription-plans-selector.tsx`, `app/gym/components/financial/subscription-status-card.tsx`, `app/gym/components/gym-equipment-detail.tsx`, `app/gym/components/gym-equipment.tsx`, `app/gym/components/gym-gamification.tsx`, `app/gym/components/gym-settings.tsx`, `app/gym/components/gym-student-detail.tsx`, `app/gym/components/gym-students.tsx`, `app/gym/students/[id]/page.tsx`, `app/not-found.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
