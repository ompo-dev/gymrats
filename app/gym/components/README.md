# components

- Caminho: `app/gym/components`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- `financial/`: subdomínio de `app/gym/components/financial`.

## Arquivos
- `add-equipment-modal.tsx`: Arquivo da camada local.
- `add-student-modal.tsx`: Arquivo da camada local.
- `checkin-modal.tsx`: Arquivo da camada local.
- `gym-dashboard.tsx`: Arquivo da camada local.
- `gym-equipment-detail.tsx`: Arquivo da camada local.
- `gym-equipment.tsx`: Arquivo da camada local.
- `gym-financial.tsx`: Arquivo da camada local.
- `gym-gamification.tsx`: Arquivo da camada local.
- `gym-settings.tsx`: Arquivo da camada local.
- `gym-stats.tsx`: Arquivo da camada local.
- `gym-student-detail.tsx`: Arquivo da camada local.
- `gym-students.tsx`: Arquivo da camada local.
- `maintenance-modal.tsx`: Arquivo da camada local.
- `membership-plans-page.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `add-equipment-modal.tsx`
- O que faz: implementa o módulo `add-equipment-modal.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `react`, `@/components/ui/button`, `@/components/ui/dialog`, `@/components/ui/input`, `@/components/ui/label`, `lucide-react`, `@/components/ui/option-selector`, `@/lib/types`
- Expõe: `AddEquipmentModal`
- Comunica com: HTTP interno/externo, Observabilidade/logs
- Onde é usado/importado: `app/gym/components/gym-equipment-detail.tsx`, `app/gym/components/gym-equipment.tsx`

### `add-student-modal.tsx`
- O que faz: implementa o módulo `add-student-modal.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `next/image`, `react`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/input`, `@/components/ui/option-selector`, `@/lib/types`
- Expõe: `AddStudentModal`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/gym/components/gym-students.tsx`

### `checkin-modal.tsx`
- O que faz: implementa o módulo `checkin-modal.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `next/image`, `react`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/input`
- Expõe: `CheckInModal`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/gym/components/gym-dashboard.tsx`

### `gym-dashboard.tsx`
- O que faz: implementa o módulo `gym-dashboard.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `react`, `next/image`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/molecules/relative-time`, `@/components/ui/button`, `@/components/ui/duo-card`, `./checkin-modal`, `@/components/ui/section-card`
- Expõe: `GymDashboardPage`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/page-content.tsx`

### `gym-equipment-detail.tsx`
- O que faz: implementa o módulo `gym-equipment-detail.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/option-selector`, `@/components/ui/section-card`, `@/components/ui/stat-card-large`, `@/lib/types`, `@/lib/utils`
- Expõe: `GymEquipmentDetail`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-equipment.tsx`

### `gym-equipment.tsx`
- O que faz: implementa o módulo `gym-equipment.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `nuqs`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/input`, `@/components/ui/option-selector`, `@/components/ui/section-card`, `@/components/ui/stat-card-large`
- Expõe: `GymEquipmentPage`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/page-content.tsx`

### `gym-financial.tsx`
- O que faz: implementa o módulo `gym-financial.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `nuqs`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/option-selector`, `@/components/ui/section-card`, `@/lib/types`, `./financial/financial-coupons-tab`, `./financial/financial-expenses-tab`, `./financial/financial-overview-tab`, `./financial/financial-payments-tab`
- Expõe: `GymFinancialPage`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/page-content.tsx`

### `gym-gamification.tsx`
- O que faz: implementa o módulo `gym-gamification.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/duo-card`, `@/components/ui/section-card`, `@/components/ui/stat-card-large`, `@/lib/types`, `@/lib/utils`
- Expõe: `GymGamificationPage`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/page-content.tsx`

### `gym-settings.tsx`
- O que faz: implementa o módulo `gym-settings.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/section-card`, `@/hooks/use-user-session`, `@/lib/types`, `@/lib/utils`, `./membership-plans-page`
- Expõe: `GymSettingsPage`
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: `app/gym/page-content.tsx`, `app/gym/settings/page.tsx`

### `gym-stats.tsx`
- O que faz: implementa o módulo `gym-stats.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/duo-card`, `@/components/ui/section-card`, `@/components/ui/stat-card-large`, `@/lib/types`
- Expõe: `GymStatsPage`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/page-content.tsx`

### `gym-student-detail.tsx`
- O que faz: implementa o módulo `gym-student-detail.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `next/image`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/option-selector`, `@/components/ui/section-card`, `@/components/ui/stat-card-large`, `@/lib/types`
- Expõe: `GymStudentDetail`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/gym/components/gym-students.tsx`

### `gym-students.tsx`
- O que faz: implementa o módulo `gym-students.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `next/image`, `next/navigation`, `nuqs`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/input`, `@/components/ui/option-selector`
- Expõe: `GymStudentsPage`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/gym/page-content.tsx`

### `maintenance-modal.tsx`
- O que faz: implementa o módulo `maintenance-modal.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `react`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/input`, `@/components/ui/option-selector`, `@/lib/types`
- Expõe: `MaintenanceModal`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/gym/components/gym-equipment-detail.tsx`

### `membership-plans-page.tsx`
- O que faz: implementa o módulo `membership-plans-page.tsx` da camada `components`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `react`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/input`, `@/components/ui/option-selector`, `@/lib/types`, `next/navigation`, `@/components/ui/alert-dialog`
- Expõe: `MembershipPlansPage`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/gym/components/gym-settings.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
