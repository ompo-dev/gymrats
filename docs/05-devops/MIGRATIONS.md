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
- roda preflight de dependencias conhecidas
- auto-inclui dependencias faltantes quando necessario
- executa na ordem topologica das dependencias (com desempate alfabetico)

## Comandos uteis

Listar scripts custom disponiveis:

```bash
npm run migration:status
```

Revisar o lote sem aplicar:

```bash
npm run migration:dry-run
```

Rodar preflight e selecionar track explicita de safety Prisma:

```bash
npm run migration:safety:prisma -- --track=A
npm run migration:safety:prisma -- --track=B
```

Via variavel de ambiente (pipeline/deploy):

```bash
PRISMA_MIGRATION_TRACK=A npm run migration:safety:prisma
PRISMA_MIGRATION_TRACK=B npm run migration:safety:prisma
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
- `apps/web/scripts/migration/prisma-migration-safety.mjs`

Ver status do historico Prisma:

```bash
npm run migration:status:prisma -- --env-file=.env.docker
```

Aplicar migrations Prisma pendentes:

```bash
npm run migration:apply:prisma -- --env-file=.env.docker
```

Rodar safety-check da cadeia Prisma (obrigatorio antes de deploy Prisma):

```bash
npm run migration:safety:prisma -- --env-file=.env.docker
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

## Estrategia de historico Prisma (trilha A/B)

- Trilha A: ambiente onde migrations legadas ja foram aplicadas. Nao reescrever historico aplicado; tratar com resolve/baseline por ambiente.
- Trilha B: ambiente sem aplicacao completa da cadeia legada. Corrigir cadeia/estrategia antes de `prisma migrate deploy`.
- Com `--track=auto`, o safety-check tenta inferir A/B por `_prisma_migrations`.
- Se a inferencia automatica nao for possivel:
  - modo padrao (`fail-on-indeterminate=false`): advisory, sem bloqueio indiscriminado;
  - modo estrito (`fail-on-indeterminate=true`): bloqueante.
- O `apply-prisma-migrations.mjs` roda `prisma-migration-safety.mjs` com modo estrito antes de `prisma migrate deploy`.

## Guard-rail em CI

- O workflow `.github/workflows/security.yml` executa:
  - `npm ci` (lock `package-lock.json`) para install reproduzivel no modelo hibrido atual;
  - `npm run migration:safety:prisma -- --track=auto --fail-on-indeterminate=false`.
- CI continua sinalizando inconsistencias estaticas, mas nao bloqueia indiscriminadamente quando o estado real da `_prisma_migrations` nao pode ser inferido nesse contexto.
- O bloqueio estrito permanece no fluxo de deploy Prisma (`apply-prisma-migrations.mjs`) para evitar rollout em ambiente sem decisao explicita de track.
