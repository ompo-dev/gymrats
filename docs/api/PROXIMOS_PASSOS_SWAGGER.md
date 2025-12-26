# 📝 PRÓXIMOS PASSOS - ATUALIZAÇÃO DO SWAGGER

## 🎯 OBJETIVO

Atualizar completamente o Swagger (`app/api/swagger/route.ts`) com todas as rotas da API, incluindo schemas, exemplos e descrições detalhadas.

## 📋 ESTRUTURA DO SWAGGER COMPLETO

### Tags a Adicionar

```typescript
tags: [
  { name: "Autenticação", description: "Endpoints de autenticação e sessão" },
  { name: "Usuários", description: "Gerenciamento de usuários" },
  { name: "Students", description: "Endpoints relacionados a alunos" },
  { name: "Gyms", description: "Endpoints relacionados a academias" },
  { name: "Workouts", description: "Endpoints de treinos e exercícios" },
  { name: "Nutrition", description: "Endpoints de nutrição" },
  { name: "Foods", description: "Endpoints de alimentos" },
  { name: "Subscriptions", description: "Assinaturas de alunos" },
  { name: "Gym Subscriptions", description: "Assinaturas de academias" },
  { name: "Payments", description: "Endpoints de pagamentos" },
  { name: "Memberships", description: "Endpoints de membros de academias" },
];
```

### Schemas a Criar

#### Students

- `Student` - Dados completos do student
- `StudentProfile` - Perfil do student
- `WeightHistory` - Entrada de peso
- `WeightHistoryResponse` - Resposta com histórico

#### Gyms

- `Gym` - Dados da academia
- `GymProfile` - Perfil da academia
- `GymLocation` - Localização de academia parceira
- `GymListResponse` - Resposta de lista de academias

#### Workouts

- `Unit` - Unidade de treino
- `Workout` - Treino completo
- `Exercise` - Exercício
- `WorkoutHistory` - Histórico de treino
- `WorkoutProgress` - Progresso parcial de treino
- `ExerciseLog` - Log de exercício

#### Nutrition

- `DailyNutrition` - Nutrição do dia
- `FoodItem` - Item de alimento
- `Meal` - Refeição

#### Subscriptions

- `Subscription` - Assinatura
- `SubscriptionCreateRequest` - Request para criar assinatura
- `TrialRequest` - Request para iniciar trial

#### Payments

- `Payment` - Pagamento
- `PaymentMethod` - Método de pagamento
- `Membership` - Membros de academia

## 📝 ROTAS A DOCUMENTAR

### Students (6 rotas)

1. `GET /api/students/all` ✅
2. `GET /api/students/profile` ✅
3. `POST /api/students/profile` ✅
4. `GET /api/students/weight` ✅
5. `POST /api/students/weight` ✅
6. `GET /api/students/weight-history` ✅

### Gyms (5 rotas)

1. `GET /api/gyms/list` ✅
2. `POST /api/gyms/create` ✅
3. `GET /api/gyms/profile` ✅
4. `POST /api/gyms/set-active` ✅
5. `GET /api/gyms/locations` ✅

### Workouts (4 rotas)

1. `GET /api/workouts/units`
2. `POST /api/workouts/[id]/complete`
3. `POST /api/workouts/[id]/progress`
4. `GET /api/workouts/history`

### Nutrition (2 rotas)

1. `GET /api/nutrition/daily`
2. `POST /api/nutrition/daily`

### Foods (2 rotas)

1. `GET /api/foods/search`
2. `GET /api/foods/[id]`

### Subscriptions (4 rotas)

1. `GET /api/subscriptions/current`
2. `POST /api/subscriptions/create`
3. `POST /api/subscriptions/start-trial`
4. `POST /api/subscriptions/cancel`

### Gym Subscriptions (4 rotas)

1. `GET /api/gym-subscriptions/current`
2. `POST /api/gym-subscriptions/create`
3. `POST /api/gym-subscriptions/start-trial`
4. `POST /api/gym-subscriptions/cancel`

### Payments (3 rotas)

1. `GET /api/payments`
2. `GET /api/payment-methods`
3. `POST /api/payment-methods`

### Memberships (1 rota)

1. `GET /api/memberships`

### Auth (5 rotas) - Já documentado parcialmente

1. `POST /api/auth/sign-up` ✅
2. `POST /api/auth/sign-in` ✅
3. `GET /api/auth/session` ✅
4. `POST /api/auth/sign-out` ✅
5. `POST /api/auth/update-role` ✅

## 🔧 COMO IMPLEMENTAR

### Passo 1: Adicionar Tags

Adicionar todas as tags no array `tags` do Swagger spec.

### Passo 2: Criar Schemas

Criar todos os schemas no objeto `components.schemas`.

### Passo 3: Documentar Rotas

Para cada rota, adicionar no objeto `paths`:

- `summary` - Resumo curto
- `description` - Descrição detalhada
- `tags` - Array com tag(s)
- `security` - Array com esquemas de segurança
- `parameters` - Query params, path params
- `requestBody` - Body do request (se aplicável)
- `responses` - Todas as respostas possíveis com exemplos

### Passo 4: Adicionar Exemplos

Criar exemplos realistas para:

- Request bodies
- Response bodies
- Error responses

### Passo 5: Testar

- Abrir `/api/swagger` no navegador
- Verificar se todas as rotas aparecem
- Testar exemplos
- Verificar se schemas estão corretos

## 📚 RECURSOS

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/) - Para validar o spec
- [Swagger UI](https://swagger.io/tools/swagger-ui/) - Para visualizar

## ⚠️ NOTAS IMPORTANTES

1. **Manter Compatibilidade**: Não quebrar o Swagger atual
2. **Exemplos Realistas**: Usar dados que façam sentido
3. **Descrições Claras**: Explicar o que cada endpoint faz
4. **Códigos de Erro**: Documentar todos os códigos possíveis
5. **Query Params**: Documentar todos os query params opcionais

---

**Status:** 📋 PLANEJADO
**Prioridade:** Alta
**Estimativa:** 2-3 horas para implementação completa
