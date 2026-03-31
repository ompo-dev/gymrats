# middleware

- Caminho: `lib/api/middleware`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `auth.middleware.ts`: Arquivo da camada local.
- `validation.middleware.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `auth.middleware.ts`
- O que faz: implementa o módulo `auth.middleware.ts` da camada `middleware`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/headers`, `next/server`, `@/lib/utils/session`
- Expõe: `extractAuthToken`, `requireAuth`, `requireStudent`, `requireGym`, `requireAdmin`
- Comunica com: Autenticação/sessão
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `validation.middleware.ts`
- O que faz: implementa o módulo `validation.middleware.ts` da camada `middleware`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `next/server`, `zod`, `../utils/response.utils`
- Expõe: `validateRequest`, `validateBody`, `validateQuery`, `validateBodyAndQuery`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
