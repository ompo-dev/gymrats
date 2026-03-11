# molecules

- Caminho: `components/molecules`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- `badges/`: subdomínio de `components/molecules/badges`.
- `cards/`: subdomínio de `components/molecules/cards`.
- `forms/`: subdomínio de `components/molecules/forms`.
- `selectors/`: subdomínio de `components/molecules/selectors`.

## Arquivos
- `index.ts`: Arquivo da camada local.
- `limitation-selector.tsx`: Arquivo da camada local.
- `relative-time.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./badges`, `./cards`, `./forms`, `./selectors`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `limitation-selector.tsx`
- O que faz: implementa o componente `limitation-selector`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `LimitationSelector`, `setHasLimitations`, `onChange`, `keys`, `forEach`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/ui/form-input`, `@/components/ui/option-selector`
- Expõe: `LimitationSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/onboarding/steps/consolidated-step3.tsx`, `app/student/onboarding/steps/step7.tsx`

### `relative-time.tsx`
- O que faz: implementa o componente `relative-time`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `RelativeTime`, `useRelativeTime`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@/hooks/use-relative-time`
- Expõe: `RelativeTime`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-dashboard.tsx`, `app/gym/dashboard/page-content.tsx`, `app/gym/equipment/[id]/page-content.tsx`, `app/gym/equipment/page-content.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
