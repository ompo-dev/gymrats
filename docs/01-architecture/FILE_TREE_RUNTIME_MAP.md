# File Tree Runtime Map

## Topologia principal

```text
apps/
  web/      -> frontend Next.js, shell autenticado, PWA, providers e UI
  api/      -> backend Elysia publico, contratos HTTP e webhooks
  worker/   -> workers BullMQ para email, webhook e jobs pesados
  cron/     -> jobs one-shot agendaveis

packages/
  api/              -> client HTTP compartilhado, token storage e base URL
  auth/             -> Better Auth centralizado
  cache/            -> Redis + BullMQ + dead-letter queues
  db/               -> Prisma client compartilhado
  env/              -> helpers de ambiente
  config/           -> feature flags e configuracoes reutilizaveis
  schemas/          -> contratos Zod compartilhados
  types/            -> tipos compartilhados
  access-control/   -> papeis, policies e request context
  workflows/        -> logica compartilhada de jobs e fluxos cross-runtime
```

## Conversa entre camadas

### `apps/web`

- Consome a API por `packages/api`
- Faz bootstrap de sessao com bearer + one-time-token
- Usa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para integracoes client-side com Supabase
- Nao deve depender de Redis, BullMQ ou Prisma em superficies client-side

### `apps/api`

- Reaproveita o runtime Elysia central
- Usa `packages/auth`, `packages/db`, `packages/cache` e `packages/workflows`
- Recebe webhooks e publica jobs nas filas

### `apps/worker`

- Escuta filas de email e webhook
- Usa `packages/cache` para BullMQ e `packages/db` para persistencia

### `apps/cron`

- Executa workflows agendados sem expor HTTP
- Hoje roda `week-reset`, mas a estrutura ja suporta novos jobs

## Regras de fronteira

- Componentes, hooks, stores e paginas client-side do `apps/web` nao devem importar:
  - `@gymrats/db`
  - `@prisma/client`
  - `@gymrats/cache`
  - `@gymrats/workflows`
  - `bullmq`
- Essa regra e verificada por `scripts/check-frontend-boundary.mjs`

## Validacoes operacionais

- `npm run verify:split`
  - valida a fronteira do frontend
  - gera bundles de `api`, `worker` e `cron`
- `npm run build`
  - valida o build atual do `apps/web`
- `npm run stack:migrate`
  - roda Prisma Migrate no banco do compose
  - usa `DIRECT_URL` quando disponivel e cai para `DATABASE_URL` nos ambientes simples
