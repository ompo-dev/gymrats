# API Completa - GymRats (Elysia)

## Visao geral

Esta documentacao reflete a arquitetura atual baseada em Elysia.
A fonte de verdade da montagem de rotas esta em `server/app.ts`.

- Prefixo global: `/api`
- Health check: `GET /health`
- Auth por macros/plugins:
  - `authMacro` para autenticacao basica
  - `authRolesMacro` para regras por role (`requireStudent`, `requireGym`, `requireAdmin`)

## Grupos de rotas

Montagem declarada em `server/app.ts`:

- `/api/auth`
- `/api/users`
- `/api/students`
- `/api/gyms`
- `/api/workouts`
- `/api/nutrition`
- `/api/foods`
- `/api/exercises`
- `/api/subscriptions`
- `/api/gym-subscriptions`
- `/api/payments`
- `/api/payment-methods`
- `/api/memberships`

## Endpoints por dominio

## Auth (`/api/auth`)

- `POST /sign-in`
- `POST /sign-up`
- `GET /session`
- `POST /sign-out`
- `POST /update-role`
- `POST /forgot-password`
- `POST /verify-reset-code`
- `POST /reset-password`

## Users (`/api/users`)

- `POST /update-role` (auth obrigatoria)

## Students (`/api/students`)

- `GET /all`
- `GET /profile`
- `POST /profile`
- `GET /weight`
- `POST /weight`
- `GET /weight-history`
- `GET /progress`
- `PUT /progress`
- `GET /student`
- `GET /personal-records`
- `GET /day-passes`
- `GET /friends`

## Gyms (`/api/gyms`)

- `GET /list`
- `POST /create`
- `GET /profile`
- `POST /set-active`
- `GET /locations`

## Workouts (`/api/workouts`)

- `GET /units`
- `POST /units`
- `PUT /units/:id`
- `DELETE /units/:id`
- `POST /manage`
- `PUT /manage/:id`
- `DELETE /manage/:id`
- `POST /exercises`
- `PUT /exercises/:id`
- `DELETE /exercises/:id`
- `POST /generate`
- `PATCH /generate`
- `POST /process`
- `POST /chat`
- `POST /chat-stream`
- `POST /populate-educational-data`
- `GET /history`
- `POST /:id/complete`
- `POST /:id/progress`
- `GET /:id/progress`
- `DELETE /:id/progress`
- `PUT /:id/progress/exercises/:exerciseId`
- `PATCH /:id/progress/exercises/:exerciseId`
- `PUT /history/:historyId/exercises/:exerciseId`
- `PATCH /history/:historyId/exercises/:exerciseId`

## Nutrition (`/api/nutrition`)

- `GET /daily`
- `POST /daily`
- `POST /chat`

## Foods (`/api/foods`)

- `GET /search`
- `GET /:id`
- `POST /upload` (admin)

## Exercises (`/api/exercises`)

- `GET /search`

## Subscriptions (`/api/subscriptions`)

- `GET /current`
- `POST /create`
- `POST /start-trial`
- `POST /cancel`
- `POST /activate-premium`

## Gym Subscriptions (`/api/gym-subscriptions`)

- `GET /current`
- `POST /create`
- `POST /start-trial`
- `POST /cancel`

## Payments (`/api/payments`)

- `GET /`

## Payment Methods (`/api/payment-methods`)

- `GET /`
- `POST /`

## Memberships (`/api/memberships`)

- `GET /`

## Swagger/OpenAPI

O plugin Swagger esta habilitado em `server/app.ts`.
Como o endpoint pode variar por ambiente de runtime e servidor customizado,
valide em execucao local pelos acessos de documentacao expostos no boot.

## Notas de manutencao

- Evite documentar handlers legado `lib/api/handlers/*.handler.ts` como fonte primaria.
- Para novas rotas, atualize primeiro `server/routes/*.ts` e depois este arquivo.
- Sempre priorize as macros de auth em vez de validacao ad-hoc por endpoint.
