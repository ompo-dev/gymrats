# U1 Residual Re-Hardening Report (2026-05-18)

## Escopo

Fechamento de U1 em modo residual/regressao para web+api, com foco em:

- U1-AC-01: bloquear bypass por heranca de contexto inativo (fail-closed).
- U1-AC-02..05: reforco de cobertura para invariantes de access-control.
- U1-PAY-01..05: reforco de cobertura para corrida de cupom, rollback PIX e consistencia financeira.
- U1-OPS-01: consolidacao de checklist operacional para regressao AC-01.

## Decisoes aplicadas

- Heranca de contexto so vale quando `env.isSubscriptionActive === true`.
- `x-gym-context-plan` e `x-personal-context-plan` nao participam mais de autorizacao (headers deprecados/ignorados).
- Resolucao de plano/status em contexto herdado e feita apenas com dados server-side da sessao.
- `RES-021` permanece sem alteracao por decisao do produto.

## Mudancas implementadas

### 1) Access-control (AC-01)

- Contrato de contexto de ambiente endurecido com `isSubscriptionActive`:
  - `packages/access-control/src/types.ts`
- `checkAbility` fail-closed para heranca inativa:
  - `packages/access-control/src/core.ts`
- Builder de contexto (api/web) sem confianca em header de plano, com resolucao server-side de plano/status:
  - `apps/api/src/lib/access-control/server.ts`
  - `apps/web/lib/access-control/server.ts`

### 2) Sessao server-side para contexto personal

Para evitar perda de heranca valida de contexto `PERSONAL`, a sessao passou a carregar metadados de assinatura do personal:

- `packages/domain/src/session.ts`
- `apps/api/src/lib/auth/session-resolver.ts`
- `apps/web/lib/context/auth-context-factory.ts`
- tipagem de resposta de sessao web atualizada:
  - `apps/web/lib/api/auth.ts`

### 3) Regressao tests U1 (AC + PAY)

Novos testes adicionados:

- Access-control:
  - `apps/api/src/lib/access-control/core.test.ts`
  - `apps/api/src/lib/access-control/server.test.ts`
  - `apps/web/lib/access-control/server.test.ts`
- Financeiro U1:
  - `apps/api/src/routes/students/gyms/[gymId]/join/route.test.ts`
  - `apps/api/src/routes/students/personals/[personalId]/subscribe/route.test.ts`
  - `apps/api/src/lib/services/gym/gym-financial.service.test.ts`
  - `packages/domain/src/services/referral.service.test.ts`
  - `apps/api/src/lib/services/personal/personal-financial.service.test.ts`

### 4) Operacao/Runbooks U1

- Checklist de pos-deploy com cenario AC-01 fail-closed e trigger de rollback:
  - `docs/05-devops/U1_POST_DEPLOY_CHECKLIST.md`
- Runbook consolidado com trilha de entitlement e historico residual U1:
  - `docs/05-devops/VERCEL_RAILWAY_SPLIT_RUNBOOK.md`
- Dossie U1 base atualizado com status residual fechado:
  - `docs/audits/2026-05-16-u1-hardening-report.md`

## Evidencias de validacao por execucao

Comandos executados com sucesso apos as mudancas:

1. `npm run typecheck:full`
2. `npm run build`
3. `npm run build:api`
4. `npm run test:unit`
5. `npm run test:e2e:api`
6. `npx playwright test tests/e2e/web/auth-callback.spec.ts tests/e2e/web/auth-login-redirect.spec.ts --project=chromium`

Resultados principais:

- Unit: `34 files / 101 tests` pass.
- E2E API: `21 tests` pass.
- Web auth smoke: `2 tests` pass.

## Impacto tecnico e de negocio

- Elimina bypass de entitlement premium por heranca com assinatura inativa (risco direto de acesso indevido).
- Reduz superficie de spoofing por header de plano em contexto herdado.
- Aumenta robustez contra regressao em fluxos financeiros sensiveis (cupom, PIX, saque, resumo/listagem).
- Melhora governanca de rollout com criterio operacional explicito para AC-01.

## Risco de rollout

- Baixo a medio.
- Principal atencao: clientes que ainda enviem `x-*-context-plan` nao quebram, mas o header agora e ignorado.
- Dependencia operacional: sessao precisa manter payload de `personal.subscription` para heranca personal valida.
