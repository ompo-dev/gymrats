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
  - hooks e initializers ainda admitiam caminhos legados e gating por capability.
- Impacto:
  - duplicação de fetch, maior complexidade de runtime e maior risco de estado divergente.
- Correção aplicada:
  - `apps/web/lib/api/bootstrap.ts` agora usa somente `/api/students/bootstrap`, `/api/gyms/bootstrap`, `/api/personals/bootstrap`
  - `apps/web/hooks/use-student-bootstrap.ts`
  - `apps/web/hooks/use-gym-bootstrap.ts`
  - `apps/web/hooks/use-personal-bootstrap.ts`
  - `apps/web/hooks/use-student-initializer.ts`
  - `apps/web/hooks/use-gym-initializer.ts`
  - `apps/web/hooks/use-personal-initializer.ts`
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
- `apps/web/hooks/use-student-bootstrap.ts`
- `apps/web/hooks/use-gym-bootstrap.ts`
- `apps/web/hooks/use-personal-bootstrap.ts`
- `apps/web/hooks/use-student-initializer.ts`
- `apps/web/hooks/use-gym-initializer.ts`
- `apps/web/hooks/use-personal-initializer.ts`

## Validation Status

- `npm run test:unit`: verde
- `npm run typecheck:full`: ainda falha por dívida preexistente
- `npx biome check apps packages scripts tests`: ainda falha por dívida preexistente

## Next Execution Order

1. Validar a nova cadeia auth/session no web e mobile.
2. Corrigir regressões locais introduzidas por assinatura e tipagem.
3. Entrar na onda de redução de stores e migração forte para React Query.
4. Atacar typecheck/lint por domínio, começando por student/bootstrap/auth.
