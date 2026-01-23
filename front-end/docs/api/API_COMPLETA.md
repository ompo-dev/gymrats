# 📚 Documentação Completa da API - GymRats

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação e Roles](#autenticação-e-roles)
3. [Estrutura de Handlers](#estrutura-de-handlers)
4. [Rotas Disponíveis](#rotas-disponíveis)
5. [Middleware e Utils](#middleware-e-utils)
6. [Swagger e Documentação](#swagger-e-documentação)
7. [Como Testar](#como-testar)

---

## 🎯 Visão Geral

A API do GymRats foi **completamente refatorada** para seguir uma estrutura modular com handlers centralizados, middleware de autenticação e tratamento de erros padronizado.

### Status: ✅ 100% Completo

- ✅ **7 handlers** principais criados
- ✅ **33 funções handler** implementadas
- ✅ **30 rotas** refatoradas
- ✅ **3 arquivos** de middleware/utils
- ✅ Swagger expandido e atualizado

---

## 🔐 Autenticação e Roles

### Sistema de Roles

O sistema usa **apenas `role`** como fonte única da verdade para tipos de usuário.

#### Valores de Role

- `STUDENT`: Usuário é um aluno
- `GYM`: Usuário é uma academia
- `ADMIN`: Usuário é administrador (tem acesso completo a tudo)

#### ADMIN - Acesso Completo

Usuários com `role === "ADMIN"` têm **acesso completo** a todas as funcionalidades:

- ✅ Acesso a todas as rotas de `STUDENT`
- ✅ Acesso a todas as rotas de `GYM`
- ✅ `hasGym: true` (sempre)
- ✅ `hasStudent: true` (sempre)

### Exemplo de Resposta da API

```json
{
  "user": {
    "id": "cmiqt87990004dfvwjr57m352",
    "email": "maicon@gmail.com",
    "name": "Maicon Pereira Barbosa",
    "role": "ADMIN",
    "hasGym": true,
    "hasStudent": true
  },
  "session": {
    "id": "cmjkozycs0005dfkslwoa8ewe",
    "token": "1766621786283-2559cofrqcm-7jzaepuw2ql"
  }
}
```

### Funções Helper

Use as funções em `lib/utils/role.ts`:

- `isStudent(role)`: Verifica se é student ou admin
- `isGym(role)`: Verifica se é gym ou admin
- `isAdmin(role)`: Verifica se é admin
- `roleToUserType(role)`: Converte role para userType (compatibilidade)

---

## 🏗️ Estrutura de Handlers

### Organização

```
lib/api/
├── handlers/
│   ├── students.handler.ts          ✅ 6 handlers
│   ├── gyms.handler.ts              ✅ 5 handlers
│   ├── workouts.handler.ts         ✅ 6 handlers
│   ├── nutrition.handler.ts        ✅ 4 handlers
│   ├── subscriptions.handler.ts    ✅ 4 handlers
│   ├── gym-subscriptions.handler.ts ✅ 4 handlers
│   └── payments.handler.ts         ✅ 4 handlers
├── middleware/
│   └── auth.middleware.ts          ✅ Autenticação centralizada
└── utils/
    ├── response.utils.ts            ✅ Respostas padronizadas
    └── error.utils.ts               ✅ Tratamento de erros
```

### Handlers Implementados

#### Students (`students.handler.ts`)
- ✅ `getAllStudentDataHandler()` - GET /api/students/all
- ✅ `getStudentProfileHandler()` - GET /api/students/profile
- ✅ `updateStudentProfileHandler()` - POST /api/students/profile
- ✅ `getWeightHistoryHandler()` - GET /api/students/weight
- ✅ `addWeightHandler()` - POST /api/students/weight
- ✅ `getWeightHistoryFilteredHandler()` - GET /api/students/weight-history

#### Gyms (`gyms.handler.ts`)
- ✅ `listGymsHandler()` - GET /api/gyms/list
- ✅ `createGymHandler()` - POST /api/gyms/create
- ✅ `getGymProfileHandler()` - GET /api/gyms/profile
- ✅ `setActiveGymHandler()` - POST /api/gyms/set-active
- ✅ `getGymLocationsHandler()` - GET /api/gyms/locations

#### Workouts (`workouts.handler.ts`)
- ✅ `getUnitsHandler()` - GET /api/workouts/units
- ✅ `completeWorkoutHandler()` - POST /api/workouts/[id]/complete
- ✅ `saveWorkoutProgressHandler()` - POST /api/workouts/[id]/progress
- ✅ `getWorkoutProgressHandler()` - GET /api/workouts/[id]/progress
- ✅ `deleteWorkoutProgressHandler()` - DELETE /api/workouts/[id]/progress
- ✅ `getWorkoutHistoryHandler()` - GET /api/workouts/history

#### Nutrition (`nutrition.handler.ts`)
- ✅ `getDailyNutritionHandler()` - GET /api/nutrition/daily
- ✅ `updateDailyNutritionHandler()` - POST /api/nutrition/daily
- ✅ `searchFoodsHandler()` - GET /api/foods/search
- ✅ `getFoodByIdHandler()` - GET /api/foods/[id]

#### Subscriptions (`subscriptions.handler.ts`)
- ✅ `getCurrentSubscriptionHandler()` - GET /api/subscriptions/current
- ✅ `createSubscriptionHandler()` - POST /api/subscriptions/create
- ✅ `startTrialHandler()` - POST /api/subscriptions/start-trial
- ✅ `cancelSubscriptionHandler()` - POST /api/subscriptions/cancel

#### Gym Subscriptions (`gym-subscriptions.handler.ts`)
- ✅ `getCurrentGymSubscriptionHandler()` - GET /api/gym-subscriptions/current
- ✅ `createGymSubscriptionHandler()` - POST /api/gym-subscriptions/create
- ✅ `startGymTrialHandler()` - POST /api/gym-subscriptions/start-trial
- ✅ `cancelGymSubscriptionHandler()` - POST /api/gym-subscriptions/cancel

#### Payments (`payments.handler.ts`)
- ✅ `getPaymentsHandler()` - GET /api/payments
- ✅ `getPaymentMethodsHandler()` - GET /api/payment-methods
- ✅ `addPaymentMethodHandler()` - POST /api/payment-methods
- ✅ `getMembershipsHandler()` - GET /api/memberships

---

## 🛣️ Rotas Disponíveis

### Students (6 rotas)
- ✅ `GET /api/students/all`
- ✅ `GET /api/students/profile`
- ✅ `POST /api/students/profile`
- ✅ `GET /api/students/weight`
- ✅ `POST /api/students/weight`
- ✅ `GET /api/students/weight-history`

### Gyms (5 rotas)
- ✅ `GET /api/gyms/list`
- ✅ `POST /api/gyms/create`
- ✅ `GET /api/gyms/profile`
- ✅ `POST /api/gyms/set-active`
- ✅ `GET /api/gyms/locations`

### Workouts (4 rotas)
- ✅ `GET /api/workouts/units`
- ✅ `POST /api/workouts/[id]/complete`
- ✅ `POST /api/workouts/[id]/progress`
- ✅ `GET /api/workouts/history`

### Nutrition (4 rotas)
- ✅ `GET /api/nutrition/daily`
- ✅ `POST /api/nutrition/daily`
- ✅ `GET /api/foods/search`
- ✅ `GET /api/foods/[id]`

### Subscriptions (4 rotas)
- ✅ `GET /api/subscriptions/current`
- ✅ `POST /api/subscriptions/create`
- ✅ `POST /api/subscriptions/start-trial`
- ✅ `POST /api/subscriptions/cancel`

### Gym Subscriptions (4 rotas)
- ✅ `GET /api/gym-subscriptions/current`
- ✅ `POST /api/gym-subscriptions/create`
- ✅ `POST /api/gym-subscriptions/start-trial`
- ✅ `POST /api/gym-subscriptions/cancel`

### Payments (3 rotas)
- ✅ `GET /api/payments`
- ✅ `GET /api/payment-methods`
- ✅ `POST /api/payment-methods`
- ✅ `GET /api/memberships`

### Auth (5 rotas)
- ✅ `POST /api/auth/sign-up`
- ✅ `POST /api/auth/sign-in`
- ✅ `GET /api/auth/session`
- ✅ `POST /api/auth/sign-out`
- ✅ `POST /api/auth/update-role`

**Total: 35 rotas documentadas**

---

## 🔧 Middleware e Utils

### Middleware de Autenticação (`auth.middleware.ts`)

#### Funções Disponíveis

- ✅ `extractAuthToken()` - Extrai token de cookie ou header
- ✅ `requireAuth()` - Valida autenticação básica
- ✅ `requireStudent()` - Valida se usuário é student (ou admin)
- ✅ `requireGym()` - Valida se usuário é gym (ou admin)

#### Exemplo de Uso

```typescript
export async function myHandler(request: NextRequest) {
  const auth = await requireStudent(request);
  if ("error" in auth) return auth.response;
  
  const { userId, user } = auth;
  // Sua lógica aqui
}
```

### Utils de Resposta (`response.utils.ts`)

#### Funções Disponíveis

- ✅ `successResponse(data, status?)` - Resposta de sucesso
- ✅ `errorResponse(message, status?)` - Resposta de erro
- ✅ `badRequestResponse(message?)` - Resposta 400
- ✅ `unauthorizedResponse(message?)` - Resposta 401
- ✅ `forbiddenResponse(message?)` - Resposta 403
- ✅ `notFoundResponse(message?)` - Resposta 404
- ✅ `internalErrorResponse(message?)` - Resposta 500

#### Exemplo de Uso

```typescript
return successResponse({ data: result });
return badRequestResponse("Dados inválidos");
return notFoundResponse("Recurso não encontrado");
```

### Utils de Erro (`error.utils.ts`)

#### Funções Disponíveis

- ✅ `handleApiError(error)` - Trata erros da API
- ✅ `withErrorHandling(handler)` - Wrapper para handlers

---

## 📖 Swagger e Documentação

### Acessar Swagger

**URL:** `http://localhost:3000/api/swagger`

O Swagger está **expandido e atualizado** com:

- ✅ **11 tags** documentadas
- ✅ **10+ schemas** criados
- ✅ **15+ rotas** documentadas
- ✅ Estrutura completa para expansão

### Tags Disponíveis

1. Autenticação
2. Usuários
3. Students
4. Gyms
5. Workouts
6. Nutrition
7. Foods
8. Subscriptions
9. Gym Subscriptions
10. Payments
11. Memberships

### Schemas Principais

- Student
- StudentProfile
- WeightHistory
- Gym
- GymProfile
- Workout
- Unit
- Exercise
- Nutrition
- FoodItem
- Subscription
- Payment
- PaymentMethod
- Membership

---

## 🧪 Como Testar

### Iniciar o Servidor

```bash
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

### Acessar o Swagger

#### Opção 1: Visualizar JSON Direto

Acesse diretamente no navegador:
```
http://localhost:3000/api/swagger
```

#### Opção 2: Usar Swagger Editor Online

1. Acesse: https://editor.swagger.io/
2. Cole o JSON de `http://localhost:3000/api/swagger`
3. Visualize a documentação interativa

### Testar Endpoints

#### 1. Testar Autenticação

```bash
# Registrar
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@email.com","password":"senha123456"}'

# Login
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password":"senha123456"}'
```

#### 2. Testar Students

```bash
# Buscar todos os dados
curl http://localhost:3000/api/students/all \
  -H "Cookie: auth_token=SEU_TOKEN_AQUI"

# Buscar perfil
curl http://localhost:3000/api/students/profile \
  -H "Cookie: auth_token=SEU_TOKEN_AQUI"
```

#### 3. Testar Gyms

```bash
# Listar academias
curl http://localhost:3000/api/gyms/list \
  -H "Cookie: auth_token=SEU_TOKEN_AQUI"

# Criar academia
curl -X POST http://localhost:3000/api/gyms/create \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=SEU_TOKEN_AQUI" \
  -d '{"name":"Academia Teste","address":"Rua Teste","phone":"123456789","email":"academia@teste.com"}'
```

### Verificar Estrutura

```bash
# Ver JSON do Swagger
curl http://localhost:3000/api/swagger | jq .
```

### Validar OpenAPI Spec

1. Acesse: https://editor.swagger.io/
2. Cole o JSON de `/api/swagger`
3. Verifique se há erros de validação

---

## 📊 Benefícios da Refatoração

### 1. Código Mais Limpo

- ✅ Rotas agora são apenas 2-3 linhas
- ✅ Lógica centralizada nos handlers
- ✅ Fácil manutenção e testes

### 2. Autenticação Centralizada

- ✅ Middleware reutilizável
- ✅ Validação consistente
- ✅ Menos código duplicado

### 3. Tratamento de Erros Padronizado

- ✅ Respostas consistentes
- ✅ Logging estruturado
- ✅ Mensagens de erro claras

### 4. Melhor Organização

- ✅ Handlers agrupados por domínio
- ✅ Fácil encontrar código relacionado
- ✅ Estrutura escalável

---

## 🚀 Como Adicionar Nova Rota

### Passo 1: Criar Handler

```typescript
// lib/api/handlers/[domain].handler.ts
export async function myNewHandler(
  request: NextRequest
): Promise<NextResponse> {
  const auth = await requireStudent(request);
  if ("error" in auth) return auth.response;
  
  const { userId, user } = auth;
  
  // Sua lógica aqui
  const result = await doSomething();
  
  return successResponse({ data: result });
}
```

### Passo 2: Criar Rota

```typescript
// app/api/[domain]/[route]/route.ts
import { NextRequest } from "next/server";
import { myNewHandler } from "@/lib/api/handlers/[domain].handler";

export async function GET(request: NextRequest) {
  return myNewHandler(request);
}
```

### Passo 3: Adicionar ao Swagger

Adicione em `app/api/swagger/route.ts`:
- Tag se necessário
- Schema se necessário
- Path com documentação

---

## 📚 Recursos

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

## ⚠️ Notas Importantes

1. **Autenticação**: Todas as rotas que requerem autenticação precisam do cookie `auth_token` ou header `Authorization: Bearer TOKEN`
2. **Roles**: Sempre use `role` para lógica de negócio, não `userType`
3. **Erros**: Use sempre as funções de `response.utils.ts` para respostas padronizadas
4. **Middleware**: Use `requireStudent()` ou `requireGym()` para validação de acesso

---

**Status:** ✅ 100% COMPLETO  
**Última Atualização:** 2025-01-25







