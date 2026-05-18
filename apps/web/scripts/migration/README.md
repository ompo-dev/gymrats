# migration

- Caminho: `apps/web/scripts/migration`
- Finalidade: scripts de manutencao, migracao e suporte operacional.

## Fluxo atual

- Scripts `apply-*.js` sao o fluxo operacional principal do projeto.
- O runner canonico do stack e `run-stack-migrations.mjs`.
- Para listar scripts disponiveis: `npm run migration:status`
- Para revisar sem aplicar: `npm run migration:dry-run`
- Para aplicar todos os `apply-*.js`: `npm run migration:apply`
- Para aplicar um script especifico: `npm run migration:apply:script -- --script=apply-nome-da-migration.js`
- Os wrappers `*.mjs` de Prisma continuam apenas como apoio tecnico complementar.

## Ordenacao e preflight de dependencias

- O runner aplica preflight antes de executar:
  - valida mapa de dependencias conhecidas;
  - expande dependencias faltantes (auto-include) quando necessario;
  - ordena por grafo de dependencias com fallback deterministico por ordem alfabetica.
- Dependencias conhecidas atualmente:
  - `apply-weekly-plan-description-migration.js` depende de `apply-weekly-plan-migration.js`.
  - `apply-subscription-billing-period-migration.js` depende de `apply-subscriptions-migration.js`.
  - `apply-own-period-backup-migration.js` depende de `apply-subscriptions-migration.js`.
  - `apply-boost-campaign-radius-km-migration.js` depende de `apply-boost-campaign-migration.js`.
  - `apply-boost-campaign-engagement-migration.js` depende de `apply-boost-campaign-migration.js`.
  - `apply-referral-student-code-migration.js` depende de `apply-referral-migration.js`.
- Use `npm run migration:dry-run` para ver a ordem final apos preflight.

## Safety-check Prisma (trilha A/B)

- Script: `prisma-migration-safety.mjs`.
- Politica por track:
  - `track=A`: inconsistencias estaticas conhecidas viram advisory (nao bloqueia), com orientacao de baseline/resolve por ambiente.
  - `track=B`: inconsistencias estaticas bloqueiam deploy.
  - `track=auto`: tenta inferir via `_prisma_migrations`; se nao conseguir inferir, roda em advisory por padrao.
- Flags uteis:
  - `--track=auto|A|B`
  - `--fail-on-indeterminate=true|false`
  - `--require-db-state=true|false`
- Variaveis de ambiente equivalentes:
  - `PRISMA_MIGRATION_TRACK=auto|A|B`
  - `PRISMA_MIGRATION_SAFETY_FAIL_ON_INDETERMINATE=true|false`
- `apply-prisma-migrations.mjs` roda safety-check em modo bloqueante para estado indeterminado (`fail-on-indeterminate=true`) antes de `prisma migrate deploy`.

## Arquivos auxiliares

- `run-stack-migrations.mjs`: descobre e executa scripts `apply-*.js`
- `apply-prisma-migrations.mjs`: wrapper Prisma auxiliar
- `prisma-migration-status.mjs`: diagnostico auxiliar do historico Prisma
- `create-prisma-migration.mjs`: helper opcional para gerar migration Prisma
