# gym

- Caminho: `app/gym`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- `academias/`: subdomínio de `app/gym/academias`.
- `components/`: subdomínio de `app/gym/components`.
- `dashboard/`: subdomínio de `app/gym/dashboard`.
- `equipment/`: subdomínio de `app/gym/equipment`.
- `financial/`: subdomínio de `app/gym/financial`.
- `gamification/`: subdomínio de `app/gym/gamification`.
- `onboarding/`: subdomínio de `app/gym/onboarding`.
- `settings/`: subdomínio de `app/gym/settings`.
- `stats/`: subdomínio de `app/gym/stats`.
- `students/`: subdomínio de `app/gym/students`.

## Arquivos
- `actions.ts`: Arquivo da camada local.
- `layout-content.tsx`: Arquivo da camada local.
- `layout.tsx`: Layout compartilhado de rota.
- `page-content.tsx`: Arquivo da camada local.
- `page.tsx`: Entrypoint de página.

## Detalhamento técnico por arquivo

### `actions.ts`
- O que faz: implementa o módulo `actions.ts` da camada `gym`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@/lib/utils/gym-context`, `@/lib/services/gym/gym-member.service`, `@/lib/services/gym/gym-financial.service`, `@/lib/services/gym/gym-inventory.service`, `@/lib/types`
- Expõe: `getCurrentUserInfo`, `getGymProfile`, `getGymEquipment`, `getGymEquipmentById`, `getGymMembershipPlans`, `getGymStudents`, `getGymRecentCheckIns`, `getGymStudentById`, `getGymFinancialSummary`, `getGymStudentPayments`, `getGymPayments`, `getGymExpenses`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `app/gym/dashboard/page.tsx`, `app/gym/equipment/[id]/page.tsx`, `app/gym/equipment/page.tsx`, `app/gym/financial/page.tsx`, `app/gym/gamification/page.tsx`, `app/gym/layout.tsx`, `app/gym/page.tsx`, `app/gym/settings/page.tsx`, `app/gym/stats/page.tsx`, `app/gym/students/page.tsx`, `lib/api/handlers/gym-subscriptions.handler.ts`

### `layout-content.tsx`
- O que faz: implementa o módulo `layout-content.tsx` da camada `gym`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `next/navigation`, `nuqs`, `react`, `@/components/templates/layouts/app-layout`, `@/hooks/use-user-session`
- Expõe: `GymLayoutContent`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/layout.tsx`

### `layout.tsx`
- O que faz: define o layout compartilhado do segmento `gym`.
- Como: encapsula providers, chrome de navegação e elementos persistentes entre páginas filhas; sinais: `GymLayoutWrapper`, `getGymProfile`, `GymLayout`.
- Por que: elimina duplicação estrutural e mantém consistência transversal de UX.
- Importa principalmente: `react`, `@/components/organisms/loading-screen`, `@/contexts/swipe-direction`, `./actions`, `./layout-content`
- Expõe: `dynamic`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `page-content.tsx`
- O que faz: implementa o módulo `page-content.tsx` da camada `gym`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `nuqs`, `react`, `@/components/organisms/navigation/gym-more-menu`, `@/lib/types`, `./components/gym-dashboard`, `./components/gym-equipment`, `./components/gym-financial`, `./components/gym-gamification`, `./components/gym-settings`, `./components/gym-stats`, `./components/gym-students`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/page.tsx`

### `page.tsx`
- O que faz: implementa a página de entrada da rota `app/gym/page.tsx`.
- Como: compõe componentes e hooks para executar o fluxo principal da tela; operações detectadas: `GymPage`, `all`, `getGymProfile`, `getGymStats`, `getGymStudents`.
- Por que: mantém o entrypoint de navegação explícito e alinhado ao filesystem routing.
- Importa principalmente: `react`, `./actions`, `./page-content`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
