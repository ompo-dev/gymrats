# migration

- Caminho: `apps/web/scripts/migration`
- Finalidade: scripts de manutencao, migracao e suporte operacional.

## Fluxo atual

- Scripts `apply-*.js` sao o fluxo operacional principal do projeto.
- O runner canonico do stack e `run-stack-migrations.mjs`.
- Para listar scripts disponiveis: `npm run migration:status`
- Para revisar sem aplicar: `npm run migration:dry-run`
- Para aplicar todos os `apply-*.js`: `npm run migration:apply`
- Os wrappers `*.mjs` de Prisma continuam apenas como apoio tecnico complementar.

## Arquivos auxiliares

- `run-stack-migrations.mjs`: descobre e executa scripts `apply-*.js`
- `apply-prisma-migrations.mjs`: wrapper Prisma auxiliar
- `prisma-migration-status.mjs`: diagnostico auxiliar do historico Prisma
- `create-prisma-migration.mjs`: helper opcional para gerar migration Prisma
