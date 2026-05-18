# U2 Hardening Report - 2026-05-17

## Resumo executivo

Este dossie consolida o fechamento U2 em quatro frentes: Backend/API, Frontend/UX, Dados/Migracoes e Infra/CI. O foco foi reduzir erros 500 indevidos, endurecer regras de negocio em pagamentos, melhorar resiliencia de fluxos de onboarding/pagamento no cliente e tornar migracoes/CI mais deterministicas.

Diretrizes preservadas:
- sem reescrever migrations historicas ja aplicadas;
- sem alterar decisao de produto sobre saque fake (fora deste ciclo U2);
- sem mudar contratos publicos alem do combinado para U2.

## Itens U2 fechados

| ID | Dominio | Problema U2 | Correcao implementada | Arquivos principais | Impacto |
|---|---|---|---|---|---|
| U2-BE-01 | Backend/API | Erros de dominio podiam virar 500 generico em handlers. | `createSafeHandler` passou a reconhecer `DomainError` e responder com status/code/details corretos (4xx/5xx precisos). | `apps/api/src/lib/api/utils/api-wrapper.ts`, `packages/domain/src/domain-error.ts`, `packages/domain/src/index.ts` | Menos falso 500 e melhor observabilidade/telemetria de causa raiz. |
| U2-BE-02 | Backend/API | PATCH de pagamento gym permitia caminho ambiguo para `paid`. | Bloqueio explicito de `status=paid` no PATCH com erro de contrato; liquidacao segue no endpoint `settle`. | `apps/api/src/routes/gyms/payments/[paymentId]/route.ts`, `apps/api/src/routes/gyms/payments/[paymentId]/route.test.ts` | Evita bypass de fluxo financeiro e reduz inconsistencias de estado. |
| U2-BE-03 | Backend/Regra de negocio | Criacao manual de cobranca podia aceitar vinculos relacionais inconsistentes. | Validacoes fortes de `gymId` x `student` x `plan` x `membership`, com erros tipados (404/409) antes de persistir. | `packages/domain/src/services/gym/gym-domain.service.ts` | Evita cobranca em tenant/entidade incorreta e regressao de integridade. |
| U2-BE-04 | Backend/API/Observabilidade | `pay-now` nao diferenciava claramente erro de dominio vs erro de infra/provedor. | Fluxo registra evento de falha com classificacao (`domain` vs `infra_or_provider`) e retorna erro tipado consistente. | `apps/api/src/routes/students/payments/[paymentId]/pay-now/route.ts`, `packages/domain/src/domain-error.ts` | Melhor diagnostico operacional e contrato de erro mais confiavel para frontend. |
| U2-BE-05 | Integracoes/Access-control | Webhooks de access-control tinham mapeamento de erro menos padronizado. | Rotas migradas para `createSafeHandler` + schemas; servico de access passou a lancar `DomainError` nos casos de negocio. | `apps/api/src/routes/integrations/access-authorizations/[ingestionKey]/route.ts`, `apps/api/src/routes/integrations/access-events/[ingestionKey]/route.ts`, `apps/api/src/routes/integrations/access-heartbeats/[ingestionKey]/route.ts`, `apps/api/src/lib/services/access/access.service.ts`, `packages/schemas/src/access.schemas.ts` | Contrato de erro coerente, menos ambiguidade de 400/500 e melhor rastreabilidade. |
| U2-FE-01 | Frontend/UX | Onboarding de student/gym podia falhar sem feedback claro ao usuario. | Introduzido estado `submitError` + `toast` padrao + mensagens contextuais visiveis na tela. | `apps/web/app/student/onboarding/page.tsx`, `apps/web/app/gym/onboarding/page.tsx` | Reduz abandono por erro silencioso e melhora conclusao de onboarding. |
| U2-FE-02 | Frontend/UX | Regra de equipamentos no onboarding gym estava desalinhada com opcionalidade do backend. | UI explicita equipamentos como opcionais (sem bloquear avancar/concluir). | `apps/web/app/gym/onboarding/steps/step4.tsx` | Coerencia de regra de negocio ponta a ponta. |
| U2-FE-03 | Frontend/Pagamentos | Risco de multiplos cliques em "Pagar agora" e requisicoes duplicadas por item. | Controle de pending por `paymentId` + reutilizacao da promise em voo + botao desabilitado por item. | `apps/web/hooks/use-payment-flow.ts`, `apps/web/app/student/_payments/components/payment-card.tsx`, `apps/web/components/screens/student/student-payments.screen.tsx`, `apps/web/app/student/_payments/student-payments-page.tsx`, `apps/web/app/student/_payments/hooks/use-payments-page.ts` | Menos duplicidade de acao, UX mais previsivel e menor ruido no backend. |
| U2-FE-04 | Frontend/UX/Financeiro | Referral e financeiro personal mascaravam falha como estado vazio/zero em alguns cenarios. | Estados explicitos de loading/error e parser dedicado de erros por secao para financeiro personal. | `apps/web/app/student/_payments/components/student-referral-tab.tsx`, `apps/web/lib/utils/personal-financial-errors.ts`, `apps/web/lib/utils/personal-financial-errors.test.ts`, `apps/web/components/screens/personal/personal-financial.screen.tsx`, `apps/web/app/personal/_financial/page-content.tsx`, `apps/web/app/personal/page-content.tsx` | Transparencia de erro para usuario e suporte mais rapido a incidentes. |
| U2-FE-05 | Frontend/A11y | Cards de selecao de perfil com suporte limitado a teclado. | Adicionados handlers de teclado e `tabIndex` para selecao acessivel. | `apps/web/app/auth/register/user-type/page.tsx` | Melhora acessibilidade basica e navegacao sem mouse. |
| U2-INF-01 | Infra/CI | Pipeline de seguranca nao era totalmente deterministico no modelo hibrido atual. | Workflow alinhado a `npm ci`/lockfile atual e gates operacionais revisados. | `.github/workflows/security.yml`, `package.json` | Maior reproducibilidade entre dev/CI e menor drift de ferramenta. |
| U2-INF-02 | DevEx | Hook `commit-msg` quebrado por caminho invalido. | Hook corrigido para caminho real do script. | `.husky/commit-msg` | Evita falha local antes da validacao de mensagem de commit. |
| U2-DATA-01 | Dados/Migracoes | Runner de migrations dependia de ordem alfabetica, com risco de cadeia invalida. | Preflight de dependencias + ordenacao topologica + auto-include de dependencias conhecidas. | `apps/web/scripts/migration/run-stack-migrations.mjs` | Reduz risco de execucao fora da ordem semantica. |
| U2-DATA-02 | Dados/Migracoes | Remocao de unicidade em multi-gyms nao cobria bem cenario por indice. | Ajuste para `DROP INDEX IF EXISTS` com checagem segura em `pg_indexes`. | `apps/web/scripts/migration/apply-multi-gyms-migration.js` | Menor chance de falha operacional na convergencia de schema legado. |
| U2-DATA-03 | Dados/Migracoes/Operacao | Safety-check Prisma precisava suportar trilhas A/B com modo advisory controlado. | Implementada estrategia `--track=auto|A|B` + `--fail-on-indeterminate`, mantendo guard-rail estrito no apply Prisma. | `apps/web/scripts/migration/prisma-migration-safety.mjs`, `apps/web/scripts/migration/apply-prisma-migrations.mjs` | Menos bloqueio indevido em ambiente sem estado DB inferivel, com opcao de gate estrito. |
| U2-DOC-01 | Documentacao | Runbooks estavam desalinhados com comportamento real de CI/migration. | Atualizacao de docs operacionais e comandos de stack/migracao. | `apps/web/scripts/migration/README.md`, `docs/05-devops/MIGRATIONS.md`, `docs/05-devops/STACK_COMMANDS.md`, `docs/05-devops/README.md` | Reduz erro humano em operacao/deploy. |

## Evidencias (arquivo:linha)

- Domain error mapping no safe handler: `apps/api/src/lib/api/utils/api-wrapper.ts:599`
- Payload tipado de erro de dominio: `apps/api/src/lib/api/utils/api-wrapper.ts:621`
- Novo tipo de erro de dominio: `packages/domain/src/domain-error.ts:16`
- Bloqueio de `status=paid` no PATCH gym payment: `apps/api/src/routes/gyms/payments/[paymentId]/route.ts:22`
- Erro de contrato para settle: `apps/api/src/routes/gyms/payments/[paymentId]/route.ts:25`
- `pay-now` com evento de falha e classificacao de erro: `apps/api/src/routes/students/payments/[paymentId]/pay-now/route.ts:52`
- `pay-now` convertendo falha infra para `DomainError`: `apps/api/src/routes/students/payments/[paymentId]/pay-now/route.ts:72`
- Validacao relacional forte no create payment: `packages/domain/src/services/gym/gym-domain.service.ts:363`
- Erro para student nao vinculado ao gym: `packages/domain/src/services/gym/gym-domain.service.ts:486`
- Webhooks access usando safe handler: `apps/api/src/routes/integrations/access-events/[ingestionKey]/route.ts:12`
- Onboarding student com `submitError`/toast: `apps/web/app/student/onboarding/page.tsx:70`
- Onboarding gym com `submitError`/toast: `apps/web/app/gym/onboarding/page.tsx:83`
- Equipamentos opcionais no onboarding gym: `apps/web/app/gym/onboarding/steps/step4.tsx:104`
- Pending por pagamento no pay-now: `apps/web/hooks/use-payment-flow.ts:15`
- Bloqueio de re-clique por item no card: `apps/web/app/student/_payments/components/payment-card.tsx:93`
- Estado de erro explicito no referral: `apps/web/app/student/_payments/components/student-referral-tab.tsx:306`
- Parser de erro por secao (financeiro personal): `apps/web/lib/utils/personal-financial-errors.ts:24`
- Erro exibido na tela financeira personal: `apps/web/components/screens/personal/personal-financial.screen.tsx:138`
- Acessibilidade por teclado nos cards de perfil: `apps/web/app/auth/register/user-type/page.tsx:177`
- CI com `npm ci`: `.github/workflows/security.yml:28`
- Hook commit-msg corrigido: `.husky/commit-msg:4`
- Runner com preflight de dependencia: `apps/web/scripts/migration/run-stack-migrations.mjs:137`
- Safety-check com track A/B: `apps/web/scripts/migration/prisma-migration-safety.mjs:357`

## Validacao executada neste ciclo

### Typecheck

```bash
npm run typecheck:full
```

Resultado: sucesso (`web`, `api`, `worker`, `cron`).

### Build

```bash
npm run build:api
npm run build
npm run build:worker
npm run build:cron
```

Resultado: sucesso (bundles gerados sem erro).

### Testes unitarios

```bash
npm run test:unit
```

Resultado: sucesso (`23` arquivos de teste, `74` testes passando).

### Lint de arquivos alterados

```bash
npm run lint:changed -- --write
npm run lint:changed
```

Resultado: sucesso. Restam apenas warnings nao bloqueantes de `noStaticOnlyClass` em classes legadas de dominio.

### Migracoes/safety

```bash
npm run migration:dry-run
npm run migration:safety:prisma
```

Resultado:
- dry-run com scripts selecionados e ordenados;
- safety-check em modo advisory quando track efetiva nao e inferivel sem estado DB.

## Riscos residuais

| ID | Risco residual | Mitigacao |
|---|---|---|
| RR-U2-01 | Em ambiente sem acesso a `_prisma_migrations`, `track=auto` pode ficar indeterminado. | Em pipeline estrito, definir `--track=A|B` e/ou `--fail-on-indeterminate=true`. |
| RR-U2-02 | Mapa de dependencias conhecidas do runner pode ficar desatualizado. | Atualizar `KNOWN_DEPENDENCIES` quando nova migration tiver dependencia semantica. |
| RR-U2-03 | Warnings de `noStaticOnlyClass` em servicos legados ainda existem. | Tratar no backlog U3 com refactor dedicado (sem bloquear U2). |

## Conclusao

Todos os itens U2 deste ciclo foram implementados e validados com typecheck, build e testes unitarios passando. O repositorio esta tecnicamente apto para nova rodada de deploy/staging/prod-test com os guard-rails U2 ativos.