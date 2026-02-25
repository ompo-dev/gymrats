# student

- Caminho: `lib/services/student`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `student-profile.service.ts`: Arquivo da camada local.
- `student-progress.service.ts`: Arquivo da camada local.
- `student-workout.service.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `student-profile.service.ts`
- O que faz: implementa o módulo `student-profile.service.ts` da camada `student`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `student-progress.service.ts`
- O que faz: implementa o módulo `student-progress.service.ts` da camada `student`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `student-workout.service.ts`
- O que faz: implementa o módulo `student-workout.service.ts` da camada `student`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
