# 🤖 Chat de IA na Plataforma GymRats – Documentação Completa

Este documento descreve o **fluxo completo de ponta a ponta** do uso de chat com IA na plataforma GymRats: APIs, documentação, regras, componentes, páginas e integrações.

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura e Stack](#2-arquitetura-e-stack)
3. [Fluxos de Chat](#3-fluxos-de-chat)
4. [APIs e Endpoints](#4-apis-e-endpoints)
5. [Componentes e Páginas](#5-componentes-e-páginas)
6. [Regras de Negócio](#6-regras-de-negócio)
7. [Prompts e Parsers](#7-prompts-e-parsers)
8. [Modelo de Dados](#8-modelo-de-dados)
9. [Segurança e Limites](#9-segurança-e-limites)
10. [Referências e Documentação Relacionada](#10-referências-e-documentação-relacionada)
11. [Performance e Latência](#11-performance-e-latência)

---

## 1. Visão Geral

A plataforma GymRats utiliza **DeepSeek** como provedor de IA para duas funcionalidades principais:

| Funcionalidade | Descrição | Localização |
|----------------|-----------|-------------|
| **Chat de Nutrição** | Usuário descreve o que comeu em linguagem natural; a IA extrai alimentos, quantidades e macros e adiciona automaticamente na dieta | Dieta / Nutrition Tracker |
| **Chat de Treinos** | Usuário conversa sobre objetivos, restrições e preferências; a IA gera ou edita treinos personalizados | Edição de Unit (semana de treino) |

Ambas são **recursos premium** (assinatura ou trial ativo) e compartilham o mesmo limite de **20 mensagens por dia**.

---

## 2. Arquitetura e Stack

### 2.1 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js + React)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  FoodSearch (se premium)     │  EditUnitModal                               │
│  └─ FoodSearchChat           │  └─ WorkoutChat                             │
│     - Input de mensagem       │     - Input de mensagem                      │
│     - Histórico de conversa   │     - Histórico + referências                 │
│     - Preview de alimentos    │     - Preview de workouts (SSE)              │
│     - Tokens em tempo real    │     - Tokens em tempo real                  │
└──────────────┬───────────────┴──────────────────┬──────────────────────────┘
               │                                    │
               │ POST /api/nutrition/chat-stream    │ POST /api/workouts/chat-stream
               │ (SSE streaming)                    │ (SSE streaming)
               ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API ROUTES (Next.js App Router)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. requireStudent (auth)                                                   │
│  2. Verificar Premium/Trial (subscription)                                   │
│  3. Rate limit (NutritionChatUsage, 20/dia)                                   │
│  4. Construir prompt contextualizado                                         │
│  5. Chamar DeepSeek API (lib/ai/client.ts)                                    │
│  6. Parsear resposta (parsers)                                               │
│  7. Incrementar messageCount                                                  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         lib/ai/client.ts (DeepSeek)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  - Cache em memória (hash do prompt, TTL 1h)                                 │
│  - Timeout 50s                                                               │
│  - Retry para rate limit (chatCompletionWithRetry)                           │
│  - Modelo: deepseek-chat                                                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DeepSeek API (https://api.deepseek.com)                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Stack Técnica

- **Provedor de IA**: DeepSeek (`deepseek-chat`)
- **Cliente**: `lib/ai/client.ts` – fetch nativo, sem SDK
- **Cache**: `lib/ai/cache.ts` – em memória, TTL 1h
- **Variável de ambiente**: `DEEPSEEK_API_KEY`

---

## 3. Fluxos de Chat

### 3.1 Chat de Nutrição

**Entrada**: Usuário clica em "Adicionar alimento" em uma refeição na página de dieta.

**Fluxo**:
1. `diet-page.tsx` abre modal `FoodSearch` com `mealId` (se clicou em refeição específica)
2. `FoodSearch` verifica `subscription` via `useStudent("subscription")`
3. Se premium: renderiza `FoodSearchChat` (substitui busca manual)
4. Usuário digita mensagem (ex: "Comi arroz, feijão e frango no almoço")
5. `FoodSearchChat` chama `POST /api/nutrition/chat-stream` (SSE)
6. API envia tokens em tempo real → evento `complete` com `{ foods, message, ... }`
7. Componente exibe alimentos extraídos; usuário confirma "Adicionar"
8. `handleConfirmAdd` adiciona alimentos ao store e fecha modal

**Arquivos**:
- Página: `app/student/diet/diet-page.tsx`
- Modal: `components/organisms/modals/food-search.tsx`
- Chat: `components/organisms/modals/food-search-chat.tsx`
- API: `app/api/nutrition/chat-stream/route.ts` (principal) ou `app/api/nutrition/chat/route.ts` (fallback JSON)

### 3.2 Chat de Treinos

**Entrada**: Usuário abre modal de edição de Unit e clica em "Chat IA".

**Fluxo**:
1. `EditUnitModal` exibe botão "Chat IA" (Sparkles)
2. Ao clicar, abre `WorkoutChat` com `unitId` e `workouts` atuais
3. Usuário digita comando (ex: "Monte um treino ABCD" ou "Troca extensora por leg press no treino de pernas")
4. `WorkoutChat` chama `POST /api/workouts/chat-stream` (SSE)
5. API envia eventos: `status` → `workout_progress` (um por workout) → `complete`
6. Componente exibe preview dos workouts; usuário aprova
7. `handleApprove` chama `POST /api/workouts/process` com `parsedPlan` e `unitId`
8. API processa comandos (criar/editar/deletar) e persiste no banco

**Arquivos**:
- Modal: `components/organisms/modals/edit-unit-modal.tsx`
- Chat: `components/organisms/modals/workout-chat.tsx`
- API Chat: `app/api/workouts/chat-stream/route.ts` (SSE) ou `app/api/workouts/chat/route.ts` (JSON)
- API Process: `app/api/workouts/process/route.ts`

**Nota**: Ambos os chats (nutrição e treino) usam **streaming** para UX instantânea. A rota `/api/workouts/chat` existe para uso alternativo (ex.: Elysia server).

---

## 4. APIs e Endpoints

### 4.1 POST /api/nutrition/chat-stream (recomendado)

**Descrição**: Processa mensagem de nutrição com **streaming** – tokens chegam em tempo real (UX instantânea).

**Eventos SSE**:
- `status`: `{ status, message }` – ex.: "Consultando IA..."
- `token`: `{ delta }` – cada token da resposta (usuário vê texto aparecendo)
- `complete`: `{ foods, message, needsConfirmation, remainingMessages }` – resultado final
- `error`: `{ error }` – erro

**Request**: Mesmo do `/api/nutrition/chat`.

---

### 4.2 POST /api/nutrition/chat (fallback)

**Descrição**: Versão sem streaming – retorna JSON completo. Usar apenas se chat-stream não estiver disponível.

**Autenticação**: `requireStudent` (cookie ou Bearer token)

**Request**:
```json
{
  "message": "string",
  "conversationHistory": [{ "role": "user" | "assistant", "content": "string" }],
  "existingMeals": [{ "type": "string", "name": "string" }],
  "selectedMeal": { "id": "string", "type": "string", "name": "string" }
}
```

**Response**:
```json
{
  "foods": [
    {
      "name": "string",
      "servings": 1,
      "mealType": "lunch",
      "calories": 130,
      "protein": 2.7,
      "carbs": 28,
      "fats": 0.3,
      "servingSize": "100g",
      "category": "carbs",
      "confidence": 0.9
    }
  ],
  "message": "string",
  "needsConfirmation": false,
  "remainingMessages": 19
}
```

**Erros**:
- `401`: Não autenticado
- `403`: Não premium
- `429`: Limite diário atingido (20 mensagens)
- `500`: Erro ao processar

**Config**: `maxDuration = 60`, `runtime = "nodejs"`

---

### 4.3 POST /api/workouts/chat

**Descrição**: Processa mensagem de treino e retorna comando estruturado (JSON). Usado quando não há necessidade de streaming.

**Request**:
```json
{
  "message": "string",
  "conversationHistory": [...],
  "unitId": "string",
  "existingWorkouts": [...],
  "profile": { ... }
}
```

**Response**:
```json
{
  "intent": "create" | "edit" | "delete",
  "action": "create_workouts" | "update_workout" | "replace_exercise" | ...,
  "workouts": [...],
  "targetWorkoutId": "string",
  "message": "string",
  "remainingMessages": 19
}
```

---

### 4.4 POST /api/workouts/chat-stream

**Descrição**: Mesmo processamento do chat, mas com **Server-Sent Events** para feedback progressivo.

**Eventos SSE**:
- `status`: `{ status, message }` – ex.: "Consultando IA...", "Processando resposta..."
- `workout_progress`: `{ workout, index, total }` – um evento por workout gerado
- `complete`: `{ ...parsedPlan, remainingMessages }` – resultado final
- `error`: `{ error, message? }` – erro

**Request**: Mesmo body do `/api/workouts/chat`.

---

### 4.5 POST /api/workouts/process

**Descrição**: Processa o plano de treino retornado pela IA e persiste no banco (criar/editar/deletar workouts e exercícios).

**Request**:
```json
{
  "parsedPlan": {
    "intent": "create" | "edit" | "delete",
    "action": "create_workouts" | "update_workout" | ...,
    "workouts": [...],
    "targetWorkoutId": "string",
    ...
  },
  "unitId": "string"
}
```

**Response**: Dados atualizados da unit (workouts, exercises).

---

## 5. Componentes e Páginas

### 5.1 Mapa de Componentes

| Componente | Caminho | Responsabilidade |
|------------|---------|------------------|
| `FoodSearch` | `components/organisms/modals/food-search.tsx` | Gate: se premium → `FoodSearchChat`, senão busca manual |
| `FoodSearchChat` | `components/organisms/modals/food-search-chat.tsx` | UI do chat de nutrição, chamada à API, confirmação e adição |
| `EditUnitModal` | `components/organisms/modals/edit-unit-modal.tsx` | Modal de edição de Unit, botão "Chat IA" |
| `WorkoutChat` | `components/organisms/modals/workout-chat.tsx` | UI do chat de treinos, SSE, preview, aprovação |
| `WorkoutPreviewCard` | `components/organisms/modals/workout-preview-card.tsx` | Card de preview de workout com referências |

### 5.2 Páginas de Entrada

| Página | Rota | Como abre o chat |
|--------|------|------------------|
| Dieta | `/student?tab=diet` | Clicar em "Adicionar alimento" em uma refeição → `FoodSearch` |
| Dieta (card) | `NutritionStatusCard` | Clicar em "Adicionar" → navega para `?tab=diet&modal=food-search` |
| Treinos | Modal `editUnit` | Clicar em "Chat IA" ao lado de "Adicionar Dia" |

### 5.3 Verificação de Premium no Frontend

- **Nutrição**: `FoodSearch` usa `useStudent("subscription")` e, se premium, renderiza `FoodSearchChat` em vez da busca manual.
- **Treinos**: O botão "Chat IA" é exibido para todos; a API retorna `403` se não for premium. (Opcional: adicionar verificação no frontend para esconder o botão.)

---

## 6. Regras de Negócio

### 6.1 Premium e Trial

- **Condição**: `subscription.plan === "premium"` e `status` em `["active", "trialing"]` ou `trialEnd` no futuro.
- **Fonte**: `db.subscription` por `studentId`.
- **Fallback**: `GymMembership` ativo com academia premium também concede acesso.

### 6.2 Rate Limiting

- **Limite**: 20 mensagens por dia (nutrição + treinos compartilhados).
- **Modelo**: `NutritionChatUsage` – um registro por `(studentId, date)` com `messageCount`.
- **Exceção**: Usuários `ADMIN` não têm limite em ambos os chats (nutrição e treino).

### 6.3 Importação Direta de Treinos

- Se a mensagem começa com `{` ou `[`, a API tenta parsear como JSON de treino.
- Estruturas aceitas: `{ workouts: [...] }`, `[...]`, `{ exercises: [...] }`.
- Não consome chamada à IA.

### 6.4 Referências no Chat de Treinos

- Usuário pode referenciar um treino ou exercício específico (ex.: "[Referenciando treino: 'Pernas - Quadríceps'] troca extensora por leg press").
- O prompt é enriquecido com `reference` e `previewWorkouts` para a IA modificar apenas o alvo.
- A API normaliza a resposta para manter consistência (ex.: nunca criar 6º treino quando há 5).

---

## 7. Prompts e Parsers

### 7.1 Prompts

| Arquivo | Constante | Uso |
|---------|-----------|-----|
| `lib/ai/prompts/nutrition.ts` | `NUTRITION_SYSTEM_PROMPT` | Chat de nutrição |
| `lib/ai/prompts/nutrition.ts` | `NUTRITION_INITIAL_MESSAGE` | Mensagem inicial do chat |
| `lib/ai/prompts/workout.ts` | `WORKOUT_SYSTEM_PROMPT` | Chat de treinos |
| `lib/ai/prompts/workout.ts` | `WORKOUT_INITIAL_MESSAGE` | Mensagem inicial do chat |

**Enriquecimento dinâmico**:
- Nutrição: refeições existentes, refeição selecionada como padrão.
- Treinos: workouts existentes, perfil do student, referência (workout/exercício), previews.

### 7.2 Parsers

| Arquivo | Função | Retorno |
|---------|--------|---------|
| `lib/ai/parsers/nutrition-parser.ts` | `parseNutritionResponse(response)` | `ParsedNutritionResponse` |
| `lib/ai/parsers/nutrition-parser.ts` | `parsedFoodToFoodItem(parsedFood)` | `FoodItem` |
| `lib/ai/parsers/workout-parser.ts` | `parseWorkoutResponse(response)` | `ParsedWorkoutResponse` |

Ambos extraem JSON da resposta (regex `/\{[\s\S]*\}/`), tentam reparar JSON truncado quando o parse falha, e validam/normalizam a estrutura. O parser de treinos normaliza tipos (full-body→strength), dificuldade e grupo muscular.

---

## 8. Modelo de Dados

### 8.1 NutritionChatUsage

```prisma
model NutritionChatUsage {
  id          String   @id @default(cuid())
  studentId   String
  student     Student  @relation(...)
  date        DateTime @default(now())
  messageCount Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([studentId, date])
  @@index([studentId, date])
  @@map("nutrition_chat_usage")
}
```

- **Uso**: Contagem de mensagens de chat (nutrição + treinos) por dia.
- **Migração**: `scripts/migration/apply-nutrition-chat-usage-migration.js`

---

## 9. Segurança e Limites

### 9.1 Autenticação

- Todas as rotas de chat usam `requireStudent` de `lib/api/middleware/auth.middleware.ts`.
- Suporta: cookie `auth_token`, `better-auth.session_token`, header `Authorization: Bearer <token>`.

### 9.2 Validação de Entrada

- `message` obrigatório e string.
- `unitId` obrigatório para rotas de treino.
- Unit deve pertencer ao `studentId`.

### 9.3 Variáveis de Ambiente

```env
DEEPSEEK_API_KEY=sk-...
```

### 9.4 Timeouts e Retry

- **Cliente**: timeout 50s (menor que `maxDuration` da rota).
- **Retry**: `chatCompletionWithRetry` – até 3 tentativas para erros 429/rate limit, com backoff exponencial.

---

## 10. Referências e Documentação Relacionada

| Documento | Conteúdo |
|-----------|----------|
| `docs/IA_GUIDE.md` | Guia geral para IA no projeto, ordem de pensamento, onde buscar contexto |
| `docs/agno/PLANO_IMPLEMENTACAO_CHAT_IA.md` | Plano original de implementação, custos, exemplos |
| `docs/agno/ESTUDO_LLMS_FULL.md` | Estudo de modelos, custos e decisões de LLM |
| `docs/api/API_COMPLETA.md` | Panorama geral das rotas de API |
| `docs/ARQUITETURA_COMPLETA_SISTEMA.md` | Arquitetura offline-first, command pattern, sync |
| `docs/nuqsmodals/NUQS_MODAIS_COMPLETO.md` | Modais via nuqs (food-search, editUnit) |

### Rotas Elysia (Server Custom)

O projeto também possui um servidor Elysia com handlers equivalentes:

- `server/handlers/nutrition-ai.ts` – chat de nutrição
- `server/handlers/workouts-ai.ts` – `chatWorkoutsHandler`, `chatStreamWorkoutsHandler`
- `server/routes/workouts.ts` – registro das rotas

Essas rotas são usadas quando o app roda com o custom server (Bun + Elysia). As rotas Next.js (`app/api/...`) são usadas no deploy padrão (ex.: Vercel).

---

## 11. Performance e Latência

Esta seção documenta **suspeitos reais** de lentidão e **otimizações recomendadas** com base na arquitetura atual.

### 11.1 Suspeitos por Probabilidade

| # | Suspeito | Impacto | Descrição |
|---|----------|---------|-----------|
| 🔴 1 | **DeepSeek + Infra + Região** | Alto | Modelo `deepseek-chat` + rota BR → US → possivelmente Asia. Latência normal 2–8s, pico 10–20s. +300–800ms base por região. |
| 🔴 2 | **Nutrition sem streaming** | Alto (UX) | Nutrição retorna JSON completo; Workout usa SSE. Mesmo tempo real, **percepção** é diferente: streaming = instantâneo, JSON = espera total. |
| 🔴 3 | **Timeout 50s + Retry 3x** | Médio | Em 429: retry → espera → retry → espera. Pode virar 5s → 15s → 40s sem feedback claro. |
| 🔴 4 | **Parser regex JSON** | Baixo–Médio | `/\{[\s\S]*\}/` em resposta grande pode causar backtracking, CPU spike e 500ms–2s extra no event loop. |
| 🔴 5 | **Prompt grande** | Alto | Injeção de `conversationHistory`, `existingMeals`, `profile`, `preview`, `references`. Se > 3k tokens → latência explode. |

### 11.2 Insight Principal: UX > Latência Real

> **Streaming em nutrição** faria parecer ~3x mais rápido, mesmo com backend igual.

### 11.3 Testes Recomendados

| Teste | O que medir | Onde |
|-------|-------------|------|
| **A – Latência pura** | `request start → first byte` e `request start → end` | `lib/ai/client.ts` |
| **B – Tokens** | `prompt_tokens`, `completion_tokens` | Resposta DeepSeek API |
| **C – Retry** | `attempt number` em retries | `chatCompletionWithRetry` |

**Gargalo provável**: prompt > 2000 tokens.

### 11.4 Otimizações por Impacto (custo x benefício)

| Prioridade | Otimização | Impacto |
|------------|------------|---------|
| 🥇 | **Converter Nutrition → Streaming** | Percepção ~3x mais rápido |
| 🥈 | **Resumir histórico** | Manter últimas 4 mensagens + summary do resto |
| 🥉 | **Limitar output tokens** | Ex.: `max_tokens: 400` na chamada DeepSeek |
| 🧠 Pro | **Resposta em 2 fases** | Fase 1: modelo rápido extrai comida básica → Fase 2: modelo lento ajusta macros. Usuário sente instantâneo. |

### 11.5 Cache TTL 1h – Suspeita

- Chat raramente repete prompt idêntico.
- Cache pode estar **quase inútil** e só consumir memória.
- Avaliar: logs de cache hit vs miss; considerar reduzir TTL ou desativar se hit rate < 5%.

### 11.6 Aposta (combinação mais provável)

1. Infra DeepSeek / fila
2. Nutrição sem streaming
3. Prompt grande
4. Retry invisível em 429

### 11.7 Recomendações Pragmáticas

| Área | Ação |
|------|------|
| **Nutrição** | Streaming obrigatório, modelo menor, output curto |
| **Treino** | Manter streaming, considerar modelo melhor se necessário |
| **Parser** | Avaliar regex vs `JSON.parse` com fallback para extração segura |
| **Prompts** | Monitorar tamanho; limitar `conversationHistory` a 4–6 mensagens |

### 11.8 Boas Práticas DeepSeek (docs oficiais)

Baseado em [JSON Output](https://api-docs.deepseek.com/guides/json_mode) e [Context Caching](https://api-docs.deepseek.com/guides/kv_cache):

| Recomendação | Implementação |
|--------------|---------------|
| **JSON mode**: incluir "json" no prompt + exemplo concreto | ✅ Prompts com `exampleOutput` e `instruction` |
| **max_tokens** para evitar truncamento | ✅ 1024 (nutrição), 4096 (treino) |
| **Context Caching**: prefixo estável para cache hit | System prompt base estável; contexto dinâmico (meals, workouts) no final |
| **Resposta vazia**: API pode retornar empty content | Tratar no parser; considerar retry |

**Context Caching** (DeepSeek server-side, automático):
- Cache de disco por prefixo; mensagens iniciais reutilizadas em conversas multi-turno
- `prompt_cache_hit_tokens` e `prompt_cache_miss_tokens` na resposta
- Unidade mínima: 64 tokens; best-effort

### 11.9 Otimizações Implementadas (2025-02)

| Otimização | Status | Impacto |
|------------|--------|---------|
| **Streaming DeepSeek** | ✅ `chatCompletionStream` em `lib/ai/client.ts` | TTFT ~200-500ms vs 5-10s |
| **Nutrition chat-stream** | ✅ `/api/nutrition/chat-stream` + FoodSearchChat | UX instantânea |
| **Workout streaming** | ✅ chat-stream usa `chatCompletionStream` | Tokens chegam progressivamente |
| **max_tokens** | ✅ 1024 (nutrição), 4096 (treino) | Evita truncamento em treinos complexos |
| **Limite conversationHistory** | ✅ 4 msgs (nutrição), 6 msgs (treino) | Reduz prompt tokens |

---

**Documento criado em**: 2025-02-17  
**Última atualização**: 2025-02-17
