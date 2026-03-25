# System Audit - 2026-03-25

## Executive Summary

Esta auditoria consolida os principais gargalos e falhas observados em `apps/web`, `apps/api`, `apps/mobile` e packages compartilhados. O foco desta passada foi fechar o P0 de auth/sessão, remover fallbacks legados mais críticos de bootstrap e deixar um backlog executável para as próximas ondas.

O estado atual confirma degradação estrutural em múltiplas camadas:

- `typecheck:full` quebrado em massa no front.
- `biome check` com volume alto de erros.
- duplicação extensa entre web/api.
- stores monolíticos concentrando estado remoto e lógica de domínio.
- rotas legadas convivendo com `bootstrap`.
- auth com exposição indevida de token e persistência insegura no browser.

## Evidence Snapshot

### Checks executados

- `npm run typecheck:full`
  Resultado: falha com erros concentrados em `apps/web`, especialmente transformadores, páginas de domínio e tipagem de auth/bootstrap.
- `npx biome check apps packages scripts tests`
  Resultado: falha com volume alto de diagnósticos.
- `npm run test:unit`
  Resultado: verde, `3` arquivos / `7` testes.
- `npm audit --omit=dev --audit-level=moderate`
  Resultado: `10` vulnerabilidades reportadas, incluindo cadeia envolvendo `next` e `elysia`.

### Métricas estruturais confirmadas

- caminhos comuns entre `apps/web/lib` e `apps/api/src/lib`: `100`
- arquivos com conteúdo idêntico entre essas árvores: `70`
- `apps/web/stores/student-unified-store.ts`: `1655` linhas
- modelos Prisma: `69`
- campos `String` com comentário indicando JSON serializado: `28`

## Findings

### `security`

#### P0. Browser recebia `session.token` em payloads de auth

- Subsistema: auth web/api/mobile
- Evidência:
  - `apps/api/src/routes/auth/session/route.ts`
  - `apps/api/src/routes/auth/sign-in/route.ts`
  - `apps/api/src/routes/auth/sign-up/route.ts`
  - `apps/api/src/routes/auth/exchange-one-time-token/route.ts`
- Impacto:
  - bearer token bruto exposto ao browser e a qualquer XSS que alcançasse o contexto do front.
  - facilitava extração de sessão e replay.
- Correção aplicada:
  - criação de `apps/api/src/lib/auth/session-payload.ts`
  - token agora só é exposto quando o request declara `x-gymrats-client: mobile-native`
  - browser continua recebendo `session.id`, sem `session.token`
- Ordem:
  - `P0 agora`

#### P0. Token persistido em `localStorage` e cookie legível por JS

- Subsistema: web auth client / mobile WebView
- Evidência:
  - `packages/api/src/token-client.ts`
  - `apps/mobile/src/lib/webview-bridge.ts`
- Impacto:
  - bearer token ficava acessível a qualquer script no browser/WebView.
  - criava duplicidade de fonte de verdade entre cookie, localStorage e header manual.
- Correção aplicada:
  - `packages/api/src/token-client.ts` removido do papel de storage de token.
  - browser agora usa sessão por cookie e hint de sessão.
  - no shell mobile, token permanece apenas em memória da bridge, sem espelhamento em `localStorage` ou cookie JS.
- Ordem:
  - `P0 agora`

#### P0. Resolução de auth mutava domínio

- Subsistema: session/context
- Evidência:
  - `apps/web/lib/utils/session.ts`
  - `apps/web/lib/context/auth-context-factory.ts`
- Impacto:
  - autenticação gerava `student`, `gym`, `gymProfile`, `gymStats` e `personal` automaticamente.
  - requests de sessão/contexto tinham efeitos colaterais de escrita e mascaravam inconsistências do domínio.
- Correção aplicada:
  - `apps/web/lib/utils/session.ts` agora só resolve sessão.
  - `apps/web/lib/context/auth-context-factory.ts` não cria mais entidades ausentes; apenas consulta e falha explicitamente.
- Ordem:
  - `P0 agora`

### `correctness`

#### P1. `typecheck` quebrado em massa

- Subsistema: `apps/web`
- Evidência:
  - `npm run typecheck:full` falha em múltiplos módulos.
- Impacto:
  - reduz previsibilidade de refactors.
  - esconde regressões reais sob ruído constante.
- Correção proposta:
  - atacar primeiro auth/bootstrap/types compartilhados.
  - depois normalizar transformadores e páginas por domínio.
- Ordem:
  - `P1 primeira onda`

#### P1. Tipos frouxos em auth/context

- Subsistema: web/api
- Evidência:
  - uso de `Record<string, ...>` e `as unknown as` em `apps/web/lib/context/auth-context-factory.ts`
- Impacto:
  - contratos frágeis entre sessão, usuário e perfis.
- Correção proposta:
  - substituir por DTOs públicos em packages compartilhados.
- Ordem:
  - `P2 consolidação`

### `performance`

#### P1. Bootstrap coexistia com fallback legado

- Subsistema: student/gym/personal web
- Evidência:
  - `apps/web/lib/api/bootstrap-server.ts`
  - `apps/web/stores/student/load-helpers.ts`
  - `apps/web/stores/gym/load-helpers.ts`
  - `apps/web/stores/personal/load-helpers.ts`
  - `apps/web/app/student/actions-unified.ts`
  - `apps/web/app/student/_profile/actions.ts`
  - layouts e hooks priorizados ainda faziam gating por feature flag.
- Impacto:
  - duplicação de fetch, maior complexidade de runtime e maior risco de estado divergente.
- Correção aplicada:
  - `apps/web/lib/api/bootstrap.ts` agora usa somente `/api/students/bootstrap`, `/api/gyms/bootstrap`, `/api/personals/bootstrap`
  - `apps/web/lib/api/bootstrap-server.ts` deixou de cair para `/api/students/all`
  - `apps/web/stores/student/load-helpers.ts`, `apps/web/stores/gym/load-helpers.ts` e `apps/web/stores/personal/load-helpers.ts` agora usam bootstrap como caminho Ãºnico para carregamento agregado
  - `apps/web/stores/student-unified-store.ts` nÃ£o reabre mais o fallback legado por timeout em `loadAll`
  - `apps/web/app/student/actions-unified.ts` e `apps/web/app/student/_profile/actions.ts` migrados para `/api/students/bootstrap`
  - `apps/web/hooks/use-student-bootstrap.ts`
  - `apps/web/hooks/use-gym-bootstrap.ts`
  - `apps/web/hooks/use-personal-bootstrap.ts`
  - `apps/web/hooks/use-student-initializer.ts`
  - `apps/web/hooks/use-gym-initializer.ts`
  - `apps/web/hooks/use-personal-initializer.ts`
  - `apps/web/app/student/layout.tsx`, `apps/web/app/gym/layout.tsx`, `apps/web/app/personal/layout.tsx` e hooks `use-load-prioritized*` passaram a tratar bootstrap como fluxo padrÃ£o, sem gate de feature flag.
- Ordem:
  - `P1 primeira onda`

#### P1. Stores monolíticos concentram estado remoto e lógica

- Subsistema: Zustand
- Evidência:
  - `apps/web/stores/student-unified-store.ts` com `1655` linhas
  - stores de auth/gym/personal ainda misturam cache remoto, UI e hidratação
- Impacto:
  - re-render em cascata, maior acoplamento e custo alto de manutenção.
- Correção proposta:
  - React Query como fonte canônica para server state.
  - Zustand restrito a estado local/transiente.
- Ordem:
  - `P1 primeira onda`

### `architecture`

#### P1. Duplicação severa entre web e api

- Subsistema: libs compartilhadas
- Evidência:
  - `100` caminhos comuns entre `apps/web/lib` e `apps/api/src/lib`
  - `70` arquivos idênticos
- Impacto:
  - correções divergentes, aumento de bugs por drift e custo de refactor multiplicado.
- Correção proposta:
  - mover contratos/utilitários/casos de uso compartilhados para `packages/*`.
- Ordem:
  - `P2 consolidação`

### `db`

#### P2. JSON serializado como `String`

- Subsistema: Prisma/schema
- Evidência:
  - `28` campos com padrão de JSON serializado em string.
- Impacto:
  - pior capacidade de filtro, indexação e evolução do schema.
- Correção proposta:
  - migrar campos críticos para `Json` ou modelagem relacional.
- Ordem:
  - `P2 consolidação`

#### P2. Superfície de schema extensa demais sem revisão de índices baseada em uso

- Subsistema: banco
- Evidência:
  - `69` modelos Prisma
- Impacto:
  - alta chance de consultas quentes sem índice ou com shape inconsistente.
- Correção proposta:
  - auditar queries reais e adicionar índices a partir de uso observável.
- Ordem:
  - `P2 consolidação`

### `deps`

#### P1. Vulnerabilidades conhecidas em dependências runtime

- Subsistema: dependências
- Evidência:
  - `npm audit --omit=dev --audit-level=moderate`
- Impacto:
  - exposição a CVEs em cadeia de runtime.
- Correção proposta:
  - atualizar `next`, `elysia` e dependências relacionadas com validação incremental.
- Ordem:
  - `P1 primeira onda`

### `dead-code`

#### P2. Client gerado e artefatos concorrentes

- Subsistema: tooling/generated code
- Evidência:
  - `apps/web/lib/api/generated/client.ts` aparenta não ser usado
  - convivência de código novo/legado em bootstrap/auth
- Impacto:
  - ruído de manutenção e falsa sensação de cobertura.
- Correção proposta:
  - confirmar não uso e remover.
- Ordem:
  - `P3 limpeza final`

### `mobile`

#### P1. Bridge WebView espelhava credencial no contexto JS

- Subsistema: mobile shell
- Evidência:
  - `apps/mobile/src/lib/webview-bridge.ts`
- Impacto:
  - o token bruto ficava disponível para qualquer script rodando na página.
- Correção aplicada:
  - token agora fica apenas em memória da bridge.
  - wrappers de `fetch` e `XMLHttpRequest` injetam `Authorization` somente para requests de API.
  - eventos `gymrats-auth-token-set` e `gymrats-auth-token-clear` sincronizam o shell sem `localStorage`.
- Ordem:
  - `P0 agora`

## Backlog Executável

### `P0 agora`

- manter `session.token` oculto para browser e exposto apenas ao cliente nativo explícito.
- remover persistência de token em `localStorage` e cookie JS.
- impedir mutação de domínio em resolução de auth/sessão.
- consolidar o bridge mobile em token somente em memória.

### `P1 primeira onda`

- estabilizar auth/bootstrap e fechar regressões remanescentes de cliente.
- reduzir stores monolíticos, começando por `auth`, `student`, `gym`, `personal`.
- manter `bootstrap` como fonte canônica e remover mais legado.
- revisar dependências com vulnerabilidade runtime.

### `P2 consolidação`

- fazer `typecheck:full` e `biome check` ficarem verdes.
- unificar tipos públicos em packages compartilhados.
- revisar schema/índices/campos JSON.
- remover casts frouxos e adapters frágeis.

### `P3 limpeza final`

- eliminar artefatos gerados não usados.
- remover wrappers de compatibilidade já vencidos.
- podar código órfão e duplicações restantes.

## Focus Update - Student Financial

- O fluxo financeiro principal do student deixou de ler `subscription`, `memberships`, `payments`, `paymentMethods` e `referral` diretamente do store nas superfÃ­cies principais.
- `apps/web/hooks/use-student-bootstrap.ts` passou a expÃµr seletores normalizados para bootstrap financeiro.
- `apps/web/app/student/_payments/hooks/use-payments-page.ts`, `apps/web/app/student/_payments/hooks/use-student-referral.ts` e `apps/web/app/student/_profile/components/my-academias-card.tsx` passaram a consumir React Query como fonte canÃ´nica de leitura remota.
- `apps/web/app/student/page-content.tsx` agora invalida as queries financeiras apÃ³s mutaÃ§Ãµes relevantes para evitar cache divergente.

- O fluxo financeiro do student foi refinado para o mesmo modelo de ponte otimista: `apps/web/hooks/use-student-bootstrap.ts` agora prefere o snapshot do Zustand quando detecta delta real entre store e bootstrap em `subscription`, `memberships`, `payments` e `referral`.

## Focus Update - Gym/Personal Optimistic Bridge

- A estratÃ©gia foi refinada para preservar o papel certo do Zustand: ponte otimista entre usuÃ¡rio, API e componentes, e nÃ£o mais ponto isolado de fetch remoto.
- `apps/web/hooks/use-gym-bootstrap.ts` e `apps/web/hooks/use-personal-bootstrap.ts` agora expÃµem bridge hooks que buscam o bootstrap canÃ´nico via React Query e hidratam o Zustand com `hydrateInitial`.
- `apps/web/app/gym/page-content.tsx` passou a disparar bootstrap por aba enquanto os componentes continuam lendo do store, preservando resposta imediata para updates locais.
- `apps/web/app/personal/page-content.tsx` passou a usar o mesmo padrÃ£o nas abas principais e a invalidar queries `personal/bootstrap` no refresh.
- `apps/web/hooks/use-personal-financial.ts` e `apps/web/components/organisms/personal/financial/personal-financial-subscription-tab.tsx` deixaram de recarregar seÃ§Ãµes manualmente e passaram a sincronizar o fluxo via invalidaÃ§Ã£o do bootstrap.
- componentes de mutaÃ§Ã£o em `gym/personal` deixaram de repetir `loadSection` logo apÃ³s actions que jÃ¡ faziam refresh interno, reduzindo round trips redundantes em `students`, `equipment`, `expenses`, `membershipPlans` e vinculaÃ§Ãµes de personal.

## Changes Implemented In This Pass

- `apps/api/src/lib/auth/session-payload.ts`
- `apps/api/src/routes/auth/session/route.ts`
- `apps/api/src/routes/auth/sign-in/route.ts`
- `apps/api/src/routes/auth/sign-up/route.ts`
- `apps/api/src/routes/auth/exchange-one-time-token/route.ts`
- `packages/api/src/token-client.ts`
- `packages/api/src/client-factory.ts`
- `apps/web/lib/api/browser-fetch.ts`
- `apps/web/stores/auth-store.ts`
- `apps/web/lib/utils/session.ts`
- `apps/web/lib/context/auth-context-factory.ts`
- `apps/mobile/src/lib/auth.ts`
- `apps/mobile/src/lib/webview-bridge.ts`
- `apps/web/lib/api/bootstrap.ts`
- `apps/web/lib/api/bootstrap-server.ts`
- `apps/web/app/student/actions-unified.ts`
- `apps/web/app/student/_profile/actions.ts`
- `apps/web/app/student/layout.tsx`
- `apps/web/app/gym/layout.tsx`
- `apps/web/app/personal/layout.tsx`
- `apps/web/hooks/use-student-bootstrap.ts`
- `apps/web/hooks/use-gym-bootstrap.ts`
- `apps/web/hooks/use-personal-bootstrap.ts`
- `apps/web/hooks/use-load-prioritized.ts`
- `apps/web/hooks/use-load-prioritized-gym.ts`
- `apps/web/hooks/use-load-prioritized-personal.ts`
- `apps/web/hooks/use-student-initializer.ts`
- `apps/web/hooks/use-gym-initializer.ts`
- `apps/web/hooks/use-personal-initializer.ts`
- `apps/web/hooks/use-subscription.ts`
- `apps/web/stores/student/load-helpers.ts`
- `apps/web/stores/gym/load-helpers.ts`
- `apps/web/stores/personal/load-helpers.ts`
- `apps/web/stores/student-unified-store.ts`
- `apps/web/app/student/_payments/hooks/use-payments-page.ts`
- `apps/web/app/student/_payments/hooks/use-student-referral.ts`
- `apps/web/app/student/_payments/student-payments-page.tsx`
- `apps/web/app/student/_profile/components/my-academias-card.tsx`
- `apps/web/app/student/page-content.tsx`
- `apps/web/hooks/use-personal-financial.ts`
- `apps/web/app/gym/page-content.tsx`
- `apps/web/app/personal/page-content.tsx`
- `apps/web/components/organisms/personal/financial/personal-financial-subscription-tab.tsx`
- `apps/web/components/organisms/gym/gym-students.tsx`
- `apps/web/components/organisms/gym/add-student-modal.tsx`
- `apps/web/components/organisms/gym/add-equipment-modal.tsx`
- `apps/web/components/organisms/gym/maintenance-modal.tsx`
- `apps/web/components/organisms/gym/financial/add-expense-modal.tsx`
- `apps/web/components/organisms/gym/membership-plans-page.tsx`
- `apps/web/components/organisms/personal/add-personal-student-modal.tsx`
- `apps/web/components/organisms/personal/personal-student-detail/hooks/use-personal-student-detail.ts`
- `apps/web/hooks/use-personal-settings.ts`
- `apps/web/hooks/use-bootstrap-refresh.ts`

## Focus Update - Duplicate Bootstrap Pipelines Removed

- `apps/web/app/gym/page-content.tsx` e `apps/web/app/personal/page-content.tsx` deixaram de executar `initializer + loadAllPrioritized` em paralelo com o bootstrap por aba.
- O fluxo ativo de gym/personal ficou reduzido a `SSR prefetch -> React Query cache -> bridge por aba -> hydrateInitial no Zustand`.
- Foram removidos os hooks redundantes:
  - `apps/web/hooks/use-gym-initializer.ts`
  - `apps/web/hooks/use-personal-initializer.ts`
  - `apps/web/hooks/use-load-prioritized-gym.ts`
  - `apps/web/hooks/use-load-prioritized-personal.ts`
- `apps/web/hooks/use-bootstrap-refresh.ts` centraliza a invalidaÃ§Ã£o de bootstrap de `student`, `gym` e `personal`.
- `apps/web/components/organisms/gym/financial/financial-ads-tab.tsx`, `apps/web/hooks/use-personal-financial.ts` e `apps/web/hooks/use-payment-flow.ts` passaram a reutilizar esse invalidator em vez de repetir predicados de `invalidateQueries` ou `loadSection("campaigns")`.
- `apps/web/hooks/use-personal-students.ts` deixou de forÃ§ar `loadSection("students")` apÃ³s `actions.removeStudent`, porque a action jÃ¡ sincroniza o store e a invalidaÃ§Ã£o do bootstrap atualiza o cache canÃ´nico.
- `apps/web/app/student/_payments/hooks/use-payments-page.ts` e `apps/web/app/student/_payments/hooks/use-student-referral.ts` deixaram de combinar `invalidatePaymentQueries()` com `refetch` redundante da mesma superfÃ­cie quando o bootstrap financeiro jÃ¡ estÃ¡ ativo.

## Validation Status

- `npm run test:unit`: verde
- `npm run typecheck:full`: ainda falha por dívida preexistente
- `npx biome check apps packages scripts tests`: ainda falha por dívida preexistente

## Validation Detail

- `npx biome check` nos arquivos alterados nesta onda: verde
- `npx tsc -p apps/web/tsconfig.json --noEmit --pretty false` filtrado para os arquivos alterados nesta onda: sem erros correspondentes
- busca textual por `useStudent("subscription" | "memberships" | "payments" | "paymentMethods" | "referral")` em `apps/web`: sem ocorrÃªncias remanescentes

- `npx biome check` em `apps/web/hooks/use-gym-bootstrap.ts`, `apps/web/hooks/use-personal-bootstrap.ts`, `apps/web/app/gym/page-content.tsx`, `apps/web/app/personal/page-content.tsx`, `apps/web/hooks/use-personal-financial.ts` e `apps/web/components/organisms/personal/financial/personal-financial-subscription-tab.tsx`: verde
- `npm run test:unit`: verde apÃ³s introduzir o padrÃ£o `React Query bootstrap -> hydrateInitial -> Zustand otimista` em `gym/personal`

## Next Execution Order

1. Validar a nova cadeia auth/session no web e mobile.
2. Corrigir regressões locais introduzidas por assinatura e tipagem.
3. Entrar na onda de redução de stores e migração forte para React Query.
4. Atacar typecheck/lint por domínio, começando por student/bootstrap/auth.
