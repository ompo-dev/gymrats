# references

- Caminho: `docs/03-backend/references`
- Finalidade: documentação técnica e funcional organizada por domínio.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `llms-full.txt`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `llms-full.txt`
- O que faz: implementa o módulo `llms-full.txt` da camada `references`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `elysia`, `@elysiajs/apollo`, `elysia`, `elysia`, `elysia`, `elysia`, `zod`, `valibot`, `elysia`, `@elysiajs/openapi`, `elysia`, `@elysiajs/openapi`
- Expõe: `app`, `app`, `auth`, `signInBody`, `signInResponse`, `signInInvalid`, `AuthModel`, `auth`, `auth`, `OpenAPI`, `client`, `api`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo, Offline/sincronização, Serviços de IA, Runtime Elysia, Observabilidade/logs
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
