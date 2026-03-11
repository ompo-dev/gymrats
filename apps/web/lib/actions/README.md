# actions

- Caminho: `lib/actions`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `abacate-pay.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `abacate-pay.ts`
- O que faz: implementa o módulo `abacate-pay.ts` da camada `actions`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@gymrats/api/abacatepay`, `@/lib/utils/student-context`
- Expõe: `createAbacateBilling`, `confirmAbacatePayment`
- Comunica com: Banco de dados (Prisma), HTTP interno/externo
- Onde é usado/importado: `app/student/payments/student-payments-page.tsx`, `components/organisms/sections/subscription-section.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
