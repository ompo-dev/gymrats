# gym

- Caminho: `lib/services/gym`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `gym-financial.service.ts`: Arquivo da camada local.
- `gym-inventory.service.ts`: Arquivo da camada local.
- `gym-member.service.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `gym-financial.service.ts`
- O que faz: implementa o módulo `gym-financial.service.ts` da camada `gym`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@/lib/types`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `gym-inventory.service.ts`
- O que faz: implementa o módulo `gym-inventory.service.ts` da camada `gym`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@/lib/types`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `gym-member.service.ts`
- O que faz: implementa o módulo `gym-member.service.ts` da camada `gym`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
