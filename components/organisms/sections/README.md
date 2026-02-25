# sections

- Caminho: `components/organisms/sections`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- `subscription/`: subdomínio de `components/organisms/sections/subscription`.

## Arquivos
- `gym-map.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `shop-card.tsx`: Arquivo da camada local.
- `subscription-section.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `gym-map.tsx`
- O que faz: implementa o componente `gym-map`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `GymMap`, `useEffect`, `getCurrentPosition`, `setUserLocation`, `filter`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/components/molecules/selectors/option-selector`, `@/lib/types`, `@/lib/utils`
- Expõe: `GymMap`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/page-content.tsx`, `components/organisms/sections/index.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./gym-map`, `./shop-card`, `./subscription-section`, `./subscription-section`
- Expõe: `GymMap`, `ShopCard`, `SubscriptionSection`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/index.ts`

### `shop-card.tsx`
- O que faz: implementa o componente `shop-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ShopCard`, `useStudent`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/hooks/use-student`
- Expõe: `ShopCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/sections/index.ts`

### `subscription-section.tsx`
- O que faz: implementa o componente `subscription-section`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `SubscriptionSection`, `useSubscriptionUIStore`, `useToast`, `useSearchParams`, `get`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/components/molecules/cards/duo-card`, `@/hooks/use-student`, `@/hooks/use-toast`, `@/stores/subscription-ui-store`, `@/lib/actions/abacate-pay`, `@/lib/utils/subscription-helpers`, `./subscription/plans-selector`, `./subscription/subscription-status`, `./subscription/trial-offer`, `next/navigation`, `react`
- Expõe: `SubscriptionSection`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/financial/financial-subscription-tab.tsx`, `app/student/payments/student-payments-page.tsx`, `components/organisms/sections/index.ts`, `components/organisms/sections/subscription/plan-card.tsx`, `components/organisms/sections/subscription/plans-selector.tsx`, `stores/subscription-ui-store.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
