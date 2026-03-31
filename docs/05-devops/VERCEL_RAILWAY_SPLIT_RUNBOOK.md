# Vercel + Railway Split Runbook

## Objetivo

Este runbook documenta o split operacional alvo do GymRats:

- `apps/web` continua como frontend em Next.js na Vercel
- `apps/api` vira o backend HTTP canonico no Railway
- `apps/worker` processa filas e webhooks no Railway
- `apps/cron` executa jobs agendados no Railway

O contrato externo `/api/*` deve ser preservado no host do frontend, com proxy same-origin da Vercel para o backend dedicado no Railway.

## Estado atual consolidado

- O frontend usa `/api` no browser quando `API_PROXY_TARGET` esta configurado.
- Os fluxos de SSE do chat de treino e nutricao ja usam URL absoluta da API.
- Better Auth foi centralizado para aceitar `Bearer`, `one-time-token` e `trustedOrigins`.
- Redis e BullMQ foram movidos para pacotes compartilhados e deixados lazy para nao quebrar o build do frontend.
- O monorepo ja possui scripts de verificacao do split.

## Scripts de verificacao

Na raiz do repo:

```bash
npm run verify:split
npm run build
```

O primeiro valida a fronteira do frontend e gera bundles de `api`, `worker` e `cron`.
O segundo continua validando o build atual do `apps/web`.

## Servicos no Railway

Criar tres servicos a partir da raiz do repositório, sem mudar o `Root Directory`:

### API

- Build command: `npm run build:api`
- Start command: `npm run start:api`

### Worker

- Build command: `npm run build:worker`
- Start command: `npm run start:worker`

### Cron

- Build command: `npm run build:cron`
- Start command: `npm run start:cron`

## Frontend na Vercel

Manter o projeto apontando para a raiz do repo:

- Root Directory: `./`
- Install Command: `bun install`
- Build Command: `bun run build`
- Output Directory: `apps/web/.next`

## Variaveis de ambiente

### Compartilhadas entre API, Worker e Cron

- `DATABASE_URL`
- `REDIS_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ABACATEPAY_API_TOKEN`
- `ABACATEPAY_WEBHOOK_SECRET`

### API

- `PORT`
- `BETTER_AUTH_URL=https://app.seudominio.com`
- `NEXT_PUBLIC_API_URL=https://api.seudominio.com`
- `NEXT_PUBLIC_APP_URL=https://app.seudominio.com`
- `CORS_ALLOWED_ORIGINS=https://app.seudominio.com`
- `TRUSTED_ORIGINS=https://app.seudominio.com`
- `CRON_SECRET`

### Worker

- `NEXT_PUBLIC_API_URL=https://api.seudominio.com`
- `NEXT_PUBLIC_APP_URL=https://app.seudominio.com`

### Cron

- `NEXT_PUBLIC_API_URL=https://api.seudominio.com`
- `NEXT_PUBLIC_APP_URL=https://app.seudominio.com`

### Vercel / Frontend

- `NEXT_PUBLIC_APP_URL=https://app.seudominio.com`
- `API_PROXY_TARGET=https://api.seudominio.com`
- `API_INTERNAL_URL=https://api.seudominio.com`
- `BETTER_AUTH_URL=https://app.seudominio.com`
- `NEXT_PUBLIC_API_URL=https://api.seudominio.com`

## Ordem segura de rollout

1. Subir `api`, `worker` e `cron` no Railway com variaveis completas.
2. Validar `GET /healthz` na API.
3. Testar auth, pagamentos e webhooks em homologacao com `API_PROXY_TARGET` apontando para o Railway.
4. Configurar `API_PROXY_TARGET` e `API_INTERNAL_URL` na Vercel para o dominio da API.
5. Validar login, callback OAuth, chat-stream, pagamentos e week-reset sem preflight no browser.
6. Desligar o uso publico das rotas `app/api/*` do Next apenas quando a paridade estiver homologada.

## Criticos de operacao

- Em producao do Railway, `REDIS_URL` e obrigatoria para `api`, `worker` e `cron`.
- O frontend nao deve importar banco, BullMQ ou workflows server-side em componentes, hooks e stores.
- O webhook de pagamento deve entrar pela API e delegar o processamento pesado ao worker.
- O cron semanal deve rodar no Railway, nao na Vercel.

## Observacoes

- O projeto segue em producao com clientes ativos; o rollout deve ser controlado e sem quebra de contrato.
- O build do frontend continua passando no estado atual, mesmo antes do corte final do backend legado do Next.
