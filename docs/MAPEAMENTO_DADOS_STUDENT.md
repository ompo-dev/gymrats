# 📊 MAPEAMENTO COMPLETO DE DADOS - APP STUDENT

Este documento mapeia TODOS os dados necessários para as páginas e componentes do app/student, identificando:

- ✅ Dados que DEVEM vir do backend/database
- ⚠️ Dados que estão mockados e precisam vir do backend
- 🧮 Dados calculados/agregados no frontend
- 📦 Dados que vêm de stores (Zustand)
- 🔒 Dados fixos/mock que podem continuar mockados

---

## 📁 ESTRUTURA GERAL

### Páginas Principais

1. `/student` (Página Home)
2. `/student/profile` (Perfil do Usuário)
3. `/student/learn` (Trilha de Aprendizado/Treinos)
4. `/student/diet` (Nutrição)
5. `/student/cardio` (Cardio e Funcional)
6. `/student/education` (Educação)
7. `/student/payments` (Pagamentos)
8. `/student/personalization` (Personalização com IA)
9. `/student/onboarding` (Onboarding - já funcional)
10. `/student/more` (Menu Mais)

---

## 🏠 1. PÁGINA HOME (`/student`)

### Arquivos Relacionados

- `app/student/page.tsx`
- `app/student/page-content.tsx`
- `app/student/actions.ts`
- `stores/student-store.ts`

### Dados Necessários

#### 1.1 Units (Trilha de Treinos)

**Arquivo:** `app/student/actions.ts` → `getStudentUnits()`

**Status Atual:** ❌ MOCKADO (`mockUnits` em `lib/mock-data.ts`)

**Dados que DEVEM vir do Database:**

```typescript
interface Unit {
  id: string;
  title: string; // Ex: "Semana 1"
  description: string; // Ex: "Começando sua jornada fitness"
  color: string; // Cor do tema
  icon: string; // Emoji/ícone
  workouts: Workout[]; // Array de workouts
}

interface Workout {
  id: string;
  title: string;
  description: string;
  type: "strength" | "cardio" | "flexibility" | "rest";
  muscleGroup: MuscleGroup;
  difficulty: "iniciante" | "intermediario" | "avancado";
  exercises: WorkoutExercise[];
  xpReward: number;
  estimatedTime: number; // minutos
  locked: boolean; // ⚠️ DEVE ser calculado baseado no progresso do aluno
  completed: boolean; // ⚠️ DEVE vir do histórico de completions
  stars?: number; // 0-3 baseado em performance
  completedAt?: Date;
}

interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // "12" ou "12-15" ou "30s"
  rest: number; // segundos
  notes?: string;
  videoUrl?: string;
  educationalId?: string; // Referência ao conteúdo educacional
  alternatives?: AlternativeExercise[]; // Exercícios alternativos
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `Unit` (já existe)
- ✅ `Workout` (já existe)
- ✅ `WorkoutExercise` (já existe)
- ❌ **FALTA:** `AlternativeExercise` (tabela não existe)

**Queries Necessárias:**

```sql
-- Buscar units com workouts
SELECT u.*, w.*, we.*
FROM units u
LEFT JOIN workouts w ON w.unitId = u.id
LEFT JOIN workout_exercises we ON we.workoutId = w.id
ORDER BY u.order, w.order, we.order;
```

**Cálculos Necessários:**

- `locked`: Verificar se o aluno completou os workouts anteriores necessários
- `completed`: Verificar se existe `WorkoutHistory` para este workout
- `stars`: Calcular baseado em performance (volume, completude, etc)

---

#### 1.2 Gym Locations (Academias)

**Arquivo:** `app/student/actions.ts` → `getGymLocations()`

**Status Atual:** ❌ MOCKADO (`mockGymLocations` em `lib/gym-mock-data.ts`)

**Dados que DEVEM vir do Database:**

```typescript
interface GymLocation {
  id: string;
  name: string;
  logo?: string;
  address: string;
  coordinates: { lat: number; lng: number };
  distance?: number; // 🧮 Calculado (distância do usuário)
  rating: number; // 0-5
  totalReviews: number;
  plans: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  amenities: string[];
  openNow: boolean; // 🧮 Calculado (horário atual)
  openingHours: {
    open: string;
    close: string;
  };
  photos?: string[];
  isPartner: boolean; // Se está cadastrado no GymRats
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `Gym` (já existe)
- ❌ **FALTA:** Campos de `coordinates`, `rating`, `reviews`, `amenities`, `openingHours`, `photos`
- ❌ **FALTA:** `MembershipPlan` precisa ter tipos `daily`, `weekly`, `monthly`

**Queries Necessárias:**

```sql
-- Buscar academias parceiras
SELECT g.*, mp.*
FROM gyms g
LEFT JOIN membership_plans mp ON mp.gymId = g.id
WHERE g.isActive = true;
```

---

#### 1.3 Student Progress (Progresso do Aluno)

**Arquivo:** `app/student/actions.ts` → `getStudentProgress()`

**Status Atual:** ✅ PARCIALMENTE DO DB (progress básico do DB, mas faltam dados)

**Dados que DEVEM vir do Database:**

```typescript
interface UserProgress {
  currentStreak: number; // ✅ JÁ NO DB (StudentProgress.currentStreak)
  longestStreak: number; // ✅ JÁ NO DB (StudentProgress.longestStreak)
  totalXP: number; // ✅ JÁ NO DB (StudentProgress.totalXP)
  currentLevel: number; // ✅ JÁ NO DB (StudentProgress.currentLevel)
  xpToNextLevel: number; // ✅ JÁ NO DB (StudentProgress.xpToNextLevel)
  workoutsCompleted: number; // ✅ JÁ NO DB (StudentProgress.workoutsCompleted)
  todayXP: number; // ✅ JÁ NO DB (StudentProgress.todayXP)
  achievements: Achievement[]; // ⚠️ FALTA buscar do DB
  lastActivityDate: string; // ✅ JÁ NO DB (StudentProgress.lastActivityDate)
  dailyGoalXP: number; // ✅ JÁ NO DB (StudentProgress.dailyGoalXP)
  weeklyXP: number[]; // 🧮 DEVE ser calculado (últimos 7 dias)
  todayXP: number; // ✅ JÁ NO DB
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `StudentProgress` (já existe - mas falta `lastActivityDate`)
- ✅ `Achievement` (já existe)
- ✅ `AchievementUnlock` (já existe)

**Queries Necessárias:**

```sql
-- Buscar progresso completo
SELECT sp.*,
  (SELECT COUNT(*) FROM achievement_unlocks au
   WHERE au.studentId = sp.studentId) as achievementsCount
FROM student_progress sp
WHERE sp.studentId = ?;

-- Buscar achievements desbloqueados
SELECT a.*, au.unlockedAt, au.progress
FROM achievements a
INNER JOIN achievement_unlocks au ON au.achievementId = a.id
WHERE au.studentId = ?
ORDER BY au.unlockedAt DESC;

-- Calcular weeklyXP (últimos 7 dias)
SELECT DATE(date) as day, SUM(xpReward) as dailyXP
FROM workout_history wh
INNER JOIN workouts w ON w.id = wh.workoutId
WHERE wh.studentId = ?
  AND wh.date >= NOW() - INTERVAL '7 days'
GROUP BY DATE(date)
ORDER BY day;
```

---

#### 1.4 Profile Data (Dados do Perfil)

**Arquivo:** `app/student/profile/actions.ts` → `getStudentProfileData()`

**Status Atual:** ⚠️ PARCIAL (progress do DB, mas workoutHistory/personalRecords/weightHistory são mockados)

**Dados que DEVEM vir do Database:**

**1.4.1 Progress**

- ✅ Já vem do DB (mesmo que acima)

**1.4.2 Workout History**

```typescript
interface WorkoutHistory {
  date: Date;
  workoutId: string;
  workoutName: string;
  duration: number; // minutos
  totalVolume: number; // kg total
  exercises: ExerciseLog[];
  overallFeedback?: "excelente" | "bom" | "regular" | "ruim";
  bodyPartsFatigued: MuscleGroup[];
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `WorkoutHistory` (já existe)
- ✅ `ExerciseLog` (já existe)

**Query Necessária:**

```sql
-- Buscar histórico de workouts
SELECT wh.*, w.title as workoutName,
  (SELECT SUM(CAST(jsonb_array_elements(CAST(wh.totalVolume AS jsonb))->>'weight' AS FLOAT) *
               CAST(jsonb_array_elements(CAST(wh.totalVolume AS jsonb))->>'reps' AS INT))
   FROM jsonb_array_elements(CAST(el.sets AS jsonb))) as calculatedVolume
FROM workout_history wh
INNER JOIN workouts w ON w.id = wh.workoutId
LEFT JOIN exercise_logs el ON el.workoutHistoryId = wh.id
WHERE wh.studentId = ?
ORDER BY wh.date DESC
LIMIT 10;
```

**1.4.3 Personal Records**

```typescript
interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: "max-weight" | "max-reps" | "max-volume";
  value: number;
  date: Date;
  previousBest?: number;
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `PersonalRecord` (já existe)

**Query Necessária:**

```sql
-- Buscar recordes pessoais
SELECT pr.*
FROM personal_records pr
WHERE pr.studentId = ?
ORDER BY pr.date DESC;
```

**1.4.4 Weight History**

```typescript
interface WeightHistoryItem {
  date: Date;
  weight: number;
}
```

**Tabelas Prisma Relacionadas:**

- ❌ **FALTA:** Tabela para histórico de peso
- ⚠️ Poderia ser adicionado em `StudentProfile` como JSON array, mas ideal seria tabela separada

**Query Necessária:**

```sql
-- Se criar tabela weight_history
SELECT date, weight
FROM weight_history
WHERE studentId = ?
ORDER BY date DESC;

-- OU usar campo JSON em StudentProfile (menos ideal)
-- Seria necessário parsear JSON do campo weightHistory
```

---

#### 1.5 Subscription (Assinatura)

**Arquivo:** `app/student/actions.ts` → `getStudentSubscription()`

**Status Atual:** ✅ VEM DO DB

**Dados:**

```typescript
interface Subscription {
  id: string;
  plan: "free" | "premium";
  status: "active" | "canceled" | "expired" | "past_due" | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  isTrial: boolean; // 🧮 Calculado (trialEnd > now)
  daysRemaining: number | null; // 🧮 Calculado
  billingPeriod: "monthly" | "annual"; // 🧮 Calculado (diferença entre dates)
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `Subscription` (já existe)

**Queries Necessárias:**

- ✅ Já implementado em `getStudentSubscription()`

---

#### 1.6 User Info (Informações do Usuário)

**Arquivo:** `app/student/actions.ts` → `getCurrentUserInfo()`

**Status Atual:** ✅ VEM DO DB

**Dados:**

```typescript
interface UserInfo {
  isAdmin: boolean; // user.role === "ADMIN"
  role: string | null; // user.role
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `User` (já existe)

---

## 👤 2. PÁGINA PERFIL (`/student/profile`)

### Arquivos Relacionados

- `app/student/profile/profile-page.tsx`
- `app/student/profile/profile-content.tsx`
- `components/ui/profile-header.tsx`
- `app/student/profile/actions.ts`

### Dados Necessários

#### 2.1 Profile Header

**Componente:** `components/ui/profile-header.tsx`

**Dados que DEVEM vir do Database:**

```typescript
interface ProfileHeaderProps {
  avatar?: string | React.ReactNode; // ⚠️ FALTA: Student.avatar
  name: string; // ✅ User.name
  username: string; // ❌ FALTA: Campo username (pode ser gerado de email)
  memberSince: string; // ✅ User.createdAt
  stats: {
    workouts: number; // ✅ StudentProgress.workoutsCompleted
    friends: number; // ❌ FALTA: Contar Friendship where status = 'accepted'
    streak: number; // ✅ StudentProgress.currentStreak
  };
  quickStats: Array<{
    value: string | number;
    label: string;
    highlighted?: boolean;
  }>;
  // Exemplo de quickStats:
  // - Nível atual (StudentProgress.currentLevel)
  // - XP Total (StudentProgress.totalXP)
  // - Peso Atual (StudentProfile.weight)
  // - Peso Ganhos (🧮 Calculado: peso atual - peso inicial)
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `User` (já existe - mas falta `username`)
- ✅ `Student` (já existe - mas falta `avatar` na descrição)
- ✅ `StudentProgress` (já existe)
- ✅ `StudentProfile` (já existe)
- ✅ `Friendship` (já existe)

**Queries Necessárias:**

```sql
-- Contar amigos
SELECT COUNT(*)
FROM friendships
WHERE (userId = ? OR friendId = ?)
  AND status = 'accepted';

-- Buscar dados completos do perfil
SELECT
  u.name,
  u.createdAt,
  u.image as avatar,
  s.avatar as studentAvatar,
  sp.weight,
  sp.height,
  sp.currentLevel,
  sp.totalXP,
  (SELECT COUNT(*) FROM friendships WHERE (userId = u.id OR friendId = u.id) AND status = 'accepted') as friendsCount
FROM users u
INNER JOIN students s ON s.userId = u.id
LEFT JOIN student_progress sp ON sp.studentId = s.id
LEFT JOIN student_profiles sp ON sp.studentId = s.id
WHERE u.id = ?;
```

#### 2.2 Evolution de Peso

**Status Atual:** ❌ MOCKADO (`mockWeightHistory`)

**Dados que DEVEM vir do Database:**

- Ver seção 1.4.4 Weight History

#### 2.3 Histórico Recente de Workouts

**Status Atual:** ❌ MOCKADO (`mockWorkoutHistory`)

**Dados que DEVEM vir do Database:**

- Ver seção 1.4.2 Workout History

#### 2.4 Recordes Pessoais

**Status Atual:** ❌ MOCKADO (`mockPersonalRecords`)

**Dados que DEVEM vir do Database:**

- Ver seção 1.4.3 Personal Records

---

## 📚 3. PÁGINA LEARN (`/student/learn`)

### Arquivos Relacionados

- `app/student/learn/learning-path.tsx`
- `stores/workout-store.ts`

### Dados Necessários

#### 3.1 Units e Workouts

**Status Atual:** ❌ MOCKADO

**Dados:**

- Mesmos dados da seção 1.1 Units
- Os workouts são renderizados usando `WorkoutNode` que usa dados do `workout-store.ts`

#### 3.2 Workout Store (Zustand)

**Arquivo:** `stores/workout-store.ts`

**Dados Gerenciados Localmente (persistidos no localStorage):**

```typescript
interface WorkoutProgress {
  workoutId: string;
  currentExerciseIndex: number;
  exerciseLogs: ExerciseLog[];
  skippedExercises: string[]; // IDs dos exercícios pulados
  selectedAlternatives: Record<string, string>; // exerciseId -> alternativeId
  xpEarned: number;
  totalVolume: number;
  completionPercentage: number;
  startTime: Date;
  lastUpdated: Date;
  cardioPreference?: "none" | "before" | "after";
  cardioDuration?: number;
  selectedCardioType?: string;
}
```

**⚠️ IMPORTANTE:** Este estado é temporário (durante o workout). Quando o workout é completado, deve:

1. Salvar `WorkoutHistory` no DB
2. Salvar `ExerciseLog` no DB
3. Atualizar `StudentProgress` (XP, streak, etc)
4. Verificar e criar `PersonalRecord` se necessário

**Ações que DEVEM ser criadas:**

- `POST /api/workouts/complete` - Salvar workout completado
- `POST /api/workouts/progress` - Salvar progresso parcial (auto-save)
- `GET /api/workouts/:id/progress` - Buscar progresso salvo

---

## 🍎 4. PÁGINA DIET (`/student/diet`)

### Arquivos Relacionados

- `app/student/diet/diet-page.tsx`
- `hooks/use-nutrition-handlers.ts`
- `stores/nutrition-store.ts`

### Dados Necessários

#### 4.1 Daily Nutrition (Nutrição Diária)

**Status Atual:** ⚠️ Gerenciado localmente (Zustand)

**Dados que DEVEM vir do Database:**

```typescript
interface DailyNutrition {
  date: string;
  meals: Meal[];
  totalCalories: number; // 🧮 Calculado (sum de meals)
  totalProtein: number; // 🧮 Calculado
  totalCarbs: number; // 🧮 Calculado
  totalFats: number; // 🧮 Calculado
  waterIntake: number; // ml
  targetCalories: number; // ✅ StudentProfile.targetCalories
  targetProtein: number; // ✅ StudentProfile.targetProtein
  targetCarbs: number; // ✅ StudentProfile.targetCarbs
  targetFats: number; // ✅ StudentProfile.targetFats
  targetWater: number;
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `DietPlan` (já existe)
- ✅ `Meal` (já existe)
- ✅ `DietPlanCompletion` (já existe)
- ❌ **FALTA:** Tabela para rastrear nutrição diária (meals consumidos, água, etc)

**Tabela Necessária:**

```prisma
model DailyNutrition {
  id          String   @id @default(cuid())
  studentId   String
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  date        DateTime @default(now())
  waterIntake Int      @default(0) // ml

  meals       NutritionMeal[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([studentId, date])
  @@map("daily_nutrition")
}

model NutritionMeal {
  id               String          @id @default(cuid())
  dailyNutritionId String
  dailyNutrition   DailyNutrition  @relation(fields: [dailyNutritionId], references: [id], onDelete: Cascade)
  name             String
  type             String          // breakfast, lunch, dinner, snack
  calories         Int
  protein          Float
  carbs            Float
  fats             Float
  time             String?
  completed        Boolean         @default(false)

  foods            NutritionFoodItem[]

  order            Int             @default(0)

  @@map("nutrition_meals")
}

model NutritionFoodItem {
  id              String        @id @default(cuid())
  nutritionMealId String
  nutritionMeal   NutritionMeal @relation(fields: [nutritionMealId], references: [id], onDelete: Cascade)
  foodId          String?       // Referência a food database
  foodName        String
  servings        Float
  calories        Int
  protein         Float
  carbs           Float
  fats            Float
  servingSize     String

  @@map("nutrition_food_items")
}
```

#### 4.2 Food Database

**Status Atual:** ❌ MOCKADO (`mockFoodDatabase`)

**Dados que DEVEM vir do Database:**

```typescript
interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  category:
    | "protein"
    | "carbs"
    | "vegetables"
    | "fruits"
    | "fats"
    | "dairy"
    | "snacks";
  image?: string;
}
```

**Tabela Necessária:**

```prisma
model FoodItem {
  id          String   @id @default(cuid())
  name        String
  calories    Int      // por 100g
  protein     Float
  carbs       Float
  fats        Float
  servingSize String   // "100g" ou "1 unidade (50g)"
  category    String
  image       String?

  @@map("food_items")
}
```

**Queries Necessárias:**

```sql
-- Buscar nutrição do dia
SELECT dn.*, nm.*, nfi.*
FROM daily_nutrition dn
LEFT JOIN nutrition_meals nm ON nm.dailyNutritionId = dn.id
LEFT JOIN nutrition_food_items nfi ON nfi.nutritionMealId = nm.id
WHERE dn.studentId = ?
  AND DATE(dn.date) = CURRENT_DATE
ORDER BY nm.order;

-- Buscar alimentos (search)
SELECT *
FROM food_items
WHERE LOWER(name) LIKE LOWER(?)
ORDER BY name
LIMIT 20;
```

---

## 💳 5. PÁGINA PAYMENTS (`/student/payments`)

### Arquivos Relacionados

- `app/student/payments/student-payments-page.tsx`

### Dados Necessários

#### 5.1 Gym Memberships

**Status Atual:** ❌ MOCKADO (`mockStudentMemberships`)

**Dados que DEVEM vir do Database:**

```typescript
interface StudentGymMembership {
  id: string;
  gymId: string;
  gymName: string;
  gymLogo?: string;
  gymAddress: string;
  planId: string;
  planName: string;
  planType: "monthly" | "quarterly" | "semi-annual" | "annual";
  startDate: Date;
  nextBillingDate: Date;
  amount: number;
  status: "active" | "suspended" | "canceled" | "pending";
  autoRenew: boolean;
  paymentMethod?: {
    type: "credit-card" | "debit-card" | "pix";
    last4?: string;
    brand?: string;
  };
  benefits: string[];
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `GymMembership` (já existe)
- ✅ `MembershipPlan` (já existe)
- ✅ `Gym` (já existe)
- ❌ **FALTA:** Campo `paymentMethod` em `GymMembership` (ou tabela relacionada)

**Query Necessária:**

```sql
-- Buscar membros de academias do aluno
SELECT
  gm.*,
  g.name as gymName,
  g.logo as gymLogo,
  g.address as gymAddress,
  mp.name as planName,
  mp.type as planType,
  mp.benefits
FROM gym_memberships gm
INNER JOIN gyms g ON g.id = gm.gymId
INNER JOIN membership_plans mp ON mp.id = gm.planId
WHERE gm.studentId = ?
ORDER BY gm.startDate DESC;
```

#### 5.2 Payment History

**Status Atual:** ❌ MOCKADO (`mockStudentPayments`)

**Dados que DEVEM vir do Database:**

```typescript
interface StudentPayment {
  id: string;
  gymId: string;
  gymName: string;
  planName: string;
  amount: number;
  date: Date;
  dueDate: Date;
  status: "paid" | "pending" | "overdue" | "canceled";
  paymentMethod: "credit-card" | "debit-card" | "pix" | "cash";
  reference?: string;
  receiptUrl?: string;
}
```

**Tabelas Prisma Relacionadas:**

- ✅ `Payment` (já existe)

**Query Necessária:**

```sql
-- Buscar histórico de pagamentos
SELECT
  p.*,
  g.name as gymName,
  mp.name as planName
FROM payments p
INNER JOIN gyms g ON g.id = p.gymId
LEFT JOIN membership_plans mp ON mp.id = p.planId
WHERE p.studentId = ?
ORDER BY p.date DESC;
```

#### 5.3 Payment Methods

**Status Atual:** ❌ MOCKADO (`mockPaymentMethods`)

**Dados que DEVEM vir do Database:**

```typescript
interface PaymentMethod {
  id: string;
  type: "credit-card" | "debit-card" | "pix";
  isDefault: boolean;
  cardBrand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  pixKey?: string;
}
```

**Tabelas Prisma Relacionadas:**

- ❌ **FALTA:** Tabela para métodos de pagamento

**Tabela Necessária:**

```prisma
model PaymentMethod {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        String   // credit-card, debit-card, pix
  isDefault   Boolean  @default(false)
  cardBrand   String?
  last4       String?
  expiryMonth Int?
  expiryYear  Int?
  holderName  String?
  pixKey      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("payment_methods")
}
```

#### 5.4 Subscription

**Status Atual:** ✅ VEM DO DB

- Ver seção 1.5 Subscription

---

## 🏃 6. PÁGINA CARDIO (`/student/cardio`)

### Arquivos Relacionados

- `app/student/cardio/cardio-functional-page.tsx`

### Dados Necessários

#### 6.1 Cardio Stats

**Status Atual:** 🔒 FIXO (hardcoded)

**Dados Mostrados:**

- "3x cardio esta semana" - 🔒 Pode continuar fixo ou vir do DB
- "850 kcal queimadas" - 🔒 Pode continuar fixo ou vir do DB

**⚠️ OPCIONAL:** Se quiser tornar dinâmico, precisa rastrear sessões de cardio no DB

---

## 📖 7. PÁGINA EDUCATION (`/student/education`)

### Arquivos Relacionados

- `app/student/education/education-page.tsx`
- `app/student/education/educational-lessons.tsx`
- `app/student/education/muscle-explorer.tsx`

### Dados Necessários

#### 7.1 Educational Lessons

**Status Atual:** 🔒 FIXO (`educationalLessons` em `lib/educational-data.ts`)

**Observação:** Conteúdo educacional pode continuar fixo ou ser migrado para DB (opcional)

#### 7.2 Muscle Database e Exercise Database

**Status Atual:** 🔒 FIXO (`muscleDatabase` e `exerciseDatabase` em `lib/educational-data.ts`)

**Observação:** Pode continuar fixo ou ser migrado para DB (opcional)

---

## 🤖 8. PÁGINA PERSONALIZATION (`/student/personalization`)

### Arquivos Relacionados

- `app/student/personalization/personalization-page.tsx`
- `components/ai-workout-generator.tsx`
- `components/ai-diet-generator.tsx`

### Dados Necessários

#### 8.1 AI Workout Generator

**Dados Necessários:**

- Perfil do aluno (`StudentProfile`)
- Histórico de workouts (`WorkoutHistory`)
- Preferências do aluno

#### 8.2 AI Diet Generator

**Dados Necessários:**

- Perfil do aluno (`StudentProfile`)
- Histórico nutricional (`DailyNutrition`)
- Restrições alimentares (`StudentProfile.allergies`)

**⚠️ IMPORTANTE:** Estas funcionalidades dependem de integração com IA externa (OpenAI, etc)

---

## 📝 RESUMO GERAL

### ✅ Dados que JÁ VÊM DO BACKEND

1. Student Progress (básico)
2. Subscription
3. User Info
4. Student Profile (básico)

### ⚠️ Dados MOCKADOS que DEVEM VIR DO BACKEND

1. **Units e Workouts** - Crítico
2. **Gym Locations** - Crítico
3. **Workout History** - Crítico
4. **Personal Records** - Crítico
5. **Weight History** - Importante
6. **Gym Memberships** - Importante
7. **Payment History** - Importante
8. **Payment Methods** - Importante
9. **Achievements** (unlocks) - Importante
10. **Daily Nutrition** - Importante
11. **Food Database** - Importante

### 🧮 Dados Calculados/Agregados

1. `locked` status dos workouts (baseado em progresso)
2. `completed` status dos workouts (baseado em histórico)
3. `weeklyXP` (agregação de últimos 7 dias)
4. `totalVolume` em workouts (soma de sets)
5. `stars` rating (baseado em performance)
6. `distance` de academias (geolocalização)
7. `openNow` status de academias (horário)
8. `isTrial` e `daysRemaining` (datas)

### 📦 Dados Gerenciados por Stores (Temporários)

1. **WorkoutStore**: Progresso durante workout (deve ser salvo ao completar)
2. **StudentStore**: Estado local (sincronizar com DB)
3. **NutritionStore**: Nutrição do dia (deve ser salvo ao adicionar/completar)

### 🔒 Dados Fixos (Podem Continuar Mockados)

1. Educational Lessons
2. Muscle Database
3. Exercise Database
4. Cardio Stats (opcional)

---

## 🗄️ TABELAS QUE PRECISAM SER CRIADAS/MODIFICADAS

### Novas Tabelas Necessárias

1. `AlternativeExercise` - Alternativas de exercícios
2. `DailyNutrition` - Rastreamento nutricional diário
3. `NutritionMeal` - Refeições do dia
4. `NutritionFoodItem` - Alimentos adicionados às refeições
5. `FoodItem` - Base de dados de alimentos
6. `WeightHistory` - Histórico de peso (ou usar JSON em StudentProfile)
7. `PaymentMethod` - Métodos de pagamento salvos

### Campos que FALTAM nas Tabelas Existentes

1. **Unit**: Nenhum campo faltando
2. **Workout**: Nenhum campo faltando
3. **Student**: `avatar` (opcional)
4. **User**: `username` (opcional, pode gerar de email)
5. **Gym**: `coordinates`, `rating`, `reviews`, `amenities`, `openingHours`, `photos`
6. **GymMembership**: `paymentMethod` (ou tabela relacionada)
7. **StudentProgress**: `lastActivityDate` (parece existir mas verificar)

---

## 🔌 APIs/ENDPOINTS NECESSÁRIOS

### Já Existentes ✅

- `GET /api/auth/session`
- `POST /api/auth/sign-out`
- `GET /api/subscriptions/current`
- `POST /api/subscriptions/create`
- `POST /api/subscriptions/cancel`
- `POST /api/subscriptions/start-trial`
- `GET /api/students/profile`
- `POST /api/students/profile`

### Necessários Criar ⚠️

#### Workouts

- `GET /api/workouts/units` - Buscar units com workouts
- `GET /api/workouts/:id` - Buscar workout específico
- `POST /api/workouts/:id/progress` - Salvar progresso parcial
- `POST /api/workouts/:id/complete` - Completar workout
- `GET /api/workouts/history` - Histórico de workouts completados

#### Progresso

- `GET /api/students/progress` - Progresso completo (com achievements, weeklyXP)
- `PUT /api/students/progress` - Atualizar progresso

#### Recordes e Histórico

- `GET /api/students/records` - Recordes pessoais
- `GET /api/students/weight-history` - Histórico de peso
- `POST /api/students/weight` - Adicionar entrada de peso

#### Academias

- `GET /api/gyms/locations` - Listar academias parceiras
- `GET /api/gyms/:id` - Detalhes da academia

#### Membros e Pagamentos

- `GET /api/memberships` - Membros de academias
- `GET /api/payments` - Histórico de pagamentos
- `GET /api/payment-methods` - Métodos de pagamento
- `POST /api/payment-methods` - Adicionar método de pagamento

#### Nutrição

- `GET /api/nutrition/daily` - Nutrição do dia atual
- `POST /api/nutrition/daily` - Salvar nutrição do dia
- `GET /api/foods/search?q=...` - Buscar alimentos
- `GET /api/foods/:id` - Detalhes do alimento

#### Social

- `GET /api/friends` - Lista de amigos
- `GET /api/friends/count` - Contagem de amigos

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Crítico (Workouts e Progresso)

- [ ] Criar tabela `AlternativeExercise`
- [ ] Criar API `GET /api/workouts/units`
- [ ] Implementar cálculo de `locked` e `completed` nos workouts
- [ ] Criar API `POST /api/workouts/:id/complete`
- [ ] Criar API `GET /api/workouts/history`
- [ ] Atualizar `getStudentUnits()` para usar DB

### Fase 2: Perfil e Histórico

- [ ] Criar API `GET /api/students/progress` (completo)
- [ ] Criar API `GET /api/workouts/history`
- [ ] Criar API `GET /api/students/records`
- [ ] Criar tabela/API para `WeightHistory`
- [ ] Atualizar `getStudentProfileData()` para usar DB

### Fase 3: Academias e Pagamentos

- [ ] Adicionar campos faltantes em `Gym`
- [ ] Criar API `GET /api/gyms/locations`
- [ ] Criar tabela `PaymentMethod`
- [ ] Criar APIs de memberships e payments
- [ ] Atualizar página de pagamentos

### Fase 4: Nutrição

- [ ] Criar tabelas de nutrição (`DailyNutrition`, `NutritionMeal`, `NutritionFoodItem`)
- [ ] Criar tabela `FoodItem`
- [ ] Criar APIs de nutrição
- [ ] Migrar dados do store para DB

### Fase 5: Social e Detalhes

- [ ] Implementar contagem de amigos
- [ ] Adicionar campo `avatar` em `Student`
- [ ] Adicionar campo `username` em `User` (ou gerar de email)
- [ ] Otimizações e melhorias

---

## 📝 NOTAS IMPORTANTES

1. **Migração de Dados**: Ao migrar dados mockados para DB, considerar:

   - Seed inicial com dados de exemplo
   - Manter compatibilidade durante transição
   - Migração gradual (feature flags)

2. **Performance**:

   - Cachear dados que não mudam frequentemente (units, workouts)
   - Paginar resultados grandes (histórico, payments)
   - Usar indexes apropriados

3. **Segurança**:

   - Validar que aluno só acessa seus próprios dados
   - Validar permissões em todas as APIs
   - Sanitizar inputs

4. **Sincronização Store <-> DB**:
   - WorkoutStore: Salvar progresso ao fechar/completar
   - NutritionStore: Salvar ao adicionar/completar refeição
   - StudentStore: Sincronizar periodicamente com DB

---

**Documento criado em:** 2025-01-XX
**Última atualização:** 2025-01-XX
