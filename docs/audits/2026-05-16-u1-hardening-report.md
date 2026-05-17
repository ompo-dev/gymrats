# U1 Hardening Report - 2026-05-16

## Resumo executivo

Este dossie consolida as correcoes U1 implementadas no backend, access-control e financeiro, com foco em:

- fail-closed de autorizacao e contexto de tenant;
- robustez transacional em fluxos financeiros de saque e cupom;
- readiness operacional para deploy (health/readiness/cron/idempotencia/payout mode).

Tambem registra riscos residuais detectados na revisao code-first para evitar rollout com falsa sensacao de concluido.

## U1 implementadas (com evidencia)

| ID | Causa raiz | Correcao implementada | Impacto tecnico | Impacto de negocio | Risco de rollout | Evidencia (arquivo:linha) | Evidencia de teste |
|---|---|---|---|---|---|---|---|
| U1-AC-01 | Entitlement de plano podia abrir feature sem assinatura ativa em cenarios pagos. | `hasDirectAbility` passou a exigir `activePlan`, policy explicita e `isSubscriptionActive` para plano pago (FREE como excecao declarada). | Reduz bypass por estado parcial de assinatura. | Evita acesso indevido a features premium. | Pode bloquear usuarios com dados de plano inconsistentes; exige saneamento de sessao/perfil. | `packages/access-control/src/core.ts:18`, `packages/access-control/src/core.ts:33`, `apps/api/src/lib/access-control/server.ts:146`, `apps/web/lib/access-control/server.ts:146` | Validacao por revisao de codigo (code-only). |
| U1-AC-02 | Resolucao de contexto de gym era ambigua para usuario com multiplas academias. | `resolveGymContext` valida `activeGymId` contra `user.gyms`, faz fallback apenas com 1 gym e retorna `409` quando falta contexto em multi-gym. | Fecha ambiguidade de tenant e evita escrita/leitura no owner errado. | Reduz risco de operacao financeira/dados na academia incorreta. | Pode exigir ajuste de UX para selecionar gym ativa antes de acao protegida. | `packages/domain/src/auth-context.ts:127`, `packages/domain/src/auth-context.ts:135`, `packages/domain/src/auth-context.ts:143` | `packages/domain/src/auth-context.test.ts:71`, `packages/domain/src/auth-context.test.ts:83`, `packages/domain/src/auth-context.test.ts:101` |
| U1-AC-03 | Middleware `requireGym` podia depender apenas de presenca de dados de gym sem role canonica. | `requireGym` passou a exigir role `GYM` (ou `ADMIN`) e, para nao-admin, lista de gyms nao vazia. | Endurece fronteira de autorizacao no middleware HTTP. | Reduz risco de escalacao horizontal em rotas de academia. | Pode revelar usuarios com role incorreta no banco que antes "passavam". | `apps/api/src/lib/api/middleware/auth.middleware.ts:187`, `apps/api/src/lib/api/middleware/auth.middleware.ts:190`, `apps/api/src/lib/api/middleware/auth.middleware.ts:200` | Validacao por revisao de codigo (code-only). |
| U1-AC-04 | Consulta de jobs por ID sem ownership estrito poderia expor dados de processamento. | Rota de job valida owner (`ownerUserId`) ou estudante relacionado (`studentId`). | Restringe leitura de job a dono legitimo (ou admin). | Evita vazamento de resultado/erro de jobs entre usuarios. | Jobs antigos sem `ownerUserId` podem exigir fallback controlado. | `apps/api/src/routes/jobs/[id]/route.ts:10`, `apps/api/src/routes/jobs/[id]/route.ts:34`, `apps/api/src/routes/jobs/[id]/route.ts:39` | Validacao por revisao de codigo (code-only). |
| U1-AC-05 | Patch de instalacao mobile podia permitir transferencia de ownership por update. | Fluxo de update manteve escopo apenas em campos de device/token; sem mutar `userId`. | Fecha risco de takeover de endpoint mobile. | Protege canal de push/notificacao por usuario. | Baixo; mudanca compativel com contrato esperado de PATCH de instalacao. | `apps/api/src/routes/mobile/installations/[installationId]/route.ts:74`, `apps/api/src/routes/mobile/installations/[installationId]/route.ts:110`, `apps/api/src/routes/mobile/installations/[installationId]/route.ts:114` | Validacao por revisao de codigo (code-only). |
| U1-PAY-01 | Consumo de cupom no join de gym tinha janela de corrida (read-then-write). | Consumo passou para `updateMany` condicional + `409` quando corrida vence; rollback de uso em falha de PIX; cancelamento de membership pendente em erro. | Garante atomicidade funcional no contador de cupom e evita membership pendurada sem cobranca. | Evita over-redemption e distorcao de receita/desconto. | Medio: alta concorrencia exige monitorar taxa de `409` esperada. | `apps/api/src/routes/students/gyms/[gymId]/join/route.ts:85`, `apps/api/src/routes/students/gyms/[gymId]/join/route.ts:99`, `apps/api/src/routes/students/gyms/[gymId]/join/route.ts:157`, `apps/api/src/routes/students/gyms/[gymId]/join/route.ts:163` | Validacao por revisao de codigo (code-only). |
| U1-PAY-02 | Assinatura de personal tinha o mesmo risco de corrida/rollback em cupom e PIX. | Mesmo padrao de consumo atomico + rollback de cupom e cancelamento do payment em erro de PIX. | Mantem consistencia de contadores e estado de pagamento em retry/falha externa. | Evita perda de confianca em cobranca de plano personal. | Medio: depende de observabilidade de erro 503 no PSP. | `apps/api/src/routes/students/personals/[personalId]/subscribe/route.ts:107`, `apps/api/src/routes/students/personals/[personalId]/subscribe/route.ts:120`, `apps/api/src/routes/students/personals/[personalId]/subscribe/route.ts:193`, `apps/api/src/routes/students/personals/[personalId]/subscribe/route.ts:198` | Validacao por revisao de codigo (code-only). |
| U1-PAY-03 | Saque de gym podia sofrer corrida de saldo entre leitura e criacao. | `createWithdraw` passou a reservar em transacao com lock (`FOR UPDATE`), recalcular saldo no lock, criar withdraw antes de chamar PSP e marcar `failed` em erro externo. | Reduz race condition e dupla reserva de saldo. | Mitiga risco financeiro direto (saque acima do disponivel). | Medio: lock em alta concorrencia pode aumentar latencia pontual. | `apps/api/src/lib/services/gym/gym-financial.service.ts:437`, `apps/api/src/lib/services/gym/gym-financial.service.ts:451`, `apps/api/src/lib/services/gym/gym-financial.service.ts:484`, `apps/api/src/lib/services/gym/gym-financial.service.ts:539` | Validacao por revisao de codigo (code-only). |
| U1-PAY-04 | Saque de referral do aluno tinha mesma fragilidade de saldo concorrente. | Reserva transacional com lock no aluno + recalculo de saldo + status `failed` em erro do PSP. | Evita gasto duplo do saldo de comissao por concorrencia. | Protege saldo de referral e previne contestacao de saque. | Medio: depende de cobertura de testes de concorrencia em ciclo futuro. | `packages/domain/src/services/referral.service.ts:233`, `packages/domain/src/services/referral.service.ts:244`, `packages/domain/src/services/referral.service.ts:272`, `packages/domain/src/services/referral.service.ts:324` | Validacao por revisao de codigo (code-only). |
| U1-PAY-05 | Financeiro do personal tinha leitura incompleta (resumos/listas sem refletir pagamentos reais). | Summary e listagem passaram a usar `personalStudentPayment` (paid/pending) com agregacao e joins de aluno/plano. | Melhora consistencia de dashboard financeiro do personal. | Melhora decisao de negocio e confianca nos numeros da plataforma. | Baixo a medio: exige observar impacto de cache curto apos deploy. | `apps/api/src/lib/services/personal/personal-financial.service.ts:60`, `apps/api/src/lib/services/personal/personal-financial.service.ts:70`, `apps/api/src/lib/services/personal/personal-financial.service.ts:168`, `apps/api/src/lib/services/personal/personal-financial.service.ts:185` | Validacao por revisao de codigo (code-only). |
| U1-OPS-01 | Operacao tinha necessidade de sinal de readiness por dependencia (DB/Redis). | Endpoint `/readyz` implementado com checagem ativa de banco e Redis, retornando `200` ou `503`. | Melhora decisao de roteamento/orquestracao (liveness vs readiness). | Reduz indisponibilidade percebida em rollout parcial de dependencia. | Baixo: exige monitoramento de latencia para evitar falso negativo em picos. | `apps/api/src/server/app.ts:83`, `apps/api/src/server/app.ts:90`, `apps/api/src/server/app.ts:93`, `apps/api/src/server/app.ts:101` | `tests/e2e/api/health.spec.ts:7`, `tests/e2e/api/health.spec.ts:18`, `tests/e2e/api/health.spec.ts:42` |

## Riscos residuais observados

| ID | Risco residual | Impacto | Evidencia (arquivo:linha) | Acao recomendada |
|---|---|---|---|---|
| RR-U1-01 | Cliente web de gym ainda envia `fake` no body de saque, enquanto API de saque usa schema `strict` sem esse campo. | Pode gerar `400` em saque no frontend de gym apos hardening server-side. | `apps/web/stores/gym-unified-store.ts:1520`, `apps/web/stores/gym-unified-store.ts:1564`, `apps/web/components/organisms/gym/financial/financial-overview-tab.tsx:100`, `apps/api/src/routes/gyms/withdraws/route.ts:8`, `apps/api/src/routes/gyms/withdraws/route.ts:13` | Remover `fake` dos clients/actions web e tratar simulacao apenas server-side via `PAYOUT_EXECUTION_MODE`. |
| RR-U1-02 | Smoke test de runtime usa caminho default antigo de workspace. | Pode quebrar validacao local/CI em ambientes fora do path legado. | `tests/e2e/runtimes/runtime-smoke.spec.ts:4`, `tests/e2e/runtimes/runtime-smoke.spec.ts:6` | Atualizar default para raiz atual do repo ou exigir env obrigatoria no job. |

## Evidencias operacionais (cron, idempotencia, payout mode)

- Cron fail-closed e segredo obrigatorio:
  - `apps/api/src/lib/bootstrap/env-validation.ts:11`
  - `apps/api/src/lib/bootstrap/env-validation.ts:19`
  - `apps/api/src/app.ts:115`
  - `apps/api/src/app.ts:119`
  - `tests/e2e/api/health.spec.ts:75`
  - `apps/api/src/lib/bootstrap/env-validation.test.ts:14`
- Idempotencia com fingerprint e conflito `409`:
  - `apps/api/src/lib/api/utils/idempotency-store.ts:59`
  - `apps/api/src/lib/api/utils/idempotency-store.ts:65`
  - `apps/api/src/lib/api/utils/api-wrapper.ts:385`
  - `apps/api/src/lib/api/utils/api-wrapper.ts:396`
  - `apps/api/src/lib/api/utils/api-wrapper.ts:403`
  - `apps/api/src/lib/api/utils/idempotency-store.test.ts:5`
- Payout fake/real server-side:
  - `apps/api/src/lib/payments/payout-execution.ts:5`
  - `apps/api/src/lib/payments/payout-execution.ts:15`
  - `apps/api/src/routes/gyms/withdraws/route.ts:29`
  - `apps/api/src/routes/students/referrals/withdraw/route.ts:19`
  - `apps/api/src/lib/payments/payout-execution.test.ts:18`

## Conclusao

O pacote U1 elevou o nivel de seguranca de autorizacao e consistencia financeira em pontos centrais, com readiness operacional mais claro para deploy.

Para fechamento operacional completo, os riscos residuais `RR-U1-01` e `RR-U1-02` devem entrar na proxima janela de correcao antes do go-live financeiro real.
