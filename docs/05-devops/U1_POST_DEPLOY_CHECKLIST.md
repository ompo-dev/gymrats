# U1 Post-Deploy Checklist And Rollback

## Objetivo

Checklist operacional para validar o pacote U1 apos deploy e executar rollback seguro se algum gate critico falhar.

## Pre-condicoes

- Deploy de `api`, `worker` e `cron` concluido no Railway.
- Variaveis obrigatorias configuradas (`CRON_SECRET`, `NODE_ENV`, `PAYOUT_EXECUTION_MODE`, segredos de auth/pagamento).
- Frontend Vercel apontando para a API esperada (`API_PROXY_TARGET` e `API_INTERNAL_URL`).

## Checklist de validacao pos-deploy

### 1) Health e readiness

1. `GET /health` deve retornar `200` e `{ "status": "ok" }`.
2. `GET /healthz` deve retornar `200` e `{ "status": "ok" }`.
3. `GET /readyz` deve retornar:
   - `200` com `status=ready`, ou
   - `503` com `status=not_ready` + detalhe da dependencia degradada.
4. Se `readyz=503`, bloquear liberacao e tratar dependencia antes de continuar.

### 2) Cron seguro

1. `GET /api/cron/week-reset` sem header deve retornar `401`.
2. `GET /api/cron/week-reset` com `Authorization: Bearer <CRON_SECRET>` deve executar sem `401`.
3. Confirmar ausencia de fallback permissivo em logs.

### 3) Idempotencia

1. Repetir a mesma mutacao com mesmo `x-idempotency-key` e mesmo payload:
   - resposta de replay esperada (`X-Idempotency-Replay: true`).
2. Repetir com a mesma chave e payload diferente:
   - resposta esperada `409`.

### 4) Payout mode (fase atual)

1. Validar `PAYOUT_EXECUTION_MODE=fake` no ambiente ativo.
2. Executar um saque de gym e um saque de referral/student.
3. Confirmar que:
   - fluxo conclui como simulacao;
   - evento de auditoria contem `simulation=true`.
4. Confirmar que o cliente nao depende de controle local para fake/real.

### 5) Fluxos U1 de acesso e financeiro

1. Usuario com multiplas gyms sem `activeGymId` deve receber `409` para contexto ambigiuo.
2. Usuario com `activeGymId` invalida deve receber `403`.
3. `requireGym` deve negar usuario sem role `GYM`/`ADMIN`.
4. Consulta de job por nao-owner deve negar acesso.
5. Fluxo de join/subscribe com cupom em corrida deve retornar `409` para tentativa perdedora, sem consumo extra.
6. Falha de criacao PIX em join/subscribe deve deixar registro financeiro coerente (cancelamento + rollback de cupom quando aplicavel).

## Evidencia minima a arquivar

- Timestamp da versao implantada.
- Captura de resposta de `/health`, `/healthz`, `/readyz`.
- Captura de `401` do cron sem segredo.
- Captura de replay de idempotencia e de `409` por fingerprint divergente.
- Captura de auditoria de saque simulado com `simulation=true`.

## Gates de aceite

- Gate A (obrigatorio): health/readiness OK sem dependencia critica fora.
- Gate B (obrigatorio): cron fail-closed confirmado.
- Gate C (obrigatorio): idempotencia sem bypass reproduzivel.
- Gate D (obrigatorio): saque fake operando somente por controle server-side.
- Gate E (obrigatorio): sem regressao de auth-context multi-gym.

Se qualquer gate obrigatorio falhar, nao promover rollout.

## Plano de rollback

### Disparadores de rollback

- `readyz` degradado persistente apos janela de estabilizacao.
- Erro sistemico em auth-context (403/409 anormal em massa).
- Erro financeiro em saque/cupom com risco de saldo inconsistente.
- Falha de idempotencia com duplicidade de operacao.

### Passos de rollback

1. Congelar novas mutacoes financeiras (pausar campanhas de teste e fluxos de saque).
2. Reverter deployment do servico afetado para a release anterior estavel no Railway.
3. Se necessario, restaurar variaveis para baseline anterior (`PAYOUT_EXECUTION_MODE=fake` deve permanecer neste ciclo).
4. Reexecutar checklist minimo:
   - `/health`, `/healthz`, `/readyz`
   - cron sem segredo (`401`)
   - um fluxo de mutacao com idempotencia
5. Publicar incidente interno com:
   - causa provavel,
   - impacto observado,
   - janela de rollback,
   - plano de hotfix.

## Observacao

Este runbook assume fase operacional de testes financeiros. Go-live de payout real exige janela dedicada e troca controlada para `PAYOUT_EXECUTION_MODE=real` com nova rodada completa de validacao.
