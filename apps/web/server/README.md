# server

- Caminho: `server`
- Finalidade: backend Elysia: bootstrap, rotas, handlers, plugins e utilitários.

## Subpastas
- `handlers/`: subdomínio de `server/handlers`.
- `plugins/`: subdomínio de `server/plugins`.
- `routes/`: subdomínio de `server/routes`.
- `utils/`: subdomínio de `server/utils`.

## Arquivos
- `app.ts`: Arquivo da camada local.
- `custom-server.ts`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `app.ts`
- O que faz: implementa o módulo `app.ts` da camada `server`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@elysiajs/swagger`, `elysia`, `./plugins/auth`, `./plugins/auth-macro`, `./plugins/auth-roles`, `./plugins/cors`, `./plugins/db`, `./plugins/request-logger`, `./routes/auth`, `./routes/exercises`, `./routes/foods`, `./routes/gym-subscriptions`
- Expõe: `apiApp`
- Comunica com: Runtime Elysia
- Onde é usado/importado: `server/custom-server.ts`, `server/index.ts`

### `custom-server.ts`
- O que faz: implementa o módulo `custom-server.ts` da camada `server`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `node:http`, `node:url`, `./app`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Runtime Elysia
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `index.ts`
- O que faz: implementa o módulo `index.ts` da camada `server`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./app`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Runtime Elysia
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
