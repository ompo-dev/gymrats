# subscription

- Caminho: `components/organisms/sections/subscription`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `billing-period-selector.tsx`: Arquivo da camada local.
- `plan-card.tsx`: Arquivo da camada local.
- `plan-features.tsx`: Arquivo da camada local.
- `plans-selector.tsx`: Arquivo da camada local.
- `subscription-status.tsx`: Arquivo da camada local.
- `trial-offer.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `billing-period-selector.tsx`
- O que faz: implementa o componente `billing-period-selector`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `BillingPeriodSelector`, `cn`, `onSelect`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@/components/molecules/cards/duo-card`, `@/lib/utils`
- Expõe: `BillingPeriodSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/sections/subscription/plans-selector.tsx`

### `plan-card.tsx`
- O que faz: implementa o componente `plan-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `PlanCard`, `cn`, `round`, `toLocaleString`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/molecules/cards/duo-card`, `@/lib/utils`, `../subscription-section`
- Expõe: `PlanCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/sections/subscription/plans-selector.tsx`

### `plan-features.tsx`
- O que faz: implementa o componente `plan-features`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `PlanFeatures`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`
- Expõe: `PlanFeatures`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/sections/subscription/plans-selector.tsx`

### `plans-selector.tsx`
- O que faz: implementa o componente `plans-selector`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `PlansSelector`, `find`, `log`, `map`, `getAnnualDiscount`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/section-card`, `@/lib/utils`, `../subscription-section`, `./billing-period-selector`, `./plan-card`, `./plan-features`
- Expõe: `PlansSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/sections/subscription-section.tsx`

### `subscription-status.tsx`
- O que faz: implementa o componente `subscription-status`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `SubscriptionStatus`, `cn`, `max`, `ceil`, `getTime`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/lib/utils`
- Expõe: `SubscriptionStatus`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/sections/subscription-section.tsx`

### `trial-offer.tsx`
- O que faz: implementa o componente `trial-offer`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `TrialOffer`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`
- Expõe: `TrialOffer`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/sections/subscription-section.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
