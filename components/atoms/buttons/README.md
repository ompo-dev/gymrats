# buttons

- Caminho: `components/atoms/buttons`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `button.tsx`: Arquivo da camada local.
- `duo-button.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `button.tsx`
- O que faz: implementa o componente `button`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `not`, `Button`, `cn`, `buttonVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-slot`, `class-variance-authority`, `react`, `@/lib/utils`
- Expõe: `Button`, `buttonVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/financial/financial-coupons-tab.tsx`, `app/gym/components/financial/financial-expenses-tab.tsx`, `app/gym/components/financial/financial-payments-tab.tsx`, `app/gym/components/financial/subscription-plans-selector.tsx`, `app/gym/components/financial/subscription-status-card.tsx`, `app/gym/components/financial/subscription-trial-card.tsx`, `app/gym/onboarding/page.tsx`, `app/gym/onboarding/steps/step4.tsx`, `app/student/learn/learning-path.tsx`, `app/student/payments/student-payments-page.tsx`, `app/welcome/page.tsx`, `components/atoms/buttons/index.ts`

### `duo-button.tsx`
- O que faz: implementa o componente `duo-button`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `cn`, `duoButtonVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-slot`, `class-variance-authority`, `motion/react`, `react`, `@/lib/utils`
- Expõe: `DuoButton`, `duoButtonVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/buttons/index.ts`, `components/ui/_compat.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./button`, `./duo-button`, `./duo-button`
- Expõe: `Button`, `buttonVariants`, `DuoButton`, `duoButtonVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/atoms/index.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
