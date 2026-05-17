# Vercel + Railway Split Runbook

## Objetivo

Este runbook documenta o split operacional alvo do GymRats:

- `apps/web` continua como frontend Next.js na Vercel.
- `apps/api` e o backend HTTP canonico no Railway.
- `apps/worker` processa filas e webhooks no Railway.
- `apps/cron` executa jobs agendados no Railway.

O contrato externo `/api/*` deve permanecer no host do frontend via proxy same-origin da Vercel para a API no Railway.

## Estado atual consolidado

- Frontend usa `/api` no browser quando `API_PROXY_TARGET` esta configurado.
- Fluxos de SSE de treino/nutricao usam URL absoluta da API.
- Better Auth centralizado para `Bearer`, `one-time-token` e `trustedOrigins`.
- Redis/BullMQ em pacotes compartilhados com carregamento lazy para nao quebrar build do frontend.
- API expoe `GET /health`, `GET /healthz` (liveness) e `GET /readyz` (readiness por dependencia).
- Cron semanal esta fail-closed com `CRON_SECRET` obrigatorio.
- Politica de idempotencia com fingerprint por rota/metodo/ator/body canonico.
- Modo de saque e controlado apenas no servidor por `PAYOUT_EXECUTION_MODE`.

## Scripts de verificacao

Na raiz do repo:

```bash
npm run verify:split
npm run build
```

- `verify:split` valida fronteira do frontend e gera bundles de `api`, `worker` e `cron`.
- `build` valida o build atual do `apps/web`.

## Servicos no Railway

Criar tres servicos a partir da raiz do repositorio, sem mudar o `Root Directory`.

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
- `NODE_ENV=production`
- `PAYOUT_EXECUTION_MODE=fake|real`

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

## Politicas operacionais U1

### 1) Cron seguro (fail-closed)

- `CRON_SECRET` e obrigatorio em runtime da API.
- Endpoint `/api/cron/week-reset` exige `Authorization: Bearer <CRON_SECRET>`.
- Sem header valido (ou sem segredo configurado), a API retorna `401`.

Exemplo de chamada autorizada:

```bash
curl -i \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://api.seudominio.com/api/cron/week-reset
```

### 2) Readiness e health

- `GET /health` e `GET /healthz`: liveness simples.
- `GET /readyz`: readiness real, validando `database` e `redis`.
- `readyz` retorna:
  - `200` com `status=ready` quando dependencias estao OK.
  - `503` com `status=not_ready` quando alguma dependencia falha.

### 3) Politica oficial de idempotencia

- Aplica em `POST/PATCH/DELETE` quando o cliente envia `x-idempotency-key`.
- Fingerprint canonico inclui: `route + method + actorId + body ordenado`.
- Reuso da mesma chave com fingerprint diferente retorna `409`.
- Reuso identico retorna replay com header `X-Idempotency-Replay: true`.

Recomendacao de cliente:

- Gerar chave unica por acao mutavel do usuario.
- Reutilizar a mesma chave apenas para retry da mesma acao.
- Nunca reaproveitar a mesma chave para payload diferente.

### 4) Politica de payout fake/real

- `PAYOUT_EXECUTION_MODE=fake`: saque simulado server-side (modo atual de testes).
- `PAYOUT_EXECUTION_MODE=real`: saque real via PSP.
- O cliente nao deve controlar simulacao; a decisao e exclusivamente server-side.
- Logs de auditoria distinguem simulacao via `simulation=true`.

## Ordem segura de rollout

1. Subir `api`, `worker` e `cron` no Railway com variaveis completas.
2. Validar `GET /healthz` e `GET /readyz` na API.
3. Testar auth, pagamentos e webhooks em homologacao com `API_PROXY_TARGET` apontando para Railway.
4. Configurar `API_PROXY_TARGET` e `API_INTERNAL_URL` na Vercel para o dominio da API.
5. Validar login, callback OAuth, chat-stream, pagamentos e week-reset sem preflight indevido no browser.
6. Desligar o uso publico das rotas legadas `app/api/*` do Next apenas apos paridade homologada.

## Criticos de operacao

- Em producao Railway, `REDIS_URL` e obrigatoria para `api`, `worker` e `cron`.
- Frontend nao deve importar banco, BullMQ ou workflows server-side em componentes/hooks/stores.
- Webhook de pagamento entra pela API e delega processamento pesado ao worker.
- Cron semanal deve rodar no Railway, nao na Vercel.
- Antes de deploy com Prisma, rodar safety-check da cadeia de migration.

## Validacao e rollback

Checklist detalhado de validacao pos-deploy e plano de rollback:

- `docs/05-devops/U1_POST_DEPLOY_CHECKLIST.md`

## Observacoes

- Projeto segue com clientes ativos; rollout deve ser controlado e sem quebra de contrato.
- Durante fase operacional de testes, manter `PAYOUT_EXECUTION_MODE=fake` ate decisao explicita de go-live financeiro real.
