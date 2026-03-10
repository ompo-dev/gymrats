# Monorepo + Vercel: Arquitetura Alvo do GymRats

Data da leitura tecnica: 2026-03-10

## 1. Contexto real do projeto

O GymRats ja esta em producao, com clientes ativos, e hoje opera como um unico app Next.js com frontend e backend juntos na Vercel.

Isso muda completamente a estrategia da refatoracao:

- nao podemos fazer big bang refactor;
- nao podemos assumir um backend separado sempre ativo fora do Next;
- precisamos tratar `app/api` do Next como superficie canonica de producao;
- qualquer migracao para monorepo precisa preservar o deploy unico em `apps/web`.

Em outras palavras: o alvo deve parecer o padrao do print, mas o caminho correto e uma migracao incremental para monorepo, mantendo um unico deploy principal na Vercel.

## 2. O que existe hoje

### 2.1 Aplicacao web

O projeto atual ainda nao esta em monorepo. Ele esta concentrado na raiz com estas camadas principais:

- `app/`: App Router do Next, paginas, layouts e `app/api`
- `components/`: `314` arquivos de componentes
- `hooks/`: `34` arquivos de hooks
- `stores/`: `29` arquivos, incluindo stores unificados
- `lib/`: dominio, auth, access control, API client, services, types e use-cases
- `prisma/`: schema e migrations
- `server/`: servidor Elysia/Bun, rotas, plugins e workers

Os dominios visiveis na interface estao organizados em torno de:

- `student`
- `gym`
- `personal`
- `auth`
- `welcome`
- `api-docs`

### 2.2 Rotas e APIs

Hoje existem duas superficies de backend convivendo ao mesmo tempo:

1. Next App Router

- `140` arquivos `route.ts` em `app/api`
- esta e a superficie mais aderente ao deploy atual em Vercel

2. Elysia/Bun

- `server/app.ts`
- `14` arquivos em `server/routes`
- `13` arquivos em `server/handlers`
- `server/custom-server.ts` monta Next + Elysia no mesmo processo local

Diagnostico: a aplicacao carrega uma API duplicada. A logica de negocio ja foi parcialmente extraida para `lib/use-cases` e `lib/services`, mas ainda existem adapters duplicados em Next e Elysia.

### 2.3 Frontend, componentes, hooks e estado

O frontend ja sugere fronteiras naturais de pacote:

- `components/atoms`, `molecules`, `organisms`, `templates`, `ui`
- `components/duo/*` para a linguagem visual propria
- `stores/student-unified-store.ts`
- `stores/gym-unified-store.ts`
- `stores/personal-unified-store.ts`
- `stores/subscription-ui-store.ts`

Os hooks principais estao em:

- `hooks/use-student.ts`
- `hooks/use-gym.ts`
- `hooks/use-personal.ts`
- `hooks/use-user-session.ts`
- `hooks/use-ability.ts`

Diagnostico: o frontend ja esta caminhando para um modelo por dominio, mas os stores ainda conhecem rotas HTTP demais e varias responsabilidades de infraestrutura continuam espalhadas em `hooks`, `stores` e `lib/api`.

### 2.4 Auth e sessao

O auth atual e hibrido:

- Better Auth canonico em `lib/auth-config.ts`
- catch-all oficial em `app/api/auth/[...all]/route.ts`
- login legado por email/senha em `app/api/auth/sign-in/route.ts`
- sessao hibrida em `app/api/auth/session/route.ts`
- middleware/guards hibridos em `lib/api/middleware/auth.middleware.ts`
- cookie legado `auth_token` ainda convive com `better-auth.session_token`

Diagnostico: existe um plano claro de migrar para Better Auth, mas o sistema ainda mantem compatibilidade com sessao antiga e isso aumenta acoplamento em middleware, hooks e APIs.

### 2.5 Access control

O controle de acesso atual tambem e hibrido:

- `proxy.ts` protege paginas por autenticacao basica
- `createSafeHandler()` + `requireStudent/requireGym/requirePersonal` protegem rotas Next
- `server/plugins/auth-roles.ts` protege rotas Elysia
- `lib/access-control/*` contem motor RBAC/ABAC
- `hooks/use-ability.ts` usa o motor no client

Pontos fortes:

- existe um nucleo claro de policies e features;
- existe preocupacao com heranca de beneficios entre aluno, academia e personal.

Pontos fracos:

- parte das regras ainda esta espalhada em handlers e services;
- o ABAC por ambiente existe conceitualmente, mas ainda nao e aplicado de forma totalmente uniforme no servidor;
- ha duplicacao entre os guards do Next e do Elysia.

### 2.6 Pagamentos

O dominio financeiro esta bem relevante e ja tem varios blocos maduros:

- gateway AbacatePay
- subscriptions de aluno, academia e personal
- memberships, payments, withdraws, referrals, boost campaigns
- webhook em `app/api/webhooks/abacatepay/route.ts`
- processamento pesado em `lib/services/webhook.service.ts`
- fila BullMQ em `lib/queue/*`
- workers em `server/workers/*`

Observacao importante para o ambiente atual:

- BullMQ + workers persistentes nao combinam naturalmente com um deploy somente na Vercel;
- `server/custom-server.ts` e `server/workers/*` fazem sentido em runtime persistente;
- na Vercel, o caminho seguro e considerar o webhook do Next como ponto canonico e tratar fila/worker como concern externa.

### 2.7 Banco de dados

O banco atual esta centralizado e bem modelado em Prisma:

- `prisma/schema.prisma`
- PostgreSQL via `DATABASE_URL`
- uso de Supabase como stack adjacente para Postgres/Storage

Dominios principais do schema:

- usuarios, sessions, accounts, verification
- students, student_profile, student_progress
- gyms, gym_profile, gym_stats, gym_membership
- personals e afiliacoes
- workouts, weekly_plan, plan_slot, history, progress
- nutrition e foods
- subscriptions, payments, withdraws
- referrals, boost campaigns

Diagnostico: o banco ja esta denso o suficiente para justificar um pacote proprio de `db`.

## 3. Principais problemas arquiteturais

### 3.1 Duas APIs para a mesma plataforma

O maior problema estrutural hoje e ter:

- `app/api/*` como runtime realista para Vercel
- `server/*` como runtime Elysia paralelo

Isso duplica:

- contratos
- middlewares
- validacoes
- auth guards
- handlers
- manutencao

### 3.2 Auth e sessao com compatibilidade prolongada

Better Auth ja existe, mas a compatibilidade com `auth_token` e sessao antiga ainda atravessa:

- middleware
- session route
- hooks client-side
- alguns fluxos de login

### 3.3 Store e hook conhecem demais a API

Os stores unificados melhoraram a experiencia do frontend, mas ainda estao acoplados demais a endpoints HTTP especificos.

Isso dificulta:

- teste de dominio
- troca de adapter HTTP
- reutilizacao futura em `native`

### 3.4 Documentacao desatualizada em partes

Algumas docs ainda descrevem um modo offline-first completo, mas o codigo atual ja removeu a fila offline do store principal:

- `stores/student/slices/sync-slice.ts` deixa claro que a sincronizacao pendente virou no-op
- `lib/api/client-factory.ts` afirma que a escrita agora e 100% online

Ou seja: a documentacao arquitetural precisa ser alinhada ao codigo real.

### 3.5 Background jobs nao estao alinhados ao deploy atual

Se o deploy oficial e apenas Vercel com Next.js, entao:

- workers BullMQ nao podem ser tratados como parte garantida do runtime web;
- webhooks, emails e tarefas pesadas precisam de desenho explicito para execucao externa ou inline controlado.

## 4. Decisao arquitetural para seguir o padrao do print

### 4.1 Diretriz principal

O GymRats deve migrar para um monorepo no formato:

```text
apps/
  landing/
  native/
  web/
packages/
  access-control/
  api/
  auth/
  cache/
  config/
  db/
  env/
  plans/
  schemas/
  search/
  storage/
  supabase/
  trpc/
  types/
  ui/
  workflows/
```

Mas com uma regra muito importante:

- no curto e medio prazo, apenas `apps/web` sera deployado;
- `apps/web` continuara hospedando frontend e backend juntos na Vercel;
- `apps/landing` e `apps/native` ficam como extensao futura, nao como pre-requisito para a refatoracao.

### 4.2 Fonte de verdade de producao

Para o contexto atual, a fonte de verdade deve ser:

- UI: `apps/web/app`
- Backend HTTP: `apps/web/app/api`
- Server Actions: `apps/web/*` apenas como camada fina de orquestracao
- Dominio e infraestrutura compartilhavel: `packages/*`

O runtime Elysia deve virar uma destas opcoes:

1. adapter opcional para desenvolvimento/local
2. adapter para um backend separado futuro
3. codigo legado a ser removido apos consolidacao do Next

Para Vercel, ele nao deve mais ser o centro da arquitetura.

## 5. Mapeamento do codigo atual para o monorepo alvo

### 5.1 Apps

#### `apps/web`

Recebe o codigo que hoje esta em:

- `app/`
- parte de `hooks/`
- parte de `components/`
- parte de `stores/`
- providers e layouts de interface

Regra:

- tudo que e pagina, layout, route handler, loading, metadata e composicao de tela fica em `apps/web`
- tudo que for compartilhavel ou independente de framework deve sair de `apps/web`

#### `apps/landing`

Alvo futuro para:

- `welcome`
- marketing
- acquisition pages
- SEO e paginas publicas de campanha

No momento, pode nascer primeiro apenas como decisao arquitetural, sem migracao imediata.

#### `apps/native`

Alvo futuro para app mobile.

Ele so deve consumir:

- `packages/ui` onde fizer sentido
- `packages/api`
- `packages/auth`
- `packages/access-control`
- `packages/types`
- `packages/schemas`
- `packages/workflows` ou services puros

### 5.2 Packages

#### `packages/db`

Mover para ca:

- `prisma/schema.prisma`
- `prisma/migrations/*`
- `lib/db.ts`

Responsabilidade:

- Prisma client
- schema
- migrations
- seeds
- repositorios/queries compartilhadas se necessario

#### `packages/auth`

Mover para ca:

- `lib/auth-config.ts`
- helpers de sessao
- `requireAuth`, `requireStudent`, `requireGym`, `requirePersonal`
- compat layer de cookie durante a migracao

Responsabilidade:

- Better Auth
- session adapters
- guards compartilhados
- deprecacao planejada do legado `auth_token`

#### `packages/access-control`

Mover para ca:

- `lib/access-control/*`
- features, policies, plans e ability engine

Responsabilidade:

- RBAC/ABAC
- heranca de beneficios
- matriz de features por plano
- contratos server/client para autorizacao

#### `packages/plans`

Concentrar:

- pricing
- planos de aluno/gym/personal
- feature matrices ligadas a monetizacao
- configuracoes hoje espalhadas em access control e subscription utils

#### `packages/schemas`

Mover para ca:

- `lib/api/schemas/*`

Responsabilidade:

- Zod schemas
- DTOs de request/response
- validacao compartilhada entre route handler, client e workflows

#### `packages/types`

Mover para ca:

- `lib/types/*`

Responsabilidade:

- tipos compartilhados de dominio
- snapshots unificados de student/gym/personal
- contratos que precisam ser usados por web, future native e workflows

#### `packages/api`

Concentrar:

- `lib/api/client*`
- `lib/api/generated/*`
- `lib/api/utils/*`
- contratos OpenAPI/Orval
- adapters puros de endpoint

Importante:

- o endpoint publico continua em `apps/web/app/api`
- `packages/api` nao substitui `app/api`; ele concentra client, contratos e funcoes puras

#### `packages/ui`

Receber apenas componentes realmente compartilhaveis:

- `components/ui/*`
- `components/atoms/*`
- componentes `duo/*` reutilizaveis

Nao mover para ca:

- pagina inteira
- composicao altamente acoplada ao App Router
- tela que depende diretamente de store especifico

#### `packages/workflows`

Receber:

- services de dominio
- orchestration de pagamento
- referrals
- webhooks
- email
- filas
- cron jobs

Exemplos atuais naturais:

- `lib/services/*`
- `lib/use-cases/*`
- `lib/queue/*`
- `lib/actions/payments/*` depois de afinados

#### `packages/env`

Concentrar:

- leitura e validacao de variaveis de ambiente

#### `packages/config`

Concentrar:

- feature flags
- configuracoes de runtime
- defaults de observabilidade

#### `packages/search`

Candidato natural para:

- foods search
- exercises search
- busca geolocalizada futura

#### `packages/storage`

Para:

- uploads
- arquivos
- imagens
- adaptadores de storage

#### `packages/supabase`

Para:

- clients supabase
- storage adapter
- integracoes SSR/server/browser

#### `packages/cache`

Para:

- cache de dados pesados
- idempotencia
- reuso de pix valido
- possiveis wrappers de Redis/Upstash

#### `packages/trpc`

Somente como reserva arquitetural.

Recomendacao atual:

- nao adotar `trpc` agora;
- manter REST + OpenAPI como contrato principal;
- criar `packages/trpc` apenas se um novo canal realmente exigir.

## 6. Padrao interno recomendado dentro de `apps/web`

Mesmo apos a migracao para monorepo, `apps/web` nao deve continuar como um balaio unico.

Sugestao de organizacao:

```text
apps/web/
  app/
    api/
    student/
    gym/
    personal/
    auth/
    welcome/
  features/
    student/
      components/
      hooks/
      state/
      actions/
    gym/
      components/
      hooks/
      state/
      actions/
    personal/
      components/
      hooks/
      state/
      actions/
    payments/
    auth/
  providers/
  lib/
```

Regras:

- paginas ficam em `app/`
- feature state local do web fica em `features/<dominio>/state`
- server actions finas ficam em `features/<dominio>/actions`
- nada de logica de negocio pesada dentro de page/layout/route handler

## 7. Decisoes obrigatorias para nao quebrar producao

### 7.1 API canonica: Next, nao Elysia

Como o deploy atual e Vercel com Next.js:

- `app/api` precisa virar a unica porta oficial de producao;
- o Elysia deve parar de ser tratado como fonte primaria;
- se for mantido, deve ser adapter secundario.

### 7.2 Better Auth como destino final

O alvo deve ser:

- Better Auth como sessao unica
- remocao gradual de `auth_token`
- sessao unica para hooks, middleware e backend

### 7.3 Server Actions devem ser finas

Hoje algumas actions fazem orquestracao valida, mas o padrao final deve ser:

- action chama workflow/service
- workflow faz regra de negocio
- route handler chama workflow/service
- store chama API client

Ou seja: action e endpoint nao podem competir pela mesma logica.

### 7.4 Worker persistente nao pode ficar implicito

Se a operacao continuar so com Vercel, existem duas saidas seguras:

1. externalizar worker

- Trigger.dev
- QStash
- Railway/Render/Fly para worker
- outro processo persistente

2. processar inline apenas o que for curto e idempotente

O que nao pode continuar e assumir que `server/workers/*` existe automaticamente em producao so porque o codigo esta no repositorio.

## 8. Sequencia de migracao recomendada

### Fase 1. Congelar a arquitetura canonica

- declarar `apps/web` como deploy unico oficial
- declarar `app/api` como backend oficial
- tratar `server/*` como adapter paralelo

### Fase 2. Extrair os pacotes estaveis

Extrair primeiro, com menor risco:

- `packages/env`
- `packages/config`
- `packages/types`
- `packages/schemas`
- `packages/db`
- `packages/auth`
- `packages/access-control`

### Fase 3. Extrair o dominio

Depois mover:

- services
- use-cases
- configuracoes de plano
- pagamentos
- referrals
- webhooks

Destino principal:

- `packages/workflows`
- `packages/plans`

### Fase 4. Limpar adapters duplicados

- route handlers Next passam a importar apenas packages
- Elysia passa a ser adapter opcional ou e removido
- auth middleware fica unificado

### Fase 5. Organizar frontend por feature

- mover `stores/*` para `apps/web/features/*/state`
- mover hooks de dominio para `apps/web/features/*/hooks`
- separar UI compartilhavel em `packages/ui`

### Fase 6. Landing e native

So depois da consolidacao do core:

- extrair `apps/landing`
- iniciar `apps/native`

## 9. Conclusao objetiva

O GymRats ja tem material suficiente para virar um monorepo limpo, mas hoje ainda esta no meio de uma transicao arquitetural.

O que ja esta maduro:

- dominio rico em Prisma
- services/use-cases bem encaminhados
- stores unificados por contexto
- access control com nucleo proprio
- pagamentos e monetizacao como dominio central

O que precisa ser decidido para a arquitetura final:

- Next `app/api` como backend canonico de producao
- Better Auth como sessao unica
- workflows externos ou explicitamente compatibilizados com Vercel
- packages formais para dominio compartilhado

Resumo da recomendacao:

- seguir o padrao do print, sim;
- mas fazer isso com `apps/web` como deploy unico da Vercel;
- sem reestruturacao abrupta;
- extraindo primeiro os pacotes naturais que o proprio codigo ja revelou.
