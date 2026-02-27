# financial

- Caminho: `app/gym/components/financial`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `financial-coupons-tab.tsx`: Arquivo da camada local.
- `financial-expenses-tab.tsx`: Arquivo da camada local.
- `financial-overview-tab.tsx`: Arquivo da camada local.
- `financial-payments-tab.tsx`: Arquivo da camada local.
- `financial-referrals-tab.tsx`: Arquivo da camada local.
- `financial-subscription-tab.tsx`: Arquivo da camada local.
- `financial-tabs-navigation.tsx`: Arquivo da camada local.
- `subscription-plans-selector.tsx`: Arquivo da camada local.
- `subscription-status-card.tsx`: Arquivo da camada local.
- `subscription-trial-card.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `financial-coupons-tab.tsx`
- O que faz: implementa o módulo `financial-coupons-tab.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/types`
- Expõe: `FinancialCouponsTab`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-financial.tsx`, `app/gym/financial/page-content.tsx`

### `financial-expenses-tab.tsx`
- O que faz: implementa o módulo `financial-expenses-tab.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/types`
- Expõe: `FinancialExpensesTab`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-financial.tsx`, `app/gym/financial/page-content.tsx`

### `financial-overview-tab.tsx`
- O que faz: implementa o módulo `financial-overview-tab.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/components/molecules/cards/stat-card-large`, `@/lib/types`
- Expõe: `FinancialOverviewTab`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-financial.tsx`, `app/gym/financial/page-content.tsx`

### `financial-payments-tab.tsx`
- O que faz: implementa o módulo `financial-payments-tab.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `FinancialPaymentsTab`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-financial.tsx`, `app/gym/financial/page-content.tsx`

### `financial-referrals-tab.tsx`
- O que faz: implementa o módulo `financial-referrals-tab.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/types`, `@/lib/utils`
- Expõe: `FinancialReferralsTab`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-financial.tsx`, `app/gym/financial/page-content.tsx`

### `financial-subscription-tab.tsx`
- O que faz: implementa o módulo `financial-subscription-tab.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/components/organisms/sections/subscription-section`, `@/hooks/use-gym-subscription`, `@/hooks/use-toast`, `@/stores/subscription-store`
- Expõe: `FinancialSubscriptionTab`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-financial.tsx`, `app/gym/financial/page-content.tsx`

### `financial-tabs-navigation.tsx`
- O que faz: implementa o módulo `financial-tabs-navigation.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`
- Expõe: `FinancialTabsNavigation`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/financial/page-content.tsx`

### `subscription-plans-selector.tsx`
- O que faz: implementa o módulo `subscription-plans-selector.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/utils`
- Expõe: `SubscriptionPlansSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `subscription-status-card.tsx`
- O que faz: implementa o módulo `subscription-status-card.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/utils`
- Expõe: `SubscriptionStatusCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `subscription-trial-card.tsx`
- O que faz: implementa o módulo `subscription-trial-card.tsx` da camada `financial`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`
- Expõe: `SubscriptionTrialCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
