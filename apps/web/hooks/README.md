# hooks

- Caminho: `hooks`
- Finalidade: hooks de orquestração de estado, navegação e efeitos de domínio.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `use-education-data.ts`: Hook React de orquestração.
- `use-gym-subscription.ts`: Hook React de orquestração.
- `use-gyms-list.ts`: Hook React de orquestração.
- `use-load-prioritized.ts`: Hook React de orquestração.
- `use-mobile.ts`: Hook React de orquestração.
- `use-modal-state.ts`: Hook React de orquestração.
- `use-nutrition-handlers.ts`: Hook React de orquestração.
- `use-offline-action.ts`: Hook React de orquestração.
- `use-relative-time.ts`: Hook React de orquestração.
- `use-reminder-notifications.ts`: Hook React de orquestração.
- `use-scroll-reset.ts`: Hook React de orquestração.
- `use-scroll-to-top.ts`: Hook React de orquestração.
- `use-service-worker-sync.ts`: Hook React de orquestração.
- `use-student-initializer.ts`: Hook React de orquestração.
- `use-student.ts`: Hook React de orquestração.
- `use-subscription-unified.ts`: Hook React de orquestração.
- `use-subscription.ts`: Hook React de orquestração.
- `use-swipe.ts`: Hook React de orquestração.
- `use-toast.ts`: Hook React de orquestração.
- `use-user-session.ts`: Hook React de orquestração.
- `use-workout-execution.ts`: Hook React de orquestração.

## Detalhamento técnico por arquivo

### `use-education-data.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-education-data`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useEducationCategories`, `useMemo`, `Set`, `map`, `from`, `useCategoryHelpers`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`, `@/lib/educational-data`, `@/lib/types`
- Expõe: `useEducationCategories`, `useCategoryHelpers`, `useFilteredLessons`, `useLessonsByCategory`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/educational-lessons.tsx`, `components/organisms/education/educational-lessons.tsx`

### `use-gym-subscription.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-gym-subscription`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useGymSubscription`, `useSubscriptionUnified`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `./use-subscription-unified`, `./use-subscription-unified`
- Expõe: `useGymSubscription`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/financial/financial-subscription-tab.tsx`

### `use-gyms-list.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-gyms-list`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useGymsList`, `useGymsDataStore`, `useEffect`, `loadAllGyms`, `getItem`, `removeItem`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`, `@/stores/gyms-list-store`
- Expõe: `useGymsList`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/academias/page-content.tsx`, `components/organisms/navigation/gym-selector.tsx`

### `use-load-prioritized.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-load-prioritized`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `detectContextFromPath`, `includes`, `hasSectionData`, `_filterMissingSections`, `filter`, `useLoadPrioritized`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `next/navigation`, `nuqs`, `react`, `@/lib/types/student-unified`, `@/stores/student-unified-store`
- Expõe: `useLoadPrioritized`, `useLoadPrioritizedForContext`, `useLoadPrioritizedSections`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/diet/diet-page.tsx`, `app/student/learn/learning-path.tsx`, `app/student/page-content.tsx`, `app/student/payments/student-payments-page.tsx`, `app/student/profile/profile-content.tsx`

### `use-mobile.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-mobile`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useIsMobile`, `useEffect`, `matchMedia`, `setIsMobile`, `addEventListener`, `removeEventListener`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`
- Expõe: `useIsMobile`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/ui/sidebar.tsx`

### `use-modal-state.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-modal-state`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useModalState`, `useQueryState`, `useCallback`, `setModal`, `close`, `open`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `nuqs`, `react`
- Expõe: `useModalState`, `useModalStateWithParam`, `useSubModalState`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/diet/diet-page.tsx`, `app/student/learn/learning-path.tsx`, `app/student/payments/student-payments-page.tsx`, `app/student/profile/profile-content.tsx`, `components/organisms/modals/edit-unit-modal.tsx`, `hooks/use-workout-execution.ts`

### `use-nutrition-handlers.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-nutrition-handlers`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useNutritionHandlers`, `useStudent`, `getBrazilNutritionDateKey`, `useUIStore`, `useState`, `filter`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`, `@/hooks/use-student`, `@/lib/types`, `@/lib/utils/brazil-nutrition-date`, `@/stores`
- Expõe: `useNutritionHandlers`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `app/student/diet/diet-page.tsx`

### `use-offline-action.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-offline-action`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `syncManager`, `useOfflineAction`, `updateXp`, `useCallback`, `getItem`, `Error`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`, `@/lib/offline/sync-manager`
- Expõe: `useOfflineAction`, `useUpdateProgress`, `useUpdateProfile`, `useAddWeight`, `useUpdateNutrition`, `useCompleteWorkout`
- Comunica com: Autenticação/sessão, HTTP interno/externo, Offline/sincronização
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `use-relative-time.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-relative-time`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useRelativeTime`, `useState`, `getTime`, `floor`, `useEffect`, `setMounted`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`
- Expõe: `useRelativeTime`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/relative-time.tsx`

### `use-reminder-notifications.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-reminder-notifications`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useReminderNotifications`, `useRemindersStore`, `useStudentUnifiedStore`, `useState`, `useEffect`, `setIsSupported`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`, `@/stores/reminders-store`, `@/stores/student-unified-store`
- Expõe: `useReminderNotifications`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `components/organisms/reminders-banner.tsx`

### `use-scroll-reset.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-scroll-reset`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useEffect`, `scrollTo`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`
- Expõe: `useScrollReset`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/templates/layouts/app-layout.tsx`

### `use-scroll-to-top.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-scroll-to-top`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useScrollToTop`, `useLayoutEffect`, `scrollTo`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`
- Expõe: `useScrollToTop`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/education/components/lesson-detail.tsx`, `app/student/education/components/lesson-quiz.tsx`, `app/student/education/educational-lessons.tsx`, `components/organisms/education/components/lesson-detail.tsx`, `components/organisms/education/components/lesson-quiz.tsx`, `components/organisms/education/educational-lessons.tsx`

### `use-service-worker-sync.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-service-worker-sync`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useServiceWorkerSync`, `useEffect`, `setSyncStatus`, `now`, `addEventListener`, `removeEventListener`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`
- Expõe: `useServiceWorkerSync`
- Comunica com: Offline/sincronização
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `use-student-initializer.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-student-initializer`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useStudentInitializer`, `useUserSession`, `useStudentUnifiedStore`, `useRef`, `useCallback`, `useEffect`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`, `@/hooks/use-user-session`, `@/lib/utils/role`, `@/stores/student-unified-store`
- Expõe: `useStudentInitializer`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/student/layout-content.tsx`, `components/providers/student-data-provider.tsx`

### `use-student.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-student`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useStudent`, `useStudentUnifiedStore`, `getActions`, `getLoaders`, `selectFromData`, `forEach`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `@/lib/types/student-unified`, `@/lib/utils/student-selectors`, `@/stores/student-unified-store`
- Expõe: `useStudent`, `useStudentProgress`, `useStudentProfile`, `useStudentUser`, `useStudentActions`, `useStudentLoaders`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/diet/diet-page.tsx`, `app/student/layout-content.tsx`, `app/student/learn/learning-path.tsx`, `app/student/page-content.tsx`, `app/student/payments/student-payments-page.tsx`, `app/student/profile/profile-content.tsx`, `components/organisms/home/home/nutrition-status-card.tsx`, `components/organisms/modals/create-unit-modal.tsx`, `components/organisms/modals/edit-unit-modal.tsx`, `components/organisms/modals/exercise-search.tsx`, `components/organisms/modals/food-search-chat.tsx`, `components/organisms/modals/food-search.tsx`

### `use-subscription-unified.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-subscription-unified`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useSubscriptionUnified`, `useQueryClient`, `useSubscriptionStore`, `useStudentUnifiedStore`, `setSubscription`, `updateSubscription`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `@tanstack/react-query`, `react`, `@/lib/api/client`, `@/stores/subscription-store`, `@/stores/student-unified-store`
- Expõe: `useSubscriptionUnified`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `hooks/use-gym-subscription.ts`, `hooks/use-subscription.ts`

### `use-subscription.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-subscription`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useSubscription`, `useSubscriptionUnified`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `./use-subscription-unified`
- Expõe: `useSubscription`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/payments/student-payments-page.tsx`

### `use-swipe.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-swipe`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useSwipe`, `useRef`, `closest`, `setTouchEnd`, `setTouchStart`, `abs`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`
- Expõe: `useSwipe`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/templates/layouts/app-layout.tsx`

### `use-toast.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-toast`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `genId`, `toString`, `has`, `delete`, `dispatch`, `set`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`, `@/components/ui/toast`
- Expõe: `reducer`, `useToast`, `toast`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/financial/financial-subscription-tab.tsx`, `app/student/more/student-more-menu.tsx`, `app/student/page-content.tsx`, `app/student/payments/student-payments-page.tsx`, `components/organisms/modals/workout-chat.tsx`, `components/organisms/sections/subscription-section.tsx`, `components/ui/toaster.tsx`

### `use-user-session.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-user-session`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useUserSession`, `useState`, `useEffect`, `fetchSession`, `import`, `setUserSession`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`
- Expõe: `useUserSession`
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: `app/gym/components/gym-settings.tsx`, `app/gym/layout-content.tsx`, `app/student/more/student-more-menu.tsx`, `app/student/page-content.tsx`, `components/admin/admin-only.tsx`, `hooks/use-student-initializer.ts`, `lib/utils/admin-route-guard.ts`

### `use-workout-execution.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-workout-execution`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `useWorkoutExecution`, `useRouter`, `useModalStateWithParam`, `useQueryState`, `useWorkoutStore`, `useStudent`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`, `next/navigation`, `nuqs`, `zustand/react/shallow`, `@/stores`, `@/hooks/use-student`, `@/lib/types`, `@/hooks/use-modal-state`
- Expõe: `useWorkoutExecution`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `components/organisms/workout/workout-modal.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
