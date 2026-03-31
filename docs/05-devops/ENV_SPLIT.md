# Env Split

## Objetivo

Este documento registra a divisao de variaveis de ambiente para o split local:

- `web` na porta `3000`
- `api` na porta `4000`
- `worker` e `cron` como runtimes de backend
- banco remoto no Supabase
- Redis local no Docker

## Variaveis publicas do frontend

Essas variaveis entram no build do `web`:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FAKE_WITHDRAW`

No split local, os valores canonicos sao:

- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NEXT_PUBLIC_API_URL=http://localhost:4000`

## Variaveis server-side do frontend

Essas variaveis sao usadas pelo runtime server-side do `web`:

- `API_PROXY_TARGET`
- `API_INTERNAL_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `DATABASE_URL`
- `REDIS_URL`

No split local:

- `API_PROXY_TARGET=http://api:4000`
- `API_INTERNAL_URL=http://api:4000`
- `BETTER_AUTH_URL=http://localhost:3000`

## Variaveis compartilhadas de backend

Essas variaveis alimentam `api`, `worker` e `cron`:

- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `TRUSTED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DEEPSEEK_API_KEY`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `ABACATEPAY_API_TOKEN`
- `ABACATEPAY_WEBHOOK_SECRET`
- `CRON_SECRET`

## Banco remoto no Supabase

Para o ambiente local real do projeto:

- `DATABASE_URL` continua no pooler do Supabase
- `DIRECT_URL` continua na conexao direta do Supabase

Regra pratica:

- runtime normal: `DATABASE_URL`
- migrations: `DIRECT_URL`, quando existir

No stack local atual:

- `stack:migrate` usa o mesmo `.env.docker`
- se `.env.docker` estiver apontando para Supabase real, a migration atuara no banco real
- por isso o fluxo recomendado e revisar com `npm run migration:status` e `npm run migration:dry-run` antes de aplicar

## Infra local do Docker

Essas variaveis sao especificas do compose:

- `COMPOSE_PROJECT_NAME`
- `WEB_PORT`
- `API_PORT`
- `REDIS_PORT`
- `HOST`
- `NODE_ENV`

O Postgres local existe apenas como opcao via profile `local-db`. O caminho padrao do time continua sendo Supabase remoto.
