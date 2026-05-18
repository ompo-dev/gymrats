# U3 Hardening Report - 2026-05-18

## Resumo executivo

Este ciclo fechou os itens U3 de menor urgencia com foco em consistencia de engenharia e reducao de ruido operacional, sem alterar regra de negocio.

Decisao tecnica aplicada:
- manter o padrao atual de service classes estaticas (ja amplamente usado no monorepo) e registrar isso na configuracao de lint, em vez de refactor estrutural amplo neste ciclo.

## U3 implementadas

| ID | Causa raiz | Correcao aplicada | Impacto tecnico | Impacto negocio | Evidencia (arquivo:linha) |
|---|---|---|---|---|---|
| U3-ENG-01 | `noStaticOnlyClass` gerava backlog recorrente em `packages/domain/src/services` apesar do padrao arquitetural ja consolidado em `apps/api` e `apps/web`. | Override do Biome estendido para `packages/domain/src/services/**/*.ts`, alinhando a politica de lint ao padrao real da plataforma. | Reduz ruido recorrente de lint e evita suppressions locais dispersas. | Menor friccao de manutencao e PRs mais limpos. | `biome.json:49` |
| U3-OPS-01 | Residual RR-U1-01 (payload `fake` no saque web) ainda constava como risco no relatorio U1. | Revalidacao code-first confirmou fluxo cliente sem `fake` e simulacao somente server-side. | Contrato cliente/API consistente no saque. | Reduz risco de erro 400 no fluxo financeiro gym. | `apps/web/stores/gym-unified-store.ts:1564`, `apps/web/components/organisms/gym/financial/financial-overview-tab.tsx:95`, `apps/api/src/routes/gyms/withdraws/route.ts:13`, `apps/api/src/routes/gyms/withdraws/route.ts:29` |
| U3-OPS-02 | Residual RR-U1-02 (workspace hardcoded no smoke de runtime) constava aberto no relatorio U1. | Revalidacao code-first confirmou fallback portavel `PLAYWRIGHT_WORKSPACE_ROOT || process.cwd()`. | Smoke runtime desacoplado de path local legado. | Menor chance de falso negativo em CI/local. | `tests/e2e/runtimes/runtime-smoke.spec.ts:4`, `tests/e2e/runtimes/runtime-smoke.spec.ts:19` |

## Residuais que permanecem (monitorados)

| ID | Status | Observacao | Evidencia |
|---|---|---|---|
| RR-U2-01 | Aberto com mitigacao operacional | `track=auto` pode ficar indeterminado sem estado DB; gate estrito depende de `--track=A|B` e/ou `--fail-on-indeterminate=true`. | `apps/web/scripts/migration/prisma-migration-safety.mjs:230`, `apps/web/scripts/migration/apply-prisma-migrations.mjs:20`, `.github/workflows/security.yml:34` |
| RR-U2-02 | Aberto com mitigacao operacional | `KNOWN_DEPENDENCIES` segue manual (com preflight e ordenacao topologica), exigindo disciplina de manutencao. | `apps/web/scripts/migration/run-stack-migrations.mjs:20`, `apps/web/scripts/migration/run-stack-migrations.mjs:77`, `apps/web/scripts/migration/run-stack-migrations.mjs:287` |

## Validacao executada neste ciclo

| Bloco | Comando | Resultado |
|---|---|---|
| Lint (arquivos alterados) | `npm run lint:changed` | Sucesso |
| Typecheck full | `npm run typecheck:full` | Sucesso (`web`, `api`, `worker`, `cron`) |
| Testes unitarios | `npm run test:unit` | Sucesso (`23` arquivos, `74` testes) |

## Conclusao

As U3 deste ciclo foram fechadas no escopo acordado: hardening de padrao de lint para services de dominio e fechamento factual dos residuais U1 ja corrigidos em codigo.

Nao houve mudanca funcional de produto/financeiro neste pacote; impacto principal foi de governanca tecnica e estabilidade de manutencao.