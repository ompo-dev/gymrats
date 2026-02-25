# stores

- Caminho: `stores`
- Finalidade: stores Zustand como fonte de verdade de estado da aplicação.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `auth-store.ts`: Arquivo da camada local.
- `education-store.ts`: Arquivo da camada local.
- `gym-store.ts`: Arquivo da camada local.
- `gyms-list-store.ts`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `nutrition-store.ts`: Arquivo da camada local.
- `reminders-store.ts`: Arquivo da camada local.
- `student-unified-store.ts`: Arquivo da camada local.
- `subscription-store.ts`: Arquivo da camada local.
- `subscription-ui-store.ts`: Arquivo da camada local.
- `ui-store.ts`: Arquivo da camada local.
- `workout-store.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `auth-store.ts`
- O que faz: define store de estado `auth-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `persist`, `set`, `removeItem`, `getItem`, `useUserSession`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`, `zustand/middleware`, `@/lib/types`
- Expõe: `useAuthStore`
- Comunica com: Autenticação/sessão
- Onde é usado/importado: `stores/index.ts`

### `education-store.ts`
- O que faz: define store de estado `education-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `persist`, `set`, `includes`, `get`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`, `zustand/middleware`, `@/lib/types`
- Expõe: `useEducationStore`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `stores/index.ts`

### `gym-store.ts`
- O que faz: define store de estado `gym-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `persist`, `set`, `map`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`, `zustand/middleware`, `@/lib/gym-mock-data`, `@/lib/types`
- Expõe: `useGymStore`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `stores/index.ts`

### `gyms-list-store.ts`
- O que faz: define store de estado `gyms-list-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `set`, `import`, `post`, `error`, `isArray`, `forEach`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`
- Expõe: `useGymsDataStore`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `hooks/use-gyms-list.ts`, `stores/index.ts`

### `index.ts`
- O que faz: define store de estado `index`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `useStudent`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `./auth-store`, `./education-store`, `./gym-store`, `./gyms-list-store`, `@/hooks/use-student`, `./student-store`, `./nutrition-store`, `./student-unified-store`, `./subscription-store`, `./ui-store`, `./workout-store`
- Expõe: `useAuthStore`, `useEducationStore`, `useGymStore`, `useGymsDataStore`, `useStudentStore`, `useNutritionStore`, `useStudentUnifiedStore`, `useSubscriptionStore`, `useUIStore`, `useWorkoutStore`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/auth/register/user-type/page.tsx`, `app/student/profile/profile-content.tsx`, `app/welcome/page.tsx`, `components/organisms/workout/workout-modal.tsx`, `hooks/use-nutrition-handlers.ts`, `hooks/use-workout-execution.ts`

### `nutrition-store.ts`
- O que faz: define store de estado `nutrition-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `useStudent`, `warn`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`
- Expõe: `useNutritionStore`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `stores/index.ts`

### `reminders-store.ts`
- O que faz: define store de estado `reminders-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `persist`, `set`, `get`, `syncToServiceWorker`, `postMessage`, `getAppDataForSW`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`, `zustand/middleware`, `@/lib/types/reminder-notifications`
- Expõe: `useRemindersStore`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `hooks/use-reminder-notifications.ts`

### `student-unified-store.ts`
- O que faz: define store de estado `student-unified-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `useStudent`, `formatMemberSince`, `getMonth`, `getFullYear`, `loadSection`, `has`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`, `zustand/middleware`, `@/lib/api/client`, `@/lib/offline/command-logger`, `@/lib/offline/command-migrations`, `@/lib/offline/command-pattern`, `@/lib/offline/indexeddb-storage`, `@/lib/offline/pending-actions`, `@/lib/offline/sync-manager`, `@/lib/types`, `@/lib/types/student-unified`, `@/lib/types/student-unified`
- Expõe: `useStudentUnifiedStore`
- Comunica com: Autenticação/sessão, HTTP interno/externo, Offline/sincronização
- Onde é usado/importado: `app/student/profile/profile-content.tsx`, `app/welcome/page.tsx`, `components/organisms/modals/create-unit-modal.tsx`, `components/organisms/modals/edit-unit-modal.tsx`, `components/organisms/modals/food-search-chat.tsx`, `components/organisms/modals/workout-chat.tsx`, `hooks/use-load-prioritized.ts`, `hooks/use-reminder-notifications.ts`, `hooks/use-student-initializer.ts`, `hooks/use-student.ts`, `hooks/use-subscription-unified.ts`, `stores/index.ts`

### `subscription-store.ts`
- O que faz: define store de estado `subscription-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `useStudent`, `set`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `@/hooks/use-student`, `zustand`
- Expõe: `useSubscriptionStore`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/financial/financial-subscription-tab.tsx`, `hooks/use-subscription-unified.ts`, `stores/index.ts`

### `subscription-ui-store.ts`
- O que faz: define store de estado `subscription-ui-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `set`, `indexOf`, `toLowerCase`, `find`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`, `@/components/organisms/sections/subscription-section`
- Expõe: `useSubscriptionUIStore`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/sections/subscription-section.tsx`

### `ui-store.ts`
- O que faz: define store de estado `ui-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `set`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`
- Expõe: `useUIStore`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `stores/index.ts`

### `workout-store.ts`
- O que faz: define store de estado `workout-store`.
- Como: concentra seleção de estado, mutações e fluxos de carregamento/sincronização; operações: `persist`, `set`, `log`, `map`, `filter`, `reduce`.
- Por que: garante fonte de verdade única e previsibilidade de estado para UI e hooks.
- Importa principalmente: `zustand`, `zustand/middleware`, `@/lib/api/client`, `@/lib/types`
- Expõe: `useWorkoutStore`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/student/learn/learning-path.tsx`, `app/student/profile/profile-content.tsx`, `components/organisms/workout/workout-node.tsx`, `stores/index.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
