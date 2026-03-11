# 05-devops

- Caminho: `docs/05-devops`
- Finalidade: documentacao tecnica e operacional do stack local, split Vercel + Railway e suporte de ambiente.

## Arquivos principais

- `DOCKER.md`: operacao do stack Docker local com `web`, `api`, `worker`, `cron`, `redis` e `db` opcional.
- `ENV_SPLIT.md`: divisao das variaveis de ambiente entre frontend, backend e compose local.
- `MIGRATIONS.md`: fluxo operacional de migrations custom em `apps/web/scripts/migration` e comandos auxiliares de Prisma.
- `STACK_COMMANDS.md`: referencia operacional dos comandos `npm run stack:*`.
- `VERCEL_RAILWAY_SPLIT_RUNBOOK.md`: runbook operacional do split frontend Vercel + backend Railway.

## Observacoes

- O stack local atual usa `.env.docker` como ambiente padrao.
- `stack:migrate` e explicito e nao roda automaticamente no `stack:up`.
- O caminho canonico de migrations do projeto permanece em `apps/web/scripts/migration`.
