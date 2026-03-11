# Arquitetura de Casos de Uso — GymRats

> Documento atualizado em: 2026-03-02

## Visão geral

O GymRats adota uma **Application Layer** explícita em `lib/use-cases/`, separando regras de negócio dos adaptadores HTTP (Elysia + Next.js API Routes). Handlers são adaptadores finos: validam entrada, extraem contexto de auth e delegam para o caso de uso correspondente.

```
User → UI (Next.js) → HTTP Handler (Elysia / Next API)
                           │
                           ▼
                     [ Use Case ]          ← Application Layer
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              PrismaClient    (outros gateways)
                    │
                    ▼
               PostgreSQL
```

---

## Convenções de implementação

### Estrutura de um use case

Cada arquivo em `lib/use-cases/<domínio>/` segue o padrão:

```ts
// 1. Tipos de entrada (Input)
export interface DoSomethingInput {
  studentId: string;
  // ...campos tipados
}

// 2. Tipos de saída (Output)
export interface DoSomethingOutput {
  result: SomeDTO;
}

// 3. Função pura exportada, sem dependências de framework
export async function doSomethingUseCase(
  input: DoSomethingInput,
): Promise<DoSomethingOutput> {
  // só acessa db, sem req/res, sem NextRequest, sem Elysia Context
}
```

### O que um handler faz

```ts
// handler Elysia
export async function myHandler({ set, body, studentId }: Context) {
  const validation = validateBody(body, mySchema);
  if (!validation.success) return badRequestResponse(set, "...");

  const result = await myUseCase({ studentId, ...validation.data });
  return successResponse(set, result);
}

// handler Next.js
export async function myHandler(request: NextRequest): Promise<NextResponse> {
  const auth = await requireStudent(request);
  if ("error" in auth) return auth.response;

  const result = await myUseCase({ studentId: auth.user.student!.id });
  return successResponse(result);
}
```

---

## Domínios

### Students — `lib/use-cases/students/`

| Arquivo | Função | Descrição |
|---------|--------|-----------|
| `get-profile.ts` | `getStudentProfileUseCase` | Perfil + targets nutricionais |
| `update-profile.ts` | `updateStudentProfileUseCase` | Atualiza dados do perfil |
| `get-progress.ts` | `getStudentProgressUseCase` | XP, streak, workoutsCompleted, nível |
| `update-progress.ts` | `updateStudentProgressUseCase` | Incrementa XP, atualiza streak/nível |
| `add-weight.ts` | `addWeightUseCase` | Registra peso + atualiza currentWeight |
| `get-weight-history.ts` | `getWeightHistoryUseCase` | Histórico paginado com filtro de data |
| `get-student-info.ts` | `getStudentInfoUseCase` | Dados demográficos e identidade |
| `get-personal-records.ts` | `getPersonalRecordsUseCase` | PRs do student |
| `get-day-passes.ts` | `getDayPassesUseCase` | Day passes comprados |
| `get-friends.ts` | `getFriendsUseCase` | Lista de amigos aceitos |

**Regras de negócio relevantes:**
- XP e streak são calculados no `update-progress.ts` (cálculo de dias consecutivos baseado em `WorkoutHistory`).
- O `add-weight.ts` atualiza `StudentProfile.currentWeight` automaticamente após criar o `WeightEntry`.

---

### Workouts — `lib/use-cases/workouts/`

| Arquivo | Função | Descrição |
|---------|--------|-----------|
| `get-units.ts` | `getUnitsUseCase` | Units do student com workouts associados |
| `get-weekly-plan.ts` | `getWeeklyPlanUseCase` | Plano semanal com streaks calculados |
| `complete-workout.ts` | `completeWorkoutUseCase` | Finaliza workout: cria `WorkoutHistory`, `ExerciseLog`, atualiza `StudentProgress` |
| `save-workout-progress.ts` | `saveWorkoutProgressUseCase` | Upsert de progresso parcial (checkpoint) |
| `get-workout-progress.ts` | `getWorkoutProgressUseCase` | Busca + deserializa progresso parcial |
| `delete-workout-progress.ts` | `deleteWorkoutProgressUseCase` | Remove progresso parcial (idempotente) |
| `get-workout-history.ts` | `getWorkoutHistoryUseCase` | Histórico paginado com volumes calculados |
| `update-exercise-log.ts` | `updateExerciseLogUseCase` | Atualiza sets/notas de exercício + recalcula totalVolume |
| `streak.ts` | `calculateStreak` | Calcula streak de dias consecutivos |

**Regras de negócio relevantes:**
- `completeWorkoutUseCase` limpa o `WorkoutProgress` parcial ao finalizar (idempotente, ignora P2025).
- `getWorkoutHistoryUseCase` recalcula `totalVolume` a partir dos sets se o campo for zero.
- `updateExerciseLogUseCase` recalcula o `totalVolume` do `WorkoutHistory` inteiro após cada atualização de sets.

---

### Nutrition — `lib/use-cases/nutrition/`

| Arquivo | Função | Descrição |
|---------|--------|-----------|
| `get-daily-nutrition.ts` | `getDailyNutritionUseCase` | Nutrição diária + metas do perfil |
| `update-daily-nutrition.ts` | `updateDailyNutritionUseCase` | Upsert transacional daily nutrition + meals + foods |
| `search-foods.ts` | `searchFoodsUseCase` | Busca alimentos por nome/categoria |

**Regras de negócio relevantes:**
- `updateDailyNutritionUseCase` usa `db.$transaction` para garantir atomicidade ao substituir refeições.
- Os totais (calorias, proteínas, carbs, gorduras) são calculados no handler, somando apenas refeições `completed: true`.
- Metas nutricionais (`targetCalories`, etc.) são lidas do `StudentProfile` — fallback para valores padrão (2000 kcal, 150g proteína, 250g carb, 65g gordura).

---

### Subscriptions — `lib/use-cases/subscriptions/index.ts`

| Função | Descrição |
|--------|-----------|
| `getCurrentSubscriptionUseCase` | Busca assinatura atual do student |
| `createSubscriptionUseCase` | Cria/atualiza assinatura (monthly/annual) |
| `startTrialUseCase` | Inicia trial de 14 dias — dispara erro se trial já usado ou plano não-free ativo |
| `cancelSubscriptionUseCase` | Cancela assinatura (status → canceled, cancelAtPeriodEnd: true) |
| `activatePremiumUseCase` | Ativa premium direto (bypass AbacatePay, uso interno/admin) |

**Regras de negócio relevantes:**
- Trial é **one-shot**: verificado via `trialStart !== null`. Se já usado, `startTrialUseCase` lança erro.
- `createSubscriptionUseCase` faz **upsert** — não limpa `trialStart/trialEnd` existentes (trial é preservado).
- A integração real com AbacatePay (geração de billing URL) permanece nos handlers Next (`subscriptions.handler.ts`), pois é específica de framework.

---

### Gyms — `lib/use-cases/gyms/index.ts`

| Função | Descrição |
|--------|-----------|
| `listGymsUseCase` | Lista academias do usuário com status de assinatura |
| `createGymUseCase` | Cria academia + GymProfile + GymStats + define como ativa |
| `getGymProfileUseCase` | Verifica se o perfil está completo (name, address, phone, email) |
| `setActiveGymUseCase` | Define academia ativa no User + atualiza GymUserPreference |
| `getGymLocationsUseCase` | Busca academias públicas ativas com distância calculada e `openNow` |

**Regras de negócio relevantes:**
- `createGymUseCase`: a segunda academia só pode ser criada se houver uma com `status === "active"` (não trial). Lança erro claro caso contrário.
- `getGymLocationsUseCase` usa a Fórmula de Haversine para calcular distâncias, ordena por proximidade quando lat/lng são fornecidos.
- `openNow` determina se a academia está aberta baseado nos dias e horários em `openingHours` (JSON do banco).

---

## Fluxo de autenticação e contexto

### Elysia (servidor Bun)
```
Route Plugin → elysiaAuthPlugin → injeta ctx.studentId / ctx.userId
  → Handler recebe { set, body, studentId, userId }
  → Chama use case
```

### Next.js (API Routes)
```
NextRequest → requireStudent(request) → { user: { student, ... } }
  → auth.user.student!.id = studentId
  → Chama use case
```

---

## Tratamento de erros — Convenções

| Cenário | Comportamento |
|---------|---------------|
| Entidade não encontrada | Use case lança `Error("X não encontrado")` → handler mapeia para `notFoundResponse` |
| Regra de negócio violada | Use case lança `Error("mensagem clara")` → handler mapeia para `badRequestResponse` |
| Erro inesperado / DB | Deixa propagar → handler captura no catch e chama `internalErrorResponse` |
| Operação idempotente (delete) | Ignora `P2025` (Prisma record not found) silenciosamente |

---

## Estrutura de pastas completa

```
lib/use-cases/
├── README.md
├── auth/                        # autenticação (Better Auth)
├── students/
│   ├── add-weight.ts
│   ├── get-day-passes.ts
│   ├── get-friends.ts
│   ├── get-personal-records.ts
│   ├── get-profile.ts
│   ├── get-progress.ts
│   ├── get-student-info.ts
│   ├── get-weight-history.ts
│   ├── update-profile.ts
│   └── update-progress.ts
├── workouts/
│   ├── complete-workout.ts
│   ├── delete-workout-progress.ts
│   ├── get-units.ts
│   ├── get-weekly-plan.ts
│   ├── get-workout-history.ts
│   ├── get-workout-progress.ts
│   ├── save-workout-progress.ts
│   ├── streak.ts
│   └── update-exercise-log.ts
├── nutrition/
│   ├── get-daily-nutrition.ts
│   ├── search-foods.ts
│   └── update-daily-nutrition.ts
├── subscriptions/
│   └── index.ts                 # get, create, startTrial, cancel, activatePremium
└── gyms/
    └── index.ts                 # list, create, getProfile, setActive, getLocations
```

---

## Decisões de design (ADRs resumidos)

### ADR-1: Use cases como funções puras exportadas (não classes)
**Decisão:** Funções async simples, não classes com injeção de dependência.  
**Motivo:** O projeto usa Prisma como singleton global (`lib/db.ts`), não há necessidade de IoC container. Funções são mais simples, testáveis com mocks de módulo e mais idiomáticas no ecossistema TS/Node.

### ADR-2: Handlers Elysia e Next mantidos separados
**Decisão:** Dois adaptadores distintos — `server/handlers/` (Elysia) e `lib/api/handlers/` (Next.js).  
**Motivo:** O contexto de request/auth estruturalmente diferente (Elysia Context vs NextRequest) justifica adaptadores separados. O use case é compartilhado, os adaptadores são específicos de framework.

### ADR-3: Lógica Next.js específica não migrada para use cases
**Decisão:** `subscriptions.handler.ts` (Next) manteve integração AbacatePay inline.  
**Motivo:** A criação de billing URL envolve chamadas HTTP externas e é específica do contexto Next (server actions). Um use case genérico seria mais complexo sem benefício imediato.

### ADR-4: Aplicação 100% online
**Decisão:** Toda infraestrutura offline (`lib/offline`, IndexedDB queue, SyncManager) foi removida.  
**Motivo:** Complexidade operacional alta, baixo uso real, e conflitos com o modelo de dados Prisma/Postgres. Erros de rede agora são surfaced imediatamente ao usuário.
