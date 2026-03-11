# Docker - GymRats Split Stack

## Objetivo

Esta camada Docker representa o desenho operacional atual do monorepo:

- `web`: frontend Next.js
- `api`: backend HTTP em Elysia
- `worker`: processamento assincrono com BullMQ
- `cron`: job one-shot para tarefas agendadas
- `db`: PostgreSQL local para stack self-contained
- `redis`: Redis local para filas e cache

## Arquivos principais

- `Dockerfile`: multi-target com imagens de `web`, `api`, `worker` e `cron`
- `Dockerfile.dev`: imagem base para desenvolvimento com bind mount
- `docker-compose.yml`: stack principal
- `docker-compose.dev.yml`: stack de desenvolvimento com hot reload
- `.env.docker.example`: exemplo de ambiente local
- `.env.docker`: ambiente local real usado pelo stack
- `scripts/stack.mjs`: CLI operacional do stack
- `apps/web/scripts/migration/*`: scripts operacionais de migration

## Como os containers se conversam

- O navegador acessa `web` em `http://localhost:3000`
- O navegador acessa a API publica em `http://localhost:4000`
- O container `web` usa `API_INTERNAL_URL=http://api:4000` para chamadas server-side
- `api`, `worker` e `cron` usam o mesmo `DATABASE_URL`
- Os scripts custom de migration usam o mesmo conjunto de variaveis do compose
- O Prisma usa `DATABASE_URL` para runtime e `DIRECT_URL` para migrations quando disponivel
- `api`, `worker` e `cron` usam o mesmo `REDIS_URL`
- O `web` tambem recebe `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Webhooks entram por `api` e delegam processamento ao `worker`
- O `cron` e executado sob demanda no Docker e como scheduler dedicado em Railway

## Comandos simples

Inicializar ambiente:

```bash
npm run stack:init
```

Subir stack principal:

```bash
npm run stack:up
```

Subir stack de desenvolvimento:

```bash
npm run stack:dev:up
```

Status:

```bash
npm run stack:status
```

Rodar migrations manualmente:

```bash
npm run stack:migrate
```

Logs:

```bash
npm run stack:logs
```

Monitoramento:

```bash
npm run stack:monitor
```

Atualizar imagens e recriar containers:

```bash
npm run stack:update
```

Rodar o cron manualmente:

```bash
npm run stack:cron
```

Parar stack:

```bash
npm run stack:down
```

Guia detalhado dos comandos:

- ver [STACK_COMMANDS.md](/C:/Projects/Teste/GymRats-Complete/gymrats/docs/05-devops/STACK_COMMANDS.md)

Guia de reparticao do ambiente:

- ver [ENV_SPLIT.md](/C:/Projects/Teste/GymRats-Complete/gymrats/docs/05-devops/ENV_SPLIT.md)

Guia do fluxo de migrations:

- ver [MIGRATIONS.md](/C:/Projects/Teste/GymRats-Complete/gymrats/docs/05-devops/MIGRATIONS.md)

## Observacoes

- O frontend usa `NEXT_PUBLIC_API_URL` no browser e `API_INTERNAL_URL` no servidor.
- Em ambientes com Supabase, mantenha `DATABASE_URL` no pooler e `DIRECT_URL` na conexao direta.
- O entrypoint oficial de migrations do stack fica em `apps/web/scripts/migration/run-stack-migrations.mjs`.
- O build do `web` continua funcionando mesmo com o backend legado do Next ainda presente.
- O uso recomendado para Docker local e o arquivo `.env.docker`.
- `npm run stack:migrate` e sempre explicito e deve ser rodado conscientemente quando o `.env.docker` apontar para Supabase real.
- `npm run stack:up` e `npm run stack:update` nao executam migrations automaticamente.
- `db` local agora e opcional, via profile `local-db`.
- Em producao real, `redis` e o banco podem ser substituidos por servicos gerenciados.
