# migrations

- Caminho: `prisma/migrations`
- Finalidade: schema e migrações de banco de dados via Prisma.

## Subpastas
- `20251203214532_init/`: subdomínio de `prisma/migrations/20251203214532_init`.
- `20251210190639_add_subscriptions_and_abacatepay/`: subdomínio de `prisma/migrations/20251210190639_add_subscriptions_and_abacatepay`.

## Arquivos
- `manual_add_subscriptions.sql`: Migração/artefato de banco de dados.
- `migration_lock.toml`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `manual_add_subscriptions.sql`
- O que faz: aplica migração SQL `manual_add_subscriptions.sql` no schema do banco.
- Como: executa alterações estruturais (tabelas, colunas, índices, constraints) conforme versão.
- Por que: mantém evolução de dados rastreável e reproduzível entre ambientes.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `migration_lock.toml`
- O que faz: implementa o módulo `migration_lock.toml` da camada `migrations`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
