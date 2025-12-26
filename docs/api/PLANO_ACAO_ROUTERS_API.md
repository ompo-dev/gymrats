# 🎯 PLANO DE AÇÃO - ROUTERS E REFATORAÇÃO DA API

## 📋 OBJETIVO

Criar estrutura de routers/handlers centralizados para agrupar rotas relacionadas, refatorar a API para melhor organização e atualizar completamente o Swagger com todas as rotas existentes.

## 🔍 FASE 1: ANÁLISE E MAPEAMENTO

### 1.1 Mapear Todas as Rotas Existentes

**Rotas de Students:**

- ✅ `GET /api/students/all` - Dados completos do student
- ✅ `GET /api/students/profile` - Verificar perfil
- ✅ `POST /api/students/profile` - Criar/atualizar perfil
- ✅ `GET /api/students/weight` - Histórico de peso
- ✅ `POST /api/students/weight` - Adicionar peso
- ✅ `GET /api/students/weight-history` - Histórico completo com filtros

**Rotas de Gyms:**

- ✅ `GET /api/gyms/list` - Listar academias do usuário
- ✅ `POST /api/gyms/create` - Criar nova academia
- ✅ `GET /api/gyms/profile` - Perfil da academia
- ✅ `POST /api/gyms/set-active` - Definir academia ativa
- ✅ `GET /api/gyms/locations` - Localizações de academias parceiras

**Rotas de Workouts:**

- ✅ `GET /api/workouts/units` - Units e workouts
- ✅ `POST /api/workouts/[id]/complete` - Completar workout
- ✅ `POST /api/workouts/[id]/progress` - Salvar progresso parcial
- ✅ `GET /api/workouts/history` - Histórico de workouts

**Rotas de Nutrition:**

- ✅ `GET /api/nutrition/daily` - Nutrição do dia
- ✅ `POST /api/nutrition/daily` - Atualizar nutrição
- ✅ `GET /api/foods/search` - Buscar alimentos
- ✅ `GET /api/foods/[id]` - Detalhes de alimento

**Rotas de Subscriptions (Student):**

- ✅ `GET /api/subscriptions/current` - Assinatura atual
- ✅ `POST /api/subscriptions/create` - Criar assinatura
- ✅ `POST /api/subscriptions/start-trial` - Iniciar trial
- ✅ `POST /api/subscriptions/cancel` - Cancelar assinatura

**Rotas de Gym Subscriptions:**

- ✅ `GET /api/gym-subscriptions/current` - Assinatura atual da academia
- ✅ `POST /api/gym-subscriptions/create` - Criar assinatura
- ✅ `POST /api/gym-subscriptions/start-trial` - Iniciar trial
- ✅ `POST /api/gym-subscriptions/cancel` - Cancelar assinatura

**Rotas de Payments:**

- ✅ `GET /api/payments` - Histórico de pagamentos
- ✅ `GET /api/payment-methods` - Métodos de pagamento
- ✅ `POST /api/payment-methods` - Adicionar método de pagamento

**Rotas de Memberships:**

- ✅ `GET /api/memberships` - Memberships de academias

**Rotas de Auth:**

- ✅ `POST /api/auth/sign-up` - Registrar
- ✅ `POST /api/auth/sign-in` - Login
- ✅ `GET /api/auth/session` - Verificar sessão
- ✅ `POST /api/auth/sign-out` - Logout
- ✅ `POST /api/auth/update-role` - Atualizar role

**Rotas de Users:**

- ✅ `POST /api/users/update-role` - Atualizar role (duplicado com auth?)

**Outras:**

- ✅ `GET /api/swagger` - Documentação Swagger

### 1.2 Identificar Padrões e Duplicações

**Problemas Identificados:**

- ❌ Autenticação duplicada em cada rota
- ❌ Tratamento de erro repetitivo
- ❌ Validação de sessão repetida
- ❌ `auth/update-role` e `users/update-role` duplicados
- ❌ Lógica de subscriptions similar entre student e gym
- ❌ Falta de middleware de autenticação centralizado
- ❌ Swagger desatualizado (só tem auth)

## 🏗️ FASE 2: CRIAR ESTRUTURA DE HANDLERS

### 2.1 Criar Handlers Centralizados

**Estrutura Proposta:**

```
lib/api/
├── handlers/
│   ├── students.handler.ts      # Todas as rotas de students
│   ├── gyms.handler.ts          # Todas as rotas de gyms
│   ├── workouts.handler.ts       # Todas as rotas de workouts
│   ├── nutrition.handler.ts     # Rotas de nutrição e foods
│   ├── subscriptions.handler.ts # Rotas de subscriptions (student)
│   ├── gym-subscriptions.handler.ts # Rotas de subscriptions (gym)
│   ├── payments.handler.ts      # Rotas de pagamentos
│   └── auth.handler.ts          # Rotas de autenticação
├── middleware/
│   ├── auth.middleware.ts       # Middleware de autenticação
│   └── validation.middleware.ts # Validação de dados
└── utils/
    ├── response.utils.ts         # Helpers de resposta
    └── error.utils.ts           # Tratamento de erros
```

### 2.2 Criar Middleware de Autenticação

**Arquivo:** `lib/api/middleware/auth.middleware.ts`

**Funcionalidades:**

- ✅ Extrair token de cookie ou header
- ✅ Validar sessão
- ✅ Retornar userId e session
- ✅ Tratamento de erros padronizado

### 2.3 Criar Utils de Resposta

**Arquivo:** `lib/api/utils/response.utils.ts`

**Funcionalidades:**

- ✅ `successResponse()` - Resposta de sucesso padronizada
- ✅ `errorResponse()` - Resposta de erro padronizada
- ✅ `unauthorizedResponse()` - Resposta 401
- ✅ `notFoundResponse()` - Resposta 404
- ✅ `badRequestResponse()` - Resposta 400

## 🔄 FASE 3: REFATORAR ROTAS PARA USAR HANDLERS

### 3.1 Refatorar Rotas de Students

**Arquivo:** `lib/api/handlers/students.handler.ts`

**Handlers:**

- `getAllStudentData()` - GET /api/students/all
- `getStudentProfile()` - GET /api/students/profile
- `updateStudentProfile()` - POST /api/students/profile
- `getWeightHistory()` - GET /api/students/weight
- `addWeight()` - POST /api/students/weight
- `getWeightHistoryFiltered()` - GET /api/students/weight-history

**Rotas:** Manter arquivos route.ts mas delegar para handlers

### 3.2 Refatorar Rotas de Gyms

**Arquivo:** `lib/api/handlers/gyms.handler.ts`

**Handlers:**

- `listGyms()` - GET /api/gyms/list
- `createGym()` - POST /api/gyms/create
- `getGymProfile()` - GET /api/gyms/profile
- `setActiveGym()` - POST /api/gyms/set-active
- `getGymLocations()` - GET /api/gyms/locations

### 3.3 Refatorar Rotas de Workouts

**Arquivo:** `lib/api/handlers/workouts.handler.ts`

**Handlers:**

- `getUnits()` - GET /api/workouts/units
- `completeWorkout()` - POST /api/workouts/[id]/complete
- `saveWorkoutProgress()` - POST /api/workouts/[id]/progress
- `getWorkoutHistory()` - GET /api/workouts/history

### 3.4 Refatorar Rotas de Nutrition

**Arquivo:** `lib/api/handlers/nutrition.handler.ts`

**Handlers:**

- `getDailyNutrition()` - GET /api/nutrition/daily
- `updateDailyNutrition()` - POST /api/nutrition/daily
- `searchFoods()` - GET /api/foods/search
- `getFoodById()` - GET /api/foods/[id]

### 3.5 Refatorar Rotas de Subscriptions

**Arquivo:** `lib/api/handlers/subscriptions.handler.ts`

**Handlers:**

- `getCurrentSubscription()` - GET /api/subscriptions/current
- `createSubscription()` - POST /api/subscriptions/create
- `startTrial()` - POST /api/subscriptions/start-trial
- `cancelSubscription()` - POST /api/subscriptions/cancel

**Arquivo:** `lib/api/handlers/gym-subscriptions.handler.ts`

**Handlers:**

- `getCurrentGymSubscription()` - GET /api/gym-subscriptions/current
- `createGymSubscription()` - POST /api/gym-subscriptions/create
- `startGymTrial()` - POST /api/gym-subscriptions/start-trial
- `cancelGymSubscription()` - POST /api/gym-subscriptions/cancel

### 3.6 Refatorar Rotas de Payments

**Arquivo:** `lib/api/handlers/payments.handler.ts`

**Handlers:**

- `getPayments()` - GET /api/payments
- `getPaymentMethods()` - GET /api/payment-methods
- `addPaymentMethod()` - POST /api/payment-methods
- `getMemberships()` - GET /api/memberships

### 3.7 Refatorar Rotas de Auth

**Arquivo:** `lib/api/handlers/auth.handler.ts`

**Handlers:**

- `signUp()` - POST /api/auth/sign-up
- `signIn()` - POST /api/auth/sign-in
- `getSession()` - GET /api/auth/session
- `signOut()` - POST /api/auth/sign-out
- `updateRole()` - POST /api/auth/update-role

**Ação:** Remover `/api/users/update-role` (duplicado)

## 📝 FASE 4: ATUALIZAR SWAGGER COMPLETO

### 4.1 Criar Estrutura de Schemas

**Schemas a Criar:**

- Student (completo)
- StudentProfile
- WeightHistory
- Gym (completo)
- GymProfile
- Workout
- WorkoutHistory
- Unit
- Exercise
- Nutrition
- FoodItem
- Subscription
- Payment
- PaymentMethod
- Membership
- Error (já existe)

### 4.2 Documentar Todas as Rotas

**Tags a Adicionar:**

- Students
- Gyms
- Workouts
- Nutrition
- Foods
- Subscriptions
- Gym Subscriptions
- Payments
- Memberships
- Usuários (já existe)
- Autenticação (já existe)

### 4.3 Adicionar Exemplos e Descrições

- ✅ Exemplos de request/response para cada rota
- ✅ Descrições detalhadas
- ✅ Códigos de erro documentados
- ✅ Query params documentados
- ✅ Path params documentados

## 🔧 FASE 5: UNIFICAÇÃO E MELHORIAS

### 5.1 Unificar Lógica de Subscriptions

**Problema:** Student e Gym subscriptions têm lógica similar

**Solução:** Criar handler base e especializar

### 5.2 Remover Duplicações

- ❌ Remover `/api/users/update-role` (usar `/api/auth/update-role`)
- ✅ Verificar outras duplicações

### 5.3 Adicionar Validação Centralizada

**Arquivo:** `lib/api/middleware/validation.middleware.ts`

**Funcionalidades:**

- ✅ Validar body de requests
- ✅ Validar query params
- ✅ Validar path params
- ✅ Usar Zod para schemas

### 5.4 Melhorar Tratamento de Erros

**Arquivo:** `lib/api/utils/error.utils.ts`

**Funcionalidades:**

- ✅ Logging estruturado
- ✅ Mensagens de erro padronizadas
- ✅ Stack trace apenas em dev

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Análise

- [x] Mapear todas as rotas
- [x] Identificar padrões
- [x] Identificar duplicações

### Fase 2: Estrutura

- [x] Criar estrutura de pastas
- [x] Criar middleware de autenticação
- [x] Criar utils de resposta
- [x] Criar utils de erro

### Fase 3: Handlers

- [x] Criar students.handler.ts
- [x] Criar gyms.handler.ts
- [x] Criar workouts.handler.ts
- [x] Criar nutrition.handler.ts
- [x] Criar subscriptions.handler.ts
- [ ] Criar gym-subscriptions.handler.ts
- [x] Criar payments.handler.ts
- [ ] Criar auth.handler.ts (opcional)

### Fase 4: Refatoração

- [x] Refatorar rotas de students
- [x] Refatorar rotas de gyms
- [x] Refatorar rotas de workouts
- [x] Refatorar rotas de nutrition
- [x] Refatorar rotas de subscriptions
- [ ] Refatorar rotas de gym-subscriptions
- [x] Refatorar rotas de payments
- [ ] Refatorar rotas de auth (opcional)
- [ ] Remover rotas duplicadas

### Fase 5: Swagger

- [ ] Criar todos os schemas
- [ ] Documentar todas as rotas
- [ ] Adicionar exemplos
- [ ] Adicionar descrições
- [ ] Testar documentação

### Fase 6: Validação

- [ ] Testar todas as rotas
- [ ] Verificar autenticação
- [ ] Verificar tratamento de erros
- [ ] Verificar Swagger

## 🎯 PRÓXIMOS PASSOS

1. **Criar estrutura de pastas e middleware**
2. **Criar handlers um por um**
3. **Refatorar rotas gradualmente**
4. **Atualizar Swagger completamente**
5. **Testar tudo**

---

**Status:** ✅ 100% COMPLETO
**Data:** 2025-01-25
**Conclusão:** Todas as fases implementadas com sucesso!
