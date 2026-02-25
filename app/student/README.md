# student

- Caminho: `app/student`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- `cardio/`: subdomínio de `app/student/cardio`.
- `diet/`: subdomínio de `app/student/diet`.
- `education/`: subdomínio de `app/student/education`.
- `learn/`: subdomínio de `app/student/learn`.
- `more/`: subdomínio de `app/student/more`.
- `onboarding/`: subdomínio de `app/student/onboarding`.
- `payments/`: subdomínio de `app/student/payments`.
- `profile/`: subdomínio de `app/student/profile`.

## Arquivos
- `actions-unified.ts`: Arquivo da camada local.
- `actions.ts`: Arquivo da camada local.
- `layout-content.tsx`: Arquivo da camada local.
- `layout.tsx`: Layout compartilhado de rota.
- `page-content.tsx`: Arquivo da camada local.
- `page.tsx`: Entrypoint de página.

## Detalhamento técnico por arquivo

### `actions-unified.ts`
- O que faz: implementa o módulo `actions-unified.ts` da camada `student`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@/lib/services/student-domain.service`, `@/lib/utils/student-context`
- Expõe: `getAllStudentData`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `lib/api/handlers/students.handler.ts`

### `actions.ts`
- O que faz: implementa o módulo `actions.ts` da camada `student`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@/lib/utils/student-context`, `@/lib/services/student/student-progress.service`, `@/lib/services/student/student-workout.service`, `@/lib/services/student/student-profile.service`
- Expõe: `getCurrentUserInfo`, `getStudentProfile`, `getStudentProgress`, `getStudentUnits`, `getGymLocations`, `getStudentSubscription`, `startStudentTrial`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `app/student/layout.tsx`, `lib/api/handlers/subscriptions.handler.ts`

### `layout-content.tsx`
- O que faz: implementa o módulo `layout-content.tsx` da camada `student`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `next/navigation`, `nuqs`, `react`, `@/components/organisms/loading-screen`, `@/components/organisms/modals`, `@/components/organisms/workout/workout-modal`, `@/components/templates/layouts/app-layout`, `@/hooks/use-student`, `@/hooks/use-student-initializer`
- Expõe: `StudentLayoutContent`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/layout.tsx`

### `layout.tsx`
- O que faz: define o layout compartilhado do segmento `student`.
- Como: encapsula providers, chrome de navegação e elementos persistentes entre páginas filhas; sinais: `StudentLayoutWrapper`, `all`, `getStudentProfile`, `getStudentProgress`.
- Por que: elimina duplicação estrutural e mantém consistência transversal de UX.
- Importa principalmente: `react`, `@/components/organisms/loading-screen`, `@/contexts/swipe-direction`, `./actions`, `./layout-content`
- Expõe: `dynamic`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `page-content.tsx`
- O que faz: implementa o módulo `page-content.tsx` da camada `student`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `nuqs`, `react`, `@/app/student/cardio/cardio-functional-page`, `@/app/student/diet/diet-page`, `@/app/student/learn/learning-path`, `@/app/student/more/student-more-menu`, `@/app/student/payments/student-payments-page`, `@/app/student/profile/profile-page`, `@/components/admin/admin-only`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: HTTP interno/externo, Offline/sincronização
- Onde é usado/importado: `app/student/page.tsx`

### `page.tsx`
- O que faz: implementa a página de entrada da rota `app/student/page.tsx`.
- Como: compõe componentes e hooks para executar o fluxo principal da tela; operações detectadas: `StudentPage`.
- Por que: mantém o entrypoint de navegação explícito e alinhado ao filesystem routing.
- Importa principalmente: `./page-content`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Offline/sincronização
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
