# U0 Residual Closure - 2026-05-18

## Resumo executivo

Este fechamento conclui os U0 residuais `RES-001`, `RES-002`, `RES-003` e `RES-004` em `web+api`, mantendo `RES-021` sem alteracao por decisao de produto.

Itens fechados neste ciclo:
- `RES-001`: hardening de autorizacao cross-tenant na biblioteca de treinos.
- `RES-002`: fail-closed para integracoes de acesso sem `secretHash`.
- `RES-003`: bloqueio de cancelamento de cobranca pendente/atrasada por aluno.
- `RES-004`: remocao da oferta Pro do funil atual de assinatura do aluno.

## Escopo e decisao de produto

- `RES-021` mantido sem alteracao.
- Saque fake permanece conforme politica atual.
- Vínculo valido cross-tenant considerado apenas com status `active`.

## Correcoes por item

| ID | Causa raiz | Correcao aplicada | Arquivos principais |
|---|---|---|---|
| RES-001 | Operacoes da biblioteca aceitavam contexto de aluno e ownership com regras incompletas por papel, abrindo risco de IDOR cross-tenant. | Autorizacao centralizada por papel (`STUDENT`, `GYM`, `PERSONAL`) com exigencia de vinculos `active`, filtro de visibilidade para personal e erro de dominio padronizado. | `apps/api/src/lib/services/workouts/training-library-access.service.ts`, `apps/api/src/lib/api/handlers/training-library.handler.ts`, `apps/api/src/lib/services/workouts/training-library-access.service.test.ts` |
| RES-002 | Integracao de access-control aceitava `secretHash` ausente (comportamento permissivo). | `verifyAccessSecret` fail-closed, bloqueio explicito com `ACCESS_INTEGRATION_SECRET_NOT_CONFIGURED`, auditoria de bloqueio, e convergencia de schema/migration para `secretHash` obrigatorio. | `apps/api/src/lib/services/access/access.service.ts`, `packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/20260518163000_require_access_device_secret_hash/migration.sql`, `apps/web/scripts/migration/apply-access-device-secret-hash-hardening-migration.js`, `apps/api/src/lib/services/access/access.service.test.ts` |
| RES-003 | Aluno podia cancelar cobranca pendente/atrasada via PATCH (bypass de inadimplencia). | PATCH passa a retornar `409` + `PAYMENT_CANCEL_NOT_ALLOWED` sem mutacao; UI nao cancela cobranca ao fechar modal PIX. | `apps/api/src/routes/payments/[paymentId]/route.ts`, `apps/api/src/routes/payments/[paymentId]/route.test.ts`, `apps/web/stores/student/slices/financial-slice.ts`, `apps/web/app/student/_payments/hooks/use-payments-page.ts` |
| RES-004 | Oferta Pro seguia aparecendo no funil atual do aluno, divergente da decisao comercial vigente. | Funil student ajustado para premium-only, com normalizacao defensiva para metadados legados. | `apps/web/app/student/_payments/hooks/use-payments-page.ts`, `apps/web/components/organisms/sections/subscription-section.tsx`, `apps/web/stores/subscription-store.ts`, `apps/api/src/lib/api/handlers/subscriptions.handler.ts` |

## Impacto tecnico e de negocio

### Tecnico
- Remove bypass de autorizacao em biblioteca e endurece fronteiras multi-tenant.
- Elimina fallback permissivo em integracoes criticas de acesso fisico.
- Reduz risco de inconsistencias financeiras no fluxo de cobranca do aluno.
- Alinha camada web e backend ao funil comercial real (premium-only).

### Negocio
- Reduz risco de acesso indevido a dados/planos de treino.
- Reduz risco operacional de abertura indevida de catraca sem segredo configurado.
- Preserva mecanismo de cobranca para inadimplencia (sem cancelamento por fuga de modal).
- Evita oferta comercial inconsistente no checkout do aluno.

## Evidencias de validacao

### Unitarios e typecheck

```bash
npm run typecheck:web
npm run typecheck:api
npm run test:unit
```

Resultado:
- `typecheck:web`: OK
- `typecheck:api`: OK
- `test:unit`: 26 arquivos / 84 testes passando

### Build

```bash
npm run build
npm run build:api
```

Resultado:
- `build` (web): OK
- `build:api`: OK

### E2E API

```bash
npm run test:e2e:api
```

Resultado:
- 21 testes passando

### E2E Web (subset critico)

```bash
npm run test:e2e:web
```

Resultado:
- 6 testes passaram e 23 falharam.
- Falha predominante: navegacoes autenticadas redirecionadas para `/welcome` com `socket hang up`/`ECONNRESET` no proxy de sessao (`127.0.0.1:3001`), sem evidencia de regressao direta dos itens U0 alterados neste pacote.

## Risco de rollout

| ID | Risco | Nivel | Mitigacao |
|---|---|---|---|
| RR-U0-001 | Ambientes com registros legados de `access_devices.secretHash` nulo sem migration aplicada. | Alto | Aplicar migration Prisma + script operacional antes do deploy final. |
| RR-U0-002 | E2E web autenticado instavel por dependencia de sessao/proxy local. | Medio | Tratar estabilidade do ambiente E2E (sessao/proxy) em trilha separada antes do gate final de release web. |
| RR-U0-003 | Interpretacao de oferta Pro em materiais externos ainda nao atualizados. | Baixo | Sincronizar copy externa com funil premium-only atual. |

## Nota explicita de escopo

- `RES-021` mantido sem alteracao por decisao de produto.
- Este pacote nao removeu saque fake e nao alterou essa politica.