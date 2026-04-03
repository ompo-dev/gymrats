# Actions Cache Audit

Auditoria executada sobre `apps/web`, usando `docs/APPLICATION_GRAPH.md` como mapa das superficies e `docs/ACTIONS_CACHE_STANDARD.md` como regra de conformidade.

## Resumo Executivo

| Superficie | Status | Observacao |
| --- | --- | --- |
| Infra `lib/actions/*` + resolvers + bootstrap | `ok` | Camada centralizada de `use cache`, tags, invalidacao e bootstrap consolidada. |
| `student` | `ok` | Fluxos de treino e nutricao alinhados a stores/actions; polling bloqueante removido dos fluxos interativos auditados. |
| `gym` | `ok` | Sem uso direto de `serverApi*`; tags explicitas para dashboard, alunos, financeiro, access e coaching. |
| `personal` | `ok` | Mesmo padrao de `gym`, com cobertura explicita para students, nutrition, weekly plan, access e financeiro. |
| `admin` | `ok` | Stream proxy permanece como excecao tecnica intencional. |
| `auth` + publico | `ok` | Sem desvios estruturais de actions/cache; excecoes publicas documentadas abaixo. |
| Shared components data-touching | `ok` | Modais de biblioteca deixaram de ler API diretamente. |
| Bloqueios | `none` | Nenhum bloqueio aberto na camada web auditada. |

## Desvios Corrigidos

### `responsabilidade errada no componente`

- `apps/web/components/organisms/modals/training-library-modal.tsx`
  - Removido `actionClient` direto do componente.
  - Leitura de detalhe do plano foi movida para `useStudent("actions")` via `getLibraryPlanDetail`.

- `apps/web/components/organisms/modals/nutrition-library-modal.tsx`
  - Removido `actionClient` direto do componente.
  - Leitura de detalhe foi movida para `useStudent("actions")` e `useStudentDetailStore`.

### `polling/background inadequado`

- `apps/web/stores/student-unified-store.ts`
  - Fluxo de `activateLibraryPlan` deixou de depender de `jobId` + `waitForJobCompletion`.

- `apps/web/stores/student/slices/nutrition-slice.ts`
  - Fluxo de `activateNutritionLibraryPlan` deixou de depender de polling bloqueante.

- `apps/web/stores/student-detail-store.ts`
  - Fluxos scoped de ativacao de nutricao (`gym` / `personal`) deixaram de depender de polling bloqueante.

- `apps/api/src/routes/workouts/weekly-plan/activate/route.ts`
  - Contrato interativo ajustado para resposta sincronizada.

- `apps/api/src/routes/nutrition/activate/route.ts`
- `apps/api/src/routes/gym/students/[id]/nutrition/activate/route.ts`
- `apps/api/src/routes/personals/students/[id]/nutrition/activate/route.ts`
  - Contratos interativos ajustados para resposta sincronizada.

## Excecoes Intencionais

### `excecao intencional` de staleness imediata

- `apps/web/app/gym/actions.ts`
  - `fresh: true` em leitura de PIX de boost campaign.

- `apps/web/app/personal/actions.ts`
  - `fresh: true` em leitura de PIX de boost campaign.

### `excecao intencional` de suporte de infraestrutura

- `apps/web/stores/student/load-helpers.ts`
- `apps/web/stores/gym/load-helpers.ts`
- `apps/web/stores/personal/load-helpers.ts`
  - Suporte a `fresh: true` permanece disponivel apenas como bypass explicito.
  - Semantica auditada: `force` quebra dedupe local; `fresh` e escape deliberado.

### `excecao intencional` de transporte low-level

- `apps/web/lib/actions/cached-reader.ts`
- `apps/web/lib/actions/web-actions.ts`
- `apps/web/lib/api/server.ts`
  - Camadas base autorizadas a usar `cacheTag`, `cacheLife`, `updateTag`, `revalidateTag` e `fetch`.

- `apps/web/app/api/admin/observability/stream/route.ts`
  - Proxy de stream autorizado a usar `fetch` direto.

- `apps/web/stores/assistant-transport-store.ts`
  - SSE com `fetch` direto e `cache: "no-store"` permanece intencional.

### `excecao intencional` publica / third-party

- `apps/web/app/swagger/page.tsx`
- `apps/web/app/api-docs/page.tsx`
  - Paginas publicas consumindo Swagger JSON diretamente.

- `apps/web/app/gym/onboarding/steps/step2.tsx`
  - `axios` para ViaCEP externo; nao faz parte da camada de actions/cache do dominio interno.

## Validacoes Feitas

- `apps/web` sem uso direto de `serverApiGet`, `serverApiPost`, `serverApiPatch` ou `serverApiDelete` fora das camadas base permitidas.
- `apps/web/components` sem uso direto restante de `actionClient`.
- `apps/web/stores` sem uso restante de `waitForJobCompletion` nos fluxos auditados.
- `fresh=1` inexistente no `apps/web`.
- `cacheTag`, `cacheLife`, `updateTag` e `revalidateTag` restritos a `apps/web/lib/actions/*`.
- `npm run typecheck:web` passou.
- `npm run typecheck:api` passou.

## Fechamento

Status final da auditoria: `ok`, com excecoes intencionais documentadas e sem desvios estruturais abertos no `apps/web` para o padrao oficial de actions + cache tags + `use cache`.
