# Idempotency Policy

## Escopo

Aplica-se a requests mutaveis (`POST`, `PATCH`, `DELETE`) que enviam `x-idempotency-key`.

## Regra de fingerprint

Cada chave idempotente e vinculada ao fingerprint canonico:

- `route`
- `method`
- `actorId` autenticado
- `body` normalizado (ordem de chaves canonica)

## Comportamento esperado

- Mesmo fingerprint + mesma chave:
  - `processing` -> `409` em processamento
  - `completed` -> replay de resposta com `X-Idempotency-Replay: true`
- Fingerprint diferente para a mesma chave:
  - `409` com erro de conflito de idempotencia

## Objetivo

Evitar:

- replay cross-route
- replay cross-user
- replay com payload divergente usando a mesma chave
