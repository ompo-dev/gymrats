# supabase

- Caminho: `utils/supabase`
- Finalidade: integração Supabase para cliente, servidor e middleware.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `client.ts`: Arquivo da camada local.
- `middleware.ts`: Arquivo da camada local.
- `server.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `client.ts`
- O que faz: implementa o módulo `client.ts` da camada `supabase`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@supabase/ssr`
- Expõe: `createClient`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `middleware.ts`
- O que faz: implementa o módulo `middleware.ts` da camada `supabase`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@supabase/ssr`, `next/server`
- Expõe: `createClient`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `server.ts`
- O que faz: implementa o módulo `server.ts` da camada `supabase`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@supabase/ssr`, `next/headers`
- Expõe: `createClient`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
