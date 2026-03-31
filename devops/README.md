# DevOps

## Objetivo

Esta pasta consolida o material operacional principal do projeto:

- deploy do frontend na Vercel
- deploy da API, worker e cron no Railway
- stack local com Docker
- exemplos de env por plataforma
- ordem segura de rollout

## Fontes de verdade no repo

- [Dockerfile](/C:/Projects/Teste/GymRats-Complete/gymrats/Dockerfile)
- [Dockerfile.api](/C:/Projects/Teste/GymRats-Complete/gymrats/Dockerfile.api)
- [Dockerfile.web](/C:/Projects/Teste/GymRats-Complete/gymrats/Dockerfile.web)
- [docker-compose.yml](/C:/Projects/Teste/GymRats-Complete/gymrats/docker-compose.yml)
- [docker-compose.dev.yml](/C:/Projects/Teste/GymRats-Complete/gymrats/docker-compose.dev.yml)
- [scripts/stack.mjs](/C:/Projects/Teste/GymRats-Complete/gymrats/scripts/stack.mjs)
- [vercel.json](/C:/Projects/Teste/GymRats-Complete/gymrats/vercel.json)

## Arquivos desta pasta

- [vercel.env.example](/C:/Projects/Teste/GymRats-Complete/gymrats/devops/env/vercel.env.example)
- [railway-api.env.example](/C:/Projects/Teste/GymRats-Complete/gymrats/devops/env/railway-api.env.example)
- [railway-worker.env.example](/C:/Projects/Teste/GymRats-Complete/gymrats/devops/env/railway-worker.env.example)
- [railway-cron.env.example](/C:/Projects/Teste/GymRats-Complete/gymrats/devops/env/railway-cron.env.example)
- [docker.env.example](/C:/Projects/Teste/GymRats-Complete/gymrats/devops/env/docker.env.example)
- [REDEPLOY.md](/C:/Projects/Teste/GymRats-Complete/gymrats/devops/REDEPLOY.md)

## Modelo atual

- O browser fala com `/api` no host da Vercel quando `API_PROXY_TARGET` esta configurado.
- O SSR e server actions usam `API_INTERNAL_URL` direto para o Railway.
- `BETTER_AUTH_URL` deve apontar para a origem publica do app, nao para a origem da API.

## Comandos locais

Inicializar env do stack:

```bash
npm run stack:init
```

Buildar imagens:

```bash
npm run stack:build
```

Subir containers:

```bash
npm run stack:up
```

Atualizar imagens e recriar containers:

```bash
npm run stack:update
```

Logs:

```bash
npm run stack:logs
```

Parar containers:

```bash
npm run stack:down
```

## Ordem segura de rollout

1. Atualizar envs do Railway API.
2. Redeploy da API no Railway.
3. Atualizar envs da Vercel.
4. Redeploy do frontend.
5. Validar login, callback OAuth, logout, `/student`, `/gym`, `/personal` e chamadas `/api/*` same-origin.
