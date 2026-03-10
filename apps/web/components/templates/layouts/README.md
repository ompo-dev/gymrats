# layouts

- Caminho: `components/templates/layouts`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `app-layout.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `app-layout.tsx`
- O que faz: implementa o componente `app-layout`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `AppLayout`, `usePathname`, `useRouter`, `useQueryState`, `withDefault`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `next/navigation`, `nuqs`, `react`, `@/components/organisms/navigation/app-bottom-nav`, `@/components/organisms/navigation/app-header`, `@/contexts/swipe-direction`, `@/hooks/use-scroll-reset`, `@/hooks/use-swipe`
- Expõe: `AppLayout`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/layout-content.tsx`, `app/student/layout-content.tsx`, `components/templates/layouts/index.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./app-layout`, `./app-layout`
- Expõe: `AppLayout`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/templates/index.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
