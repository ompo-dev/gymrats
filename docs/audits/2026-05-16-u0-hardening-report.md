# U0 Hardening Report - 2026-05-16

## Resumo Executivo

Este pacote fecha as U0 de seguranca/financeiro/backend sem remover o modo de saque simulado.

- Saque simulado mantido por decisao operacional, com controle apenas server-side
- Cron protegido em fail-closed
- Idempotencia fortalecida contra replay com payload/ator/rota diferentes
- Token de sessao migrado para geracao criptograficamente segura
- Cadeia Prisma com guard-rail para bloquear deploy inseguro

## Detalhamento por U0

| U0 | Causa raiz | Correcao aplicada | Impacto no negocio | Impacto tecnico | Arquivos principais |
|---|---|---|---|---|---|
| Sessao previsivel | Token com `Date.now()+Math.random()` | Token via CSPRNG (`randomBytes`) | Reduz risco de hijack por previsibilidade | Remove padrao temporal do token | `packages/domain/src/session.ts`, `packages/domain/src/session-token.ts` |
| Idempotencia fraca | Chave reaproveitava replay sem validar fingerprint | Fingerprint canonico (`route+method+actor+body`) e `409` em mismatch | Evita duplicidade indevida e replay cruzado | Regras de replay/processamento endurecidas | `apps/api/src/lib/api/utils/api-wrapper.ts`, `apps/api/src/lib/api/utils/idempotency-store.ts` |
| Cron permissivo | Autorizacao dependia da existencia de `CRON_SECRET` | `CRON_SECRET` obrigatorio + guard fail-closed | Evita execucao indevida de rotina critica | Bloqueio padrao em ausencia de segredo | `apps/api/src/lib/bootstrap/env-validation.ts`, `apps/api/src/app.ts`, `apps/api/src/routes/cron/week-reset/route.ts` |
| Saque fake client-driven | Cliente podia influenciar simulacao de saque | Removido do payload; modo controlado por `PAYOUT_EXECUTION_MODE` | Mantem operacao de teste sem brecha de abuso por cliente | Fluxo fake/real centralizado server-side + auditoria `simulation=true` | `apps/api/src/lib/payments/payout-execution.ts`, `apps/api/src/routes/gyms/withdraws/route.ts`, `apps/api/src/routes/students/referrals/withdraw/route.ts` |
| Webhook nao idempotente (aluno) | `subscriptionPayment.create` em retry de webhook | `upsert` por `abacatePayBillingId` | Evita duplicidade de registro em retry | Consistencia entre fluxos gym e student | `apps/api/src/lib/services/webhook.service.ts` |
| Drift Prisma | Cadeia legada inconsistente para deploy Prisma | Safety-check bloqueando deploy inseguro e orientando trilha A/B | Evita indisponibilidade por migration chain invalida | Guard-rail operacional explicito no wrapper Prisma | `apps/web/scripts/migration/prisma-migration-safety.mjs`, `apps/web/scripts/migration/apply-prisma-migrations.mjs`, `docs/05-devops/MIGRATIONS.md` |

## Evidencias de Teste

- Unitarios adicionados:
  - `packages/domain/src/session-token.test.ts`
  - `apps/api/src/lib/api/utils/idempotency-store.test.ts`
  - `apps/api/src/lib/payments/payout-execution.test.ts`
- Ajustes de validacao:
  - `apps/api/src/lib/bootstrap/env-validation.test.ts`
- E2E adicional:
  - `tests/e2e/api/cron-auth.spec.ts`

## Risco Residual e Rollout

- Enquanto `PAYOUT_EXECUTION_MODE=fake`, payout permanece simulado por decisao de negocio.
- Para go-live financeiro real, trocar para `PAYOUT_EXECUTION_MODE=real` e reexecutar suite financeira/E2E antes do corte.
