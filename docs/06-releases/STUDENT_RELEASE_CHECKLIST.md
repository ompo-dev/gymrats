# Checklist de Release – Versão Student (Gymrats)

Documento de referência para lançamento público da área do aluno. Organizado por página/componente, com itens acionáveis e referências de código.

---

## Resumo Executivo

| Categoria                                | Itens | Prioridade |
| ---------------------------------------- | ----- | ---------- |
| Crítico (bloquear launch)                | 12    | 🔴         |
| Importante (deixar pronto antes de beta) | 8     | 🟠         |
| Desejável (post-launch)                  | 6     | 🟡         |

---

## 1. Home (`app/student/page-content.tsx`)

### 1.1 🔴 Remover/simplificar exibição de ranking

**Problema:** `currentRanking` está fixo em `null` com TODO. O card de nível e o StatCard de "nível atual" usam isso e mostram "Continue treinando" quando null.

**Arquivo:** `app/student/page-content.tsx`  
**Linhas:** 166-168, 227-228, 273-276

**Opção A – Remover ranking da UI até estar pronto:**

```tsx
// page-content.tsx linha 166
// REMOVER: const currentRanking = null; // TODO: Adicionar ao store se necessário

// Linha 227 - LevelProgressCard: remover prop ranking
<LevelProgressCard
  currentLevel={storeProgress.currentLevel}
  totalXP={storeProgress.totalXP}
  xpToNextLevel={storeProgress.xpToNextLevel}
  // ranking={currentRanking ?? null}  // REMOVER
/>;

// Linhas 271-277 - StatCardLarge de nível: usar sempre subtitle fixo
subtitle = "Continue treinando";
// Remover condicional: currentRanking !== null && currentRanking !== undefined ? ...
```

**Opção B – Integrar ranking real (se backend já retorna):**  
O `getStudentProfileData` em `app/student/profile/actions.ts` já calcula ranking. É preciso:

- Adicionar `ranking` ao store unificado (ex: em `progress` ou em `profile`)
- Garantir que `loadProgress` ou `loadProfile` carregue esse dado
- Usar `storeProgress?.ranking ?? storeProfile?.ranking ?? null` em vez de `null`

---

### 1.2 🔴 Remover `handlePurchaseDayPass` com `alert()` – fluxo não integrado

**Problema:** Compra de diária adiciona pass ao store local e mostra `alert()`. Não há integração com backend/billing.

**Arquivo:** `app/student/page-content.tsx`  
**Linhas:** 176-194

**Ação:** Como a tab `gyms` está bloqueada para não-admin, o fluxo não é exposto hoje. Para lançamento:

- **Se gyms está oculto para alunos:** Nenhuma alteração necessária no código, apenas garantir que permaneça oculto.
- **Se for liberar gyms no futuro:** Implementar fluxo real (API de checkout, pagamento, etc.) antes de expor. Por enquanto, **manter `AdminOnly`** em `GymMap` (já está em `page-content.tsx` linhas 366-374).

**Verificação:** Confirmar que `blockedTabs` inclui `"gyms"` e que `userIsAdmin` é validado corretamente (linhas 55-56, 366).

---

### 1.3 🟠 Debug `console.log` em produção

**Problema:** `console.log` na tab education.

**Arquivo:** `app/student/page-content.tsx`  
**Linhas:** 82-90

**Ação:** Remover ou envolver em `if (process.env.NODE_ENV === "development")`.

```tsx
useEffect(() => {
  if (process.env.NODE_ENV === "development" && tab === "education") {
    console.log("[DEBUG] Education tab ativo:", {
      tab,
      educationView,
      exerciseId,
      muscleId,
    });
  }
}, [tab, educationView, exerciseId, muscleId]);
```

---

## 2. Layout (`app/student/layout-content.tsx`)

### 2.1 ✅ Layout e redirecionamento

- Onboarding obrigatório quando `!hasProfile` – OK
- `useStudentInitializer` carrega dados em background – OK
- Tabs principais: home, learn, diet, profile, more – OK

Nenhuma alteração crítica necessária.

---

## 3. Layout Server (`app/student/layout.tsx`)

### 3.1 🔴 Mocks em `getStudentProgress` (SSR)

**Problema:** `getStudentProgress` retorna `mockUserProgress` quando:

- não há `sessionToken` (linha 211)
- sessão não encontrada ou sem student (linha 216)
- `progress` não existe no DB (linha 226)
- erro em `catch` (linha 304)

**Arquivo:** `app/student/actions.ts`  
**Linhas:** 210-212, 215-217, 225-227, 303-305

**Ação:** Em produção, não retornar mock para usuário não autenticado. Retornar valores neutros ou redirecionar para login.

```ts
// Quando !sessionToken
if (!sessionToken) {
  return { currentStreak: 0, longestStreak: 0, totalXP: 0, ... };
  // OU: throw / redirect para login
}

// Quando !session ou !session.user.student
if (!session || !session.user.student) {
  return { currentStreak: 0, longestStreak: 0, totalXP: 0, ... };
}

// Quando !progress
if (!progress) {
  return { currentStreak: 0, longestStreak: 0, totalXP: 0, ... };
}

// Em catch: logar erro e retornar neutro, NÃO mock
} catch (error) {
  console.error("Erro ao buscar progresso:", error);
  return { currentStreak: 0, longestStreak: 0, totalXP: 0, currentLevel: 1, ... };
}
```

---

## 4. Actions (`app/student/actions.ts`)

### 4.1 🔴 `getStudentUnits` – remover fallback para mock

**Nota:** `lib/mock-data.ts` foi removido. Não usar mocks.

**Problema:** Retorna `mockUnits` quando:

- não autenticado (linhas 317-318)
- sessão sem student (linha 323)
- erro em catch (linhas 479-481)

**Arquivo:** `app/student/actions.ts`  
**Linhas:** 316-323, 478-481

**Ação:**

- Não autenticado: retornar `[]` ou `null` e deixar o cliente tratar (redirecionar para login).
- Erro: logar e retornar `[]` ou lançar para o cliente exibir erro, **não** retornar mock.

```ts
if (!sessionToken) {
  return [];
}
if (!session || !session.user.student) {
  return [];
}
// ...
} catch (error) {
  console.error("Erro ao buscar units do database:", error);
  return []; // ou rethrow
}
```

---

### 4.2 🔴 `getGymLocations` – remover fallback para mock

**Problema:** Em caso de erro, retorna `mockGymLocations` (linhas 634-636).

**Arquivo:** `app/student/actions.ts`  
**Linhas:** 633-636

**Ação:** Em erro, retornar `[]` e logar.

```ts
} catch (error) {
  console.error("Erro ao buscar academias do database:", error);
  return [];
}
```

---

### 4.3 ✅ `isPartner` em `getGymLocations`

**Status:** Concluído. O campo `isPartner` já existe no schema Prisma e o `whereClause` foi atualizado para filtrar apenas academias parceiras (`isPartner: true`).

---

## 5. Actions Unificadas (`app/student/actions-unified.ts`)

### 5.1 🔴 `getAllStudentData` – remover `getMockData()` em produção

**Problema:** Retorna `getMockData()` quando `!studentId || !userId` (linha 86) e em `catch` (linha 1086).

**Arquivo:** `app/student/actions-unified.ts`  
**Linhas:** 84-87, 1084-1087

**Ação:**

- Quando não autenticado: retornar objeto vazio/neutro (sem dados sensíveis de mock) ou lançar erro para o cliente tratar.
- Em `catch`: logar e retornar objeto vazio ou rethrow.

```ts
if (!studentId || !userId) {
  return {
    user: null,
    student: null,
    progress: { currentStreak: 0, totalXP: 0, ... },
    units: [],
    workoutHistory: [],
    // ... valores neutros/vazios
  };
}
// ...
} catch (error) {
  console.error("[getAllStudentData] Erro:", error);
  return { /* valores neutros */ }; // ou rethrow
}
```

---

### 5.2 🔴 Fallbacks internos para mock em `getAllStudentData`

**Problema:** Em diversos trechos, em caso de erro ou tabela inexistente, são atribuídos mocks:

- `result.weightHistory = mockWeightHistory` (linha 311)
- `result.units = mockUnits` (linha 448)
- `result.gymLocations = mockGymLocations` (linha 1033)

**Arquivo:** `app/student/actions-unified.ts`  
**Linhas:** 300-320, 440-455, 1025-1040

**Ação:** Em cada bloco, em caso de erro: atribuir `[]` ou `null` e logar, **não** usar mocks.

---

## 6. Profile Actions (`app/student/profile/actions.ts`)

### 6.1 🔴 Mock em `getStudentProfileData` em `catch`

**Problema:** Em `catch`, retorna `mockUserProgress`, `mockWorkoutHistory`, etc. (linhas 418-429).

**Arquivo:** `app/student/profile/actions.ts`  
**Linhas:** 417-430

**Ação:** Em `catch`, retornar valores neutros ou rethrow, sem mocks.

---

### 6.2 🔴 Fallback para `mockWeightHistory` quando tabela não existe

**Problema:** Se `weight_history` não existir, usa `mockWeightHistory` (linhas 260-295).

**Arquivo:** `app/student/profile/actions.ts`  
**Linhas:** 258-296

**Ação:** Garantir que a migration de `weight_history` esteja aplicada. Se a tabela não existir, retornar `[]` e logar aviso, **não** usar mock.

---

## 7. Profile Content (`app/student/profile/profile-content.tsx`)

### 7.1 🔴 Remover/simplificar `ranking`

**Problema:** `ranking = null` fixo (linha 331), usado em linha 477.

**Arquivo:** `app/student/profile/profile-content.tsx`  
**Linhas:** 331, 477

**Ação:** Mesma estratégia da Home (seção 1.1):

- **Opção A:** Remover exibição de ranking e usar texto fixo ("Calculando..." ou "Em breve").
- **Opção B:** Integrar ranking real via store (se `getStudentProfileData` já o retorna).

---

## 8. Student Payments Page (`app/student/payments/student-payments-page.tsx`)

### 8.1 🔴 Mocks quando store vazio

**Problema:** Usa `mockStudentMemberships`, `mockStudentPayments`, `mockPaymentMethods` quando o store está vazio (linhas 183-217).

**Arquivo:** `app/student/payments/student-payments-page.tsx`  
**Linhas:** 183-217

**Ação:** Em produção, quando o store estiver vazio:

- Memberships: `[]`
- Payments: `[]`
- PaymentMethods: `[]` ou `null`

Exibir estados vazios adequados ("Nenhuma academia vinculada", "Nenhum pagamento", etc.) em vez de dados fictícios.

```tsx
const membershipsData =
  storeMemberships && storeMemberships.length > 0
    ? storeMemberships.map(...)
    : [];  // não mockStudentMemberships

const paymentsData =
  storePayments && storePayments.length > 0
    ? storePayments.map(...)
    : [];  // não mockStudentPayments

const paymentMethodsData = storePaymentMethods || [];  // não mockPaymentMethods
```

---

### 8.2 🟠 Página bloqueada para não-admin

A tab `payments` está em `blockedTabs` e `AdminOnly` envolve `StudentPaymentsPage`. Para alunos comuns, essa tela não é acessível. Garantir que assinatura/trial possa ser iniciada por outro fluxo (ex: modal na home ou CTA após onboarding) se for requisito do produto.

---

## 9. Workout Modal (`components/organisms/workout/workout-modal.tsx`)

### 9.1 🔴 Remover fallback para `mockWorkouts`

**Nota:** `lib/mock-data.ts` foi removido. Não usar mocks.

**Problema:** Quando o workout não está nas units do store, usa `mockWorkouts.find(...)` (linhas 147-148, 158-159, 389, 407).

**Arquivo:** `components/organisms/workout/workout-modal.tsx`  
**Linhas:** 130-149, 385-410

**Ação:** Se o workout não for encontrado nas units do store:

- **Não** usar mock.
- Mostrar estado de erro: "Treino não encontrado. Por favor, recarregue a página." com botão de retry/fechar.
- Logar o `workoutId` para debug.

```tsx
const workoutBase = openWorkoutId
  ? findWorkoutInUnits(openWorkoutId) ?? null
  : null;

// Remover: mockWorkouts.find((w) => w.id === openWorkoutId)

// Se workoutBase === null e openWorkoutId existe, mostrar tela de erro
if (openWorkoutId && !workoutBase && units?.length) {
  return <WorkoutNotFoundState workoutId={openWorkoutId} onClose={...} />;
}
```

---

## 10. Student More Menu (`app/student/more/student-more-menu.tsx`)

### 10.1 ✅ Itens bloqueados para não-admin

- `blockedItems = ["cardio", "gyms", "payments", "subscription"]`
- Itens são filtrados quando `!userIsAdmin`
- Alunos veem apenas "Aprender" (education)

Para lançamento: manter ocultos até que os fluxos estejam prontos. Nenhuma alteração necessária.

---

### 10.2 ✅ `alert()` em bloqueio

**Status:** Concluído. O `alert()` foi substituído por `toast()` com variant `destructive` para melhor UX.

---

## 11. Componentes Auxiliares

### 11.1 `LevelProgressCard` – `ranking` opcional

O componente já trata `ranking` como opcional. Se remover a prop da Home/Profile, não quebra.

---

### 11.2 `cardio-tracker` – `mockUserProfile`

**Arquivo:** `components/organisms/trackers/cardio-tracker.tsx`  
**Linhas:** 27, 101, 110, 121

Cardio está bloqueado para não-admin. Para quando liberar: substituir `mockUserProfile` por dados reais do perfil (idade, etc.) do store.

---

### 11.3 `ai-diet-generator` e `ai-workout-generator`

**Nota:** O arquivo `lib/mock-data.ts` foi removido (incluindo `generateDietWithAI` e `generateWorkoutWithAI`). Esses componentes devem usar as APIs reais (`/api/workouts/process`, `/api/nutrition/chat`, etc.). A **PersonalizationPage** não está ligada a uma rota; ao integrá-la, usar apenas APIs reais.

---

## 12. Personalization Page (`app/student/personalization/personalization-page.tsx`)

### 12.1 🟡 Página não vinculada

O componente existe mas não é usado em nenhuma rota nem tab. Para lançamento:

- **Se não for lançar:** Manter como está.
- **Se for lançar:** Adicionar em uma tab (ex: "Gerar treino" ou "Personalizar") e garantir que as APIs de IA (`/api/workouts/process`, `/api/nutrition/chat`, etc.) estejam prontas e com rate limit.

---

## 13. Server Handlers (`server/handlers/students.ts`)

### 13.1 🔴 Mocks em `getAllStudentDataForUser`

O handler de `students` também usa `getMockData()` e fallbacks para mocks em erros. As mesmas regras dos actions se aplicam:

- Não retornar mock para usuário não autenticado.
- Em erros, retornar neutro/vazio e logar.

---

## 14. Checklist Geral

### Antes do lançamento

- [x] Remover todos os fallbacks para mock em produção (actions, actions-unified, profile actions, server handlers)
- [x] Substituir retornos de mock por valores neutros (`[]`, `null`, objetos vazios) e logar erros
- [x] Remover ou condicionar `console.log` de debug
- [x] Definir ranking: remover da UI ou integrar do backend
- [x] Remover fallback para `mockWorkouts` no WorkoutModal
- [x] Garantir que `student-payments-page` usa `[]` quando store vazio (não mock)
- [x] Confirmar que tabs bloqueadas (cardio, gyms, payments, subscription) permanecem ocultas para alunos
- [x] Garantir que `alert()` em bloqueio não seja usado em excesso (substituído por toast)

### Pós-lançamento

- [ ] Implementar fluxo real de compra de diária (quando liberar gyms)
- [ ] Integrar ranking no store e exibir na UI
- [x] Substituir `alert()` por toast em bloqueios
- [ ] Adicionar estados de erro e empty states em todas as telas críticas
- [ ] Observabilidade: logs estruturados, Sentry ou similar para erros client-side
- [ ] Rate limiting e timeout em APIs de IA

---

## 15. Arquivos Modificados (Resumo)

| Arquivo                                          | Alterações                                       |
| ------------------------------------------------ | ------------------------------------------------ |
| `app/student/actions.ts`                         | Remover mocks, usar isPartner em getGymLocations |
| `app/student/actions-unified.ts`                 | Remover getMockData e fallbacks para mock        |
| `app/student/profile/actions.ts`                 | Remover mocks em catch e weight_history          |
| `app/student/page-content.tsx`                   | Ranking, debug log, day pass com toast           |
| `app/student/profile/profile-content.tsx`        | Ranking                                          |
| `app/student/payments/student-payments-page.tsx` | Usar [] em vez de mock                           |
| `app/student/more/student-more-menu.tsx`         | Substituir alert() por toast em bloqueios        |
| `components/organisms/workout/workout-modal.tsx` | Remover mockWorkouts, adicionar estado de erro   |
| `server/handlers/students.ts`                    | Remover getMockData e fallbacks                  |

---

_Documento gerado em 12/02/2025. Revisar antes de cada release._
