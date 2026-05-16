# Refatoração das APIs - Bun + Elysia

## Resumo

Refatoração das APIs do GymRats para otimização com Bun e Elysia, mantendo **contratos inalterados** (request/response idênticos).

---

## Auditoria de Performance e Robustez (Fev 2025)

### Correções Críticas
- **`/api/exercises/search`** estava retornando 404 (rota ausente no Elysia). Adicionada em `server/routes/exercises.ts` e `server/handlers/exercises.ts`.
- **`searchFoodsHandler`** usava `query` em vez de `q` do schema; adicionados `category` e `limit` conforme contrato.

### Otimizações de Performance
- **getDailyNutritionHandler**: `profile` e `dailyNutrition` agora em `Promise.all` (queries paralelas).
- **updateDailyNutritionHandler**: toda a operação em `db.$transaction` para atomicidade e rollback em falha.
- **uploadFoodsHandler**: `fs.readFileSync` → `fs.promises.readFile` (não bloqueia event loop); `parseInt` com radix e clamp seguro.

## Ordem de Execução (por importância)

1. ✅ **students** - Concluído
2. ✅ **workouts** - Concluído
3. ✅ **users** - Concluído
4. ✅ **nutrition** - Concluído
5. ✅ **foods** - Concluído
6. ✅ **gym-subscriptions** - Concluído
7. ✅ **gyms** - Concluído
8. ✅ **memberships** - Concluído
9. ✅ **payments** - Concluído
10. ✅ **payment-methods** - Concluído

---

## Mudanças Aplicadas

### 1. Utilitários Novos (`server/utils/json.ts`)

- `parseJsonSafe<T>()` - Parse seguro de JSON com fallback para `null`
- `parseJsonArray<T>()` - Parse seguro retornando array (ou `[]`)

**Objetivo:** Evitar `JSON.parse` direto que pode lançar exceção em dados malformados.

### 2. Students (`server/handlers/students.ts`)

- Função `formatProfileResponse()` extraída para reduzir duplicação
- Substituição de `JSON.parse` por `parseJsonSafe` / `parseJsonArray`
- Documentação Swagger nas rotas principais
- Contrato de resposta preservado

### 3. Workouts (`server/handlers/workouts.ts`)

- Substituição de `JSON.parse` por `parseJsonSafe` / `parseJsonArray` em:
  - `exerciseLogs`, `skippedExercises`, `selectedAlternatives`
  - `sets` em exercise logs
  - `bodyPartsFatigued`

### 4. Users (`server/routes/users.ts`)

- **SEGURANÇA:** `auth: true` + validação no handler
  - Usuário pode atualizar **seu próprio** role (onboarding)
  - ADMIN pode atualizar **qualquer** usuário
  - Caso contrário: 403 Forbidden
- Documentação Swagger adicionada

### 5. Gyms (`server/handlers/gyms.ts`)

- Substituição de `JSON.parse` por `parseJsonSafe` / `parseJsonArray` em:
  - `amenities`, `openingHours`, `photos`
- Documentação Swagger em todas as rotas

### 6. Nutrition, Foods, Gym-Subscriptions, Memberships, Payments, Payment-Methods

- Documentação Swagger (`detail.summary`, `detail.description`) em todas as rotas
- Contratos preservados

---

## Compatibilidade

- **Frontend:** Nenhuma alteração necessária
- **apiClient:** Continua funcionando normalmente
- **Respostas:** Formato idêntico ao anterior

---

## Atenção: Users Update-Role

A rota `POST /api/users/update-role` agora exige **autenticação**. Regras:
- **Self-update:** Usuário pode alterar seu próprio role (fluxo de onboarding)
- **Admin:** Usuário ADMIN pode alterar o role de qualquer usuário
- Chamadas sem auth retornam **401**
- Tentativa de alterar outro usuário (não-admin) retorna **403**

---

---

## Request Logger (Monitoramento)

Plugin global em `server/plugins/request-logger.ts` que registra **todas** as requisições `/api` e `/health`.

**Logs estruturados (JSON) – ex.:**
```json
{"ts":"2025-02-01T12:00:00.000Z","level":"info","method":"GET","path":"/api/students/profile","status":200,"latencyMs":45,"userId":"clx...","studentId":"clx...","userAgent":"...","ip":"..."}
```

**Campos:**
- `ts` – ISO timestamp
- `method`, `path`, `query`
- `status` – HTTP status
- `latencyMs` – tempo de processamento
- `userId`, `studentId` – quando autenticado
- `userAgent`, `ip` – headers do cliente
- `error`, `code` – em erros

Logs assíncronos (`queueMicrotask`) para não bloquear o event loop.

---

## Próximos Passos (Opcionais)

1. **Validação Elysia nativa:** Usar `body: schema` e `query: schema` com Zod nas rotas (reduz boilerplate)
2. **Promise.all em getAllStudentData:** Paralelizar queries independentes quando múltiplas seções forem solicitadas
3. **Rate limiting:** Plugin Elysia para proteção contra abuso
4. **Tipagem mais forte:** Remover `as any` restantes nos handlers
