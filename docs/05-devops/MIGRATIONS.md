# Migrations

## Caminho oficial

Os scripts operacionais de migration ficam em:

- `apps/web/scripts/migration`

Esse diretorio continua sendo a referencia canonica do time para manutencao de schema no ambiente real com Supabase.

## Fluxo principal do projeto

O fluxo principal usa scripts custom `apply-*.js`.

O runner usado pelo stack e pelos comandos raiz e:

- `apps/web/scripts/migration/run-stack-migrations.mjs`

Ele:

- descobre automaticamente os arquivos `apply-*.js`
- lista scripts disponiveis
- permite dry-run
- executa tudo em ordem alfabetica quando usado com `--all`

## Comandos uteis

Listar scripts custom disponiveis:

```bash
npm run migration:status
```

Revisar o lote sem aplicar:

```bash
npm run migration:dry-run
```

Aplicar todos os scripts `apply-*.js`:

```bash
npm run migration:apply
```

Rodar o mesmo fluxo via Docker stack:

```bash
npm run stack:migrate
```

Rodar um script especifico:

```bash
node apps/web/scripts/migration/run-stack-migrations.mjs --script=apply-weekly-plan-migration.js
```

## Regra de conexao

Os scripts custom usam o mesmo ambiente do projeto.

Padrao recomendado com Supabase:

- `DATABASE_URL` no pooler para runtime
- `DIRECT_URL` na conexao direta para migrations, quando o script suportar isso

Se o `.env.docker` estiver apontando para Supabase real, a migration atuara no banco real.

## Comandos auxiliares do Prisma

Os wrappers do Prisma continuam disponiveis como apoio tecnico, mas nao sao o fluxo principal do stack:

- `apps/web/scripts/migration/apply-prisma-migrations.mjs`
- `apps/web/scripts/migration/prisma-migration-status.mjs`
- `apps/web/scripts/migration/create-prisma-migration.mjs`

Ver status do historico Prisma:

```bash
npm run migration:status:prisma -- --env-file=.env.docker
```

Aplicar migrations Prisma pendentes:

```bash
npm run migration:apply:prisma -- --env-file=.env.docker
```

Criar uma nova migration Prisma:

```bash
npm run migration:create -- add_new_feature --env-file=.env.docker
```

## Onde o Prisma grava migrations versionadas

As migrations do Prisma continuam sendo persistidas em:

- `packages/db/prisma/migrations`

Ou seja:

- os scripts operacionais vivem em `apps/web/scripts/migration`
- o runner canonico do stack vive em `apps/web/scripts/migration/run-stack-migrations.mjs`
- os artefatos versionados do Prisma continuam em `packages/db/prisma/migrations`
