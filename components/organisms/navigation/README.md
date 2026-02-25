# navigation

- Caminho: `components/organisms/navigation`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `app-bottom-nav.tsx`: Arquivo da camada local.
- `app-header.tsx`: Arquivo da camada local.
- `back-button.tsx`: Arquivo da camada local.
- `gym-bottom-nav.tsx`: Arquivo da camada local.
- `gym-more-menu.tsx`: Arquivo da camada local.
- `gym-selector.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `app-bottom-nav.tsx`
- O que faz: implementa o componente `app-bottom-nav`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `AppBottomNav`, `map`, `preventDefault`, `stopPropagation`, `onTabChange`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/lib/utils`
- Expõe: `AppBottomNav`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/navigation/index.ts`, `components/templates/layouts/app-layout.tsx`

### `app-header.tsx`
- O que faz: implementa o componente `app-header`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `AppHeader`, `useState`, `cn`, `setStreakModalOpen`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `next/link`, `react`, `@/lib/utils`, `../modals/streak-modal`, `./gym-selector`
- Expõe: `AppHeader`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/navigation/index.ts`, `components/templates/layouts/app-layout.tsx`

### `back-button.tsx`
- O que faz: implementa o componente `back-button`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `BackButton`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/lib/utils`
- Expõe: `BackButton`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/cardio/cardio-functional-page.tsx`, `components/organisms/navigation/index.ts`

### `gym-bottom-nav.tsx`
- O que faz: implementa o componente `gym-bottom-nav`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `GymBottomNav`, `map`, `onTabChange`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `@/lib/utils`
- Expõe: `GymBottomNav`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/navigation/index.ts`

### `gym-more-menu.tsx`
- O que faz: implementa o componente `gym-more-menu`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `GymMoreMenu`, `useQueryState`, `withDefault`, `setTab`, `setView`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `nuqs`, `@/components/animations/fade-in`, `@/components/animations/slide-in`, `@/components/ui/navigation-button-card`
- Expõe: `GymMoreMenu`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/page-content.tsx`, `components/organisms/navigation/index.ts`

### `gym-selector.tsx`
- O que faz: implementa o componente `gym-selector`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `GymSelector`, `useRouter`, `useGymsList`, `useState`, `useEffect`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `next/navigation`, `react`, `@/components/atoms/inputs/select`, `@/hooks/use-gyms-list`
- Expõe: `GymSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/navigation/app-header.tsx`, `components/organisms/navigation/index.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./app-bottom-nav`, `./app-header`, `./back-button`, `./gym-bottom-nav`, `./gym-more-menu`, `./gym-selector`
- Expõe: `AppBottomNav`, `AppHeader`, `BackButton`, `GymBottomNav`, `GymMoreMenu`, `GymSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/index.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
