# organisms

- Caminho: `components/organisms`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- `education/`: subdomínio de `components/organisms/education`.
- `generators/`: subdomínio de `components/organisms/generators`.
- `home/`: subdomínio de `components/organisms/home`.
- `modals/`: subdomínio de `components/organisms/modals`.
- `navigation/`: subdomínio de `components/organisms/navigation`.
- `pwa/`: subdomínio de `components/organisms/pwa`.
- `sections/`: subdomínio de `components/organisms/sections`.
- `trackers/`: subdomínio de `components/organisms/trackers`.
- `workout/`: subdomínio de `components/organisms/workout`.

## Arquivos
- `error-boundary.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `loading-screen.tsx`: Arquivo da camada local.
- `performance-optimizer.tsx`: Arquivo da camada local.
- `reminders-banner.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `error-boundary.tsx`
- O que faz: implementa o componente `error-boundary`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `constructor`, `super`, `getDerivedStateFromError`, `now`, `random`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/lib/utils`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Offline/sincronização
- Onde é usado/importado: `app/layout.tsx`, `components/organisms/index.ts`, `components/providers/client-providers.tsx`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./education`, `./error-boundary`, `./generators`, `./home`, `./loading-screen`, `./modals`, `./navigation`, `./performance-optimizer`, `./pwa`, `./sections`, `./trackers`, `./workout`
- Expõe: `ErrorBoundary`, `LoadingScreen`, `PerformanceOptimizer`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `loading-screen.tsx`
- O que faz: implementa o componente `loading-screen`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LoadingScreen`, `cn`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/lib/utils`
- Expõe: `LoadingScreen`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/layout.tsx`, `app/student/layout-content.tsx`, `app/student/layout.tsx`, `components/organisms/index.ts`

### `performance-optimizer.tsx`
- O que faz: implementa o componente `performance-optimizer`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `PerformanceOptimizer`, `useEffect`, `createElement`, `appendChild`, `addPreconnect`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`
- Expõe: `PerformanceOptimizer`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/layout.tsx`, `components/organisms/index.ts`

### `reminders-banner.tsx`
- O que faz: implementa o componente `reminders-banner`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `RemindersBanner`, `useReminderNotifications`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@/components/ui/button`, `@/hooks/use-reminder-notifications`
- Expõe: `RemindersBanner`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
