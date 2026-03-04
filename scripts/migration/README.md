# migration

- Caminho: `scripts/migration`
- Finalidade: scripts de manutenção, migração e suporte operacional.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `apply-alternative-exercises-migration.js`: Arquivo da camada local.
- `apply-pending-user-role-migration.js`: Adiciona role PENDING ao UserRole para fluxo de seleção aluno/academia após primeiro login.
- `apply-weekly-plan-migration.js`: Migra Units → WeeklyPlan (7 slots Seg-Dom). Cria WeeklyPlan + PlanSlot para cada student. Distribui workouts nos slots por ordem. Students sem units recebem 7 slots rest.
- `apply-google-auth-migration.js`: Arquivo da camada local.
- `apply-gym-locations-payment-migration.js`: Arquivo da camada local.
- `apply-metabolic-limitations-migration.js`: Arquivo da camada local.
- `apply-multi-gyms-migration.js`: Arquivo da camada local.
- `apply-nutrition-chat-usage-migration.js`: Arquivo da camada local.
- `apply-nutrition-migration.js`: Arquivo da camada local.
- `apply-pix-cache-payments-migration.js`: Adiciona pixBrCode, pixBrCodeBase64, pixExpiresAt em payments para cache de PIX (reutilizar no "Pagar agora").
- `apply-subscriptions-migration.js`: Arquivo da camada local.
- `apply-unit-studentid-migration.js`: Arquivo da camada local.
- `apply-weight-history-migration.js`: Arquivo da camada local.
- `apply-workout-exercise-educational-data-migration.js`: Arquivo da camada local.
- `apply-workout-history-optional-migration.js`: Arquivo da camada local.
- `apply-workout-progress-migration.js`: Arquivo da camada local.
- `apply-workout-type-migration.js`: Arquivo da camada local.
- `apply-boost-campaign-radius-km-migration.js`: Adiciona coluna radiusKm (INTEGER, default 5) em boost_campaigns para alcance geográfico dos anúncios.
- `apply-student-profile-target-water-migration.js`: Adiciona coluna targetWater (INTEGER) em student_profiles para meta diária de água.

## Detalhamento técnico por arquivo

### `apply-alternative-exercises-migration.js`
- O que faz: implementa o módulo `apply-alternative-exercises-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-google-auth-migration.js`
- O que faz: implementa o módulo `apply-google-auth-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma), Autenticação/sessão
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-gym-locations-payment-migration.js`
- O que faz: implementa o módulo `apply-gym-locations-payment-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-metabolic-limitations-migration.js`
- O que faz: implementa o módulo `apply-metabolic-limitations-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-multi-gyms-migration.js`
- O que faz: implementa o módulo `apply-multi-gyms-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-nutrition-chat-usage-migration.js`
- O que faz: implementa o módulo `apply-nutrition-chat-usage-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-nutrition-migration.js`
- O que faz: implementa o módulo `apply-nutrition-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-subscriptions-migration.js`
- O que faz: implementa o módulo `apply-subscriptions-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-unit-studentid-migration.js`
- O que faz: implementa o módulo `apply-unit-studentid-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-weight-history-migration.js`
- O que faz: implementa o módulo `apply-weight-history-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-workout-exercise-educational-data-migration.js`
- O que faz: implementa o módulo `apply-workout-exercise-educational-data-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-workout-history-optional-migration.js`
- O que faz: implementa o módulo `apply-workout-history-optional-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-workout-progress-migration.js`
- O que faz: implementa o módulo `apply-workout-progress-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-workout-type-migration.js`
- O que faz: implementa o módulo `apply-workout-type-migration.js` da camada `migration`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `apply-boost-campaign-radius-km-migration.js`
- O que faz: adiciona a coluna `radiusKm` (INTEGER NOT NULL DEFAULT 5) na tabela `boost_campaigns`.
- Como: executa `ALTER TABLE "boost_campaigns" ADD COLUMN IF NOT EXISTS "radiusKm" ...` via Prisma `$executeRawUnsafe`.
- Por que: suportar alcance geográfico dos anúncios (raio em km); usado pela API `/api/boost-campaigns/nearby` e pela UI de criação de campanha.
- Comunica com: Banco de dados (Prisma).
- Uso: `node scripts/migration/apply-boost-campaign-radius-km-migration.js`. Depois executar `npx prisma generate`.

### `apply-student-profile-target-water-migration.js`
- O que faz: adiciona a coluna `targetWater` (INTEGER) na tabela `student_profiles` e define 3000ml para registros existentes.
- Como: executa `ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "targetWater" INTEGER` e `UPDATE ... SET "targetWater" = 3000 WHERE "targetWater" IS NULL` via Prisma `$executeRawUnsafe`.
- Por que: permitir que a academia defina a meta diária de água do aluno.
- Comunica com: Banco de dados (Prisma).
- Uso: `node scripts/migration/apply-student-profile-target-water-migration.js`. Depois executar `npx prisma generate`.

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
