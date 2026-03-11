# payments

- Caminho: `app/student/payments`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `student-payments-page.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `student-payments-page.tsx`
- O que faz: implementa o módulo `student-payments-page.tsx` da camada `payments`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `nuqs`, `react`, `@/lib/actions/abacate-pay`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/duo-card`, `@/components/molecules/cards/section-card`, `@/components/molecules/cards/stat-card-large`, `@/components/molecules/selectors/option-selector`, `@/components/organisms/modals/subscription-cancel-dialog`, `@/components/organisms/sections/subscription-section`, `@/hooks/use-load-prioritized`
- Expõe: `StudentPaymentsPage`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/student/page-content.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
