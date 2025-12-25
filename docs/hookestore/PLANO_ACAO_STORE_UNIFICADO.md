# 🎯 PLANO DE AÇÃO - STORE UNIFICADO E HOOK MODULAR PARA STUDENT

## 📋 OBJETIVO

Criar um **único store Zustand** e um **único hook modular** para gerenciar TODOS os dados do student, permitindo:

- ✅ Carregar todos os dados do usuário de uma vez ao inicializar
- ✅ Acessar dados isolados: `useStudent('xp', 'age', 'payments')`
- ✅ Acessar grandes porções: `useStudent('weightHistory')`, `useStudent('workoutHistory')`
- ✅ Acessar tudo: `useStudent('user')` ou `useStudent()` (sem parâmetros)
- ✅ Atualizar qualquer dado através do store
- ✅ Sincronização automática com backend
- ✅ Otimistic updates para melhor UX

---

## 📊 ANÁLISE DA SITUAÇÃO ATUAL

### Stores Existentes (Serão Unificados)

1. **`student-store.ts`** - Progress, stats, workoutHistory, personalRecords, dayPasses
2. **`workout-store.ts`** - Workout progress, completed workouts, active workout
3. **`nutrition-store.ts`** - Daily nutrition, food database
4. **`subscription-store.ts`** - Subscription data

### Hooks Existentes (Serão Unificados)

1. **`use-nutrition-handlers.ts`** - Handlers para nutrição
2. **`use-student-data.ts`** - Wrapper React Query
3. **`use-subscription.ts`** - Subscription hook

### Server Actions Existentes

1. **`getStudentUnits()`** - Units e workouts
2. **`getStudentProgress()`** - Progresso
3. **`getStudentProfileData()`** - Perfil completo
4. **`getStudentSubscription()`** - Assinatura
5. **`getGymLocations()`** - Academias
6. **`getCurrentUserInfo()`** - Info do usuário

### APIs Existentes

1. **`GET /api/workouts/units`** - Units e workouts
2. **`GET /api/workouts/history`** - Histórico de workouts
3. **`GET /api/students/weight`** - Histórico de peso
4. **`POST /api/students/weight`** - Adicionar peso
5. **`GET /api/nutrition/daily`** - Nutrição do dia
6. **`POST /api/nutrition/daily`** - Salvar nutrição
7. **`GET /api/memberships`** - Memberships
8. **`GET /api/payments`** - Histórico de pagamentos
9. **`GET /api/payment-methods`** - Métodos de pagamento
10. **`GET /api/subscriptions/current`** - Assinatura atual

---

## 🗂️ ESTRUTURA DE DADOS DO STUDENT

### Dados que DEVEM estar no Store Unificado

```typescript
interface StudentData {
  // === USER INFO ===
  user: {
    id: string;
    name: string;
    email: string;
    username: string; // Gerado de email
    memberSince: string; // Formato: "Jan 2025"
    avatar?: string;
    role: "STUDENT" | "ADMIN";
    isAdmin: boolean;
  };

  // === STUDENT INFO ===
  student: {
    id: string;
    age?: number;
    gender?: string;
    phone?: string;
    avatar?: string;
  };

  // === PROGRESS ===
  progress: {
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    currentLevel: number;
    xpToNextLevel: number;
    workoutsCompleted: number;
    todayXP: number;
    lastActivityDate: string;
    dailyGoalXP: number;
    weeklyXP: number[]; // últimos 7 dias
    achievements: Achievement[];
  };

  // === PROFILE ===
  profile: {
    height?: number; // cm
    weight?: number; // kg (atual)
    fitnessLevel?: string;
    weeklyWorkoutFrequency?: number;
    workoutDuration?: number; // minutos
    goals?: string[];
    injuries?: string[];
    availableEquipment?: string[];
    gymType?: string;
    preferredWorkoutTime?: string;
    preferredSets?: number;
    preferredRepRange?: string;
    restTime?: string;
    dietType?: string;
    allergies?: string[];
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFats?: number;
    mealsPerDay?: number;
    hasWeightLossGoal?: boolean;
  };

  // === WEIGHT HISTORY ===
  weightHistory: Array<{
    date: Date | string;
    weight: number;
    notes?: string;
  }>;
  weightGain?: number | null; // Ganho/perda no último mês

  // === WORKOUTS ===
  units: Unit[]; // Units com workouts
  workoutHistory: WorkoutHistory[]; // Histórico de workouts completados
  personalRecords: PersonalRecord[]; // Recordes pessoais

  // === NUTRITION ===
  dailyNutrition: DailyNutrition; // Nutrição do dia atual
  foodDatabase: FoodItem[]; // Base de dados de alimentos (cache local)

  // === SUBSCRIPTION ===
  subscription: {
    id: string;
    plan: "free" | "premium";
    status: "active" | "canceled" | "expired" | "past_due" | "trialing";
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    trialStart: Date | null;
    trialEnd: Date | null;
    isTrial: boolean;
    daysRemaining: number | null;
    billingPeriod: "monthly" | "annual";
  } | null;

  // === GYMS ===
  gymLocations: GymLocation[]; // Academias parceiras
  memberships: StudentGymMembership[]; // Memberships ativas
  dayPasses: DayPass[]; // Diárias compradas

  // === PAYMENTS ===
  payments: StudentPayment[]; // Histórico de pagamentos
  paymentMethods: PaymentMethod[]; // Métodos de pagamento salvos

  // === SOCIAL ===
  friends: {
    count: number;
    list: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
  };

  // === WORKOUT PROGRESS (Temporário durante workout) ===
  activeWorkout: {
    workoutId: string | null;
    currentExerciseIndex: number;
    exerciseLogs: ExerciseLog[];
    skippedExercises: string[];
    selectedAlternatives: Record<string, string>;
    xpEarned: number;
    totalVolume: number;
    completionPercentage: number;
    startTime: Date;
    lastUpdated: Date;
    cardioPreference?: "none" | "before" | "after";
    cardioDuration?: number;
    selectedCardioType?: string;
  } | null;

  // === METADATA ===
  metadata: {
    lastSync: Date | null;
    isLoading: boolean;
    isInitialized: boolean;
    errors: Record<string, string | null>;
  };
}
```

---

## 🏗️ ARQUITETURA DO STORE UNIFICADO

### 1. Store Zustand (`stores/student-unified-store.ts`)

```typescript
interface StudentUnifiedState {
  // === DADOS ===
  data: StudentData;

  // === ACTIONS - CARREGAR DADOS ===
  loadAll: () => Promise<void>; // Carregar todos os dados
  loadUser: () => Promise<void>; // Carregar apenas user info
  loadProgress: () => Promise<void>; // Carregar apenas progress
  loadProfile: () => Promise<void>; // Carregar apenas profile
  loadWeightHistory: () => Promise<void>; // Carregar histórico de peso
  loadWorkouts: () => Promise<void>; // Carregar units e workouts
  loadWorkoutHistory: () => Promise<void>; // Carregar histórico de workouts
  loadNutrition: () => Promise<void>; // Carregar nutrição do dia
  loadSubscription: () => Promise<void>; // Carregar assinatura
  loadPayments: () => Promise<void>; // Carregar pagamentos e memberships

  // === ACTIONS - ATUALIZAR DADOS ===
  updateProgress: (progress: Partial<UserProgress>) => Promise<void>;
  updateProfile: (profile: Partial<StudentProfile>) => Promise<void>;
  addWeight: (weight: number, date?: Date) => Promise<void>;
  completeWorkout: (
    workoutId: string,
    data: WorkoutCompletionData
  ) => Promise<void>;
  updateNutrition: (nutrition: Partial<DailyNutrition>) => Promise<void>;
  updateSubscription: (subscription: Partial<Subscription>) => Promise<void>;

  // === ACTIONS - WORKOUT PROGRESS ===
  setActiveWorkout: (workoutId: string | null) => void;
  updateActiveWorkout: (updates: Partial<ActiveWorkout>) => void;
  saveWorkoutProgress: (workoutId: string) => void;
  clearActiveWorkout: () => void;

  // === ACTIONS - SYNC ===
  syncAll: () => Promise<void>; // Sincronizar tudo com backend
  syncProgress: () => Promise<void>; // Sincronizar apenas progress
  syncNutrition: () => Promise<void>; // Sincronizar apenas nutrição

  // === ACTIONS - RESET ===
  reset: () => void; // Resetar store
  clearCache: () => void; // Limpar cache local
}
```

### 2. Hook Modular (`hooks/use-student.ts`)

```typescript
// Uso básico - retorna tudo
const student = useStudent();

// Uso com seletores - retorna apenas dados específicos
const { xp, age, payments } = useStudent("xp", "age", "payments");
const weightHistory = useStudent("weightHistory");
const progress = useStudent("progress");
const user = useStudent("user");

// Uso com ações
const { updateProgress, addWeight } = useStudent("actions");
const { loadAll, syncAll } = useStudent("loaders");

// Uso combinado
const { data: progress, update: updateProgress } = useStudent(
  "progress",
  "update"
);
```

---

## 📝 IMPLEMENTAÇÃO PASSO A PASSO

### FASE 1: Criar Store Unificado

#### 1.1 Criar `stores/student-unified-store.ts`

- ✅ Definir interface `StudentData`
- ✅ Definir interface `StudentUnifiedState`
- ✅ Criar store com Zustand + persist
- ✅ Implementar actions de carregamento
- ✅ Implementar actions de atualização
- ✅ Implementar sincronização automática

#### 1.2 Criar Server Action Unificada

- ✅ Criar `app/student/actions-unified.ts`
- ✅ Função `getAllStudentData()` - Busca TUDO de uma vez
- ✅ Funções específicas para cada seção (fallback)

### FASE 2: Criar Hook Modular

#### 2.1 Criar `hooks/use-student.ts`

- ✅ Implementar seletores dinâmicos
- ✅ Implementar actions expostas
- ✅ Implementar carregamento automático
- ✅ Implementar cache e sincronização

#### 2.2 Criar Helpers

- ✅ `lib/utils/student-selectors.ts` - Funções de seleção
- ✅ `lib/utils/student-transformers.ts` - Transformação de dados

### FASE 3: Criar API Unificada

#### 3.1 Criar `app/api/students/all/route.ts`

- ✅ `GET /api/students/all` - Retorna TODOS os dados do student
- ✅ Suporta query params para filtrar seções
- ✅ Cache e otimização

### FASE 4: Atualizar Componentes

#### 4.1 Atualizar Páginas

- ✅ `app/student/page-content.tsx` - Usar `useStudent()`
- ✅ `app/student/profile/profile-content.tsx` - Usar `useStudent('profile', 'weightHistory')`
- ✅ `app/student/diet/diet-page.tsx` - Usar `useStudent('dailyNutrition')`
- ✅ `app/student/learn/learning-path.tsx` - Usar `useStudent('units')`
- ✅ `app/student/payments/student-payments-page.tsx` - Usar `useStudent('payments', 'subscription')`

#### 4.2 Atualizar Componentes

- ✅ Remover uso de stores antigos
- ✅ Substituir por `useStudent()`
- ✅ Atualizar handlers para usar actions do store

### FASE 5: Limpeza

#### 5.1 Remover Stores Antigos

- ✅ `stores/student-store.ts` - DELETAR
- ✅ `stores/nutrition-store.ts` - DELETAR (ou manter apenas para compatibilidade temporária)
- ✅ `stores/subscription-store.ts` - DELETAR (ou manter apenas para compatibilidade temporária)

#### 5.2 Remover Hooks Antigos

- ✅ `hooks/use-nutrition-handlers.ts` - DELETAR (funcionalidade movida para store)
- ✅ `hooks/use-student-data.ts` - DELETAR
- ✅ Atualizar imports em todos os arquivos

#### 5.3 Atualizar Exports

- ✅ `stores/index.ts` - Atualizar exports
- ✅ Remover exports de stores antigos

---

## 🔄 FLUXO DE DADOS

### Inicialização

```
1. App carrega
2. useStudent() é chamado
3. Verifica se dados estão no store (cache)
4. Se não, chama loadAll()
5. loadAll() busca de /api/students/all
6. Dados são salvos no store
7. Componentes renderizam com dados do store
```

### Atualização

```
1. Usuário faz ação (ex: completa workout)
2. Store atualiza otimisticamente (UI atualiza imediatamente)
3. Store chama API em background
4. Se sucesso, confirma atualização
5. Se erro, reverte mudança otimista
```

### Sincronização

```
1. Store detecta mudanças pendentes
2. Automaticamente sincroniza com backend
3. Atualiza lastSync timestamp
4. Componentes são notificados via Zustand
```

---

## 📦 ESTRUTURA DE ARQUIVOS

```
stores/
  └── student-unified-store.ts  ← NOVO: Store unificado

hooks/
  └── use-student.ts  ← NOVO: Hook modular

app/
  └── student/
      └── actions-unified.ts  ← NOVO: Server actions unificadas

app/
  └── api/
      └── students/
          └── all/
              └── route.ts  ← NOVO: API unificada

lib/
  └── utils/
      ├── student-selectors.ts  ← NOVO: Seletores
      └── student-transformers.ts  ← NOVO: Transformadores
```

---

## 🎯 EXEMPLOS DE USO

### Exemplo 1: Acessar dados isolados

```typescript
// Em qualquer componente
const { xp, age, name } = useStudent("totalXP", "age", "name");

return (
  <div>
    <p>
      {name} tem {age} anos
    </p>
    <p>XP Total: {xp}</p>
  </div>
);
```

### Exemplo 2: Acessar grandes porções

```typescript
const weightHistory = useStudent("weightHistory");
const workoutHistory = useStudent("workoutHistory");

return (
  <div>
    <WeightChart data={weightHistory} />
    <WorkoutList workouts={workoutHistory} />
  </div>
);
```

### Exemplo 3: Acessar tudo

```typescript
const student = useStudent(); // Retorna StudentData completo

return (
  <div>
    <ProfileHeader user={student.user} />
    <ProgressCard progress={student.progress} />
    <NutritionTracker nutrition={student.dailyNutrition} />
  </div>
);
```

### Exemplo 4: Atualizar dados

```typescript
const { addWeight, updateProgress } = useStudent("actions");

const handleAddWeight = async () => {
  await addWeight(75.5); // Atualiza otimisticamente e sincroniza
};

const handleCompleteWorkout = async () => {
  await updateProgress({
    totalXP: progress.totalXP + 100,
    workoutsCompleted: progress.workoutsCompleted + 1,
  });
};
```

### Exemplo 5: Carregar dados específicos

```typescript
const { loadProgress, loadNutrition } = useStudent("loaders");

useEffect(() => {
  loadProgress(); // Carrega apenas progress
  loadNutrition(); // Carrega apenas nutrição
}, []);
```

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### Performance

- ✅ Cache local (Zustand persist)
- ✅ Carregamento sob demanda
- ✅ Sincronização em background
- ✅ Debounce para múltiplas atualizações

### Sincronização

- ✅ Otimistic updates
- ✅ Retry automático em caso de erro
- ✅ Reversão de mudanças em caso de falha
- ✅ Timestamp de última sincronização

### Compatibilidade

- ✅ Manter stores antigos temporariamente (deprecated)
- ✅ Migração gradual de componentes
- ✅ Fallback para APIs antigas

### Segurança

- ✅ Validação de dados no backend
- ✅ Sanitização de inputs
- ✅ Verificação de permissões

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Store Unificado

- [ ] Criar `stores/student-unified-store.ts`
- [ ] Definir interfaces TypeScript
- [ ] Implementar actions de carregamento
- [ ] Implementar actions de atualização
- [ ] Implementar persist middleware
- [ ] Testar store isoladamente

### Fase 2: Hook Modular

- [ ] Criar `hooks/use-student.ts`
- [ ] Implementar seletores dinâmicos
- [ ] Implementar carregamento automático
- [ ] Implementar cache
- [ ] Testar hook isoladamente

### Fase 3: API e Server Actions

- [ ] Criar `app/api/students/all/route.ts`
- [ ] Criar `app/student/actions-unified.ts`
- [ ] Implementar `getAllStudentData()`
- [ ] Testar API

### Fase 4: Atualizar Componentes

- [ ] Atualizar `app/student/page-content.tsx`
- [ ] Atualizar `app/student/profile/profile-content.tsx`
- [ ] Atualizar `app/student/diet/diet-page.tsx`
- [ ] Atualizar `app/student/learn/learning-path.tsx`
- [ ] Atualizar `app/student/payments/student-payments-page.tsx`
- [ ] Atualizar componentes filhos

### Fase 5: Limpeza

- [ ] Marcar stores antigos como deprecated
- [ ] Remover stores antigos
- [ ] Remover hooks antigos
- [ ] Atualizar imports
- [ ] Atualizar documentação

---

## 🚀 PRÓXIMOS PASSOS

1. **Começar pela Fase 1** - Criar store unificado
2. **Testar isoladamente** - Garantir que funciona
3. **Criar hook modular** - Fase 2
4. **Migrar gradualmente** - Fase 4 (um componente por vez)
5. **Limpar código antigo** - Fase 5

---

**Status:** 📝 PLANO CRIADO
**Data:** 2025-01-XX
**Próximo Passo:** Iniciar Fase 1 - Criar Store Unificado
