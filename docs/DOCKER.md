# Docker - GymRats

Este projeto usa Next.js + Elysia com Bun. O container roda o servidor
customizado em `server/custom-server.ts` e injeta o backend na rota `/api`.

## Pré-requisitos

- Docker Desktop rodando
- `.env` configurado (mesmas variáveis usadas localmente)

Variáveis mínimas para build e runtime:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `PORT` (default 3000)
- `HOST` (default 0.0.0.0 no Docker)

## Produção local (Docker Compose)

```bash
docker compose up -d --build
```

Serviços:
- `app`: Next.js + Elysia
- `db`: PostgreSQL local (somente para rodar localmente)

## Desenvolvimento (Docker Compose)

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Build explícito do container

```bash
docker build -t gymrats-app:local .
```

## Logs e status

```bash
docker compose ps
docker compose logs -f app
```

## Desenvolvimento (Docker Compose)

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Healthcheck

```
GET /health
```

## Observações

- Se o build falhar por variáveis ausentes, revise o `.env` antes de buildar.
- Para usar banco externo (ex.: Supabase/Neon), remova o serviço `db`
  e configure `DATABASE_URL` no serviço `app`.
- Em produção real, use secrets/variáveis do seu orchestrator.
