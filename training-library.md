# Training Library (Biblioteca de Treino) - Planejamento Detalhado Atualizado

## 1. Visão Geral (Overview)
A "Biblioteca de Treinos" permite que Alunos armazenem **Semanas Inteiras de Treino (Weekly Plans)** como moldes, e que Personais/Academias criem essas semanas de treino diretamente na biblioteca do aluno. 
Na tela `app/student/_learn` (Unit da home), o botão principal será o da Biblioteca. Com 2 cliques, o aluno escolhe uma "Semana Base" da biblioteca e substitui sua semana atual inteira. O Edit Modal passará a ser secundário e acessado *através* da biblioteca, servindo para criar ou editar as semanas armazenadas lá.

---

## 2. Decisões de Arquitetura (Socratic Gate - Resolvido)
1. **O que é salvo:** A biblioteca gerencia `WeeklyPlan` (Planos Semanais inteiros com seus 7 slots), e não treinos isolados (`Workout`).
2. **Posse:** A biblioteca pertence ao Aluno (`Student`).
3. **Substituição:** Substituir a semana atual por uma da biblioteca faz uma **cópia profunda (Deep Copy)** do molde para a semana ativa do aluno (`student.weeklyPlan`). A semana antiga é substituída.
4. **Edição:** Criar, editar ou excluir planos é feito **dentro da Biblioteca**. Ao clicar em editar um plano da biblioteca, abre-se o Edit Modal atual carregando aquele molde específico.
5. **Permissões B2B:** Academias e Personais podem criar UM ÚNICO molde de treino na biblioteca de um aluno. Eles só podem visualizar, editar e excluir o SEU PRÓPRIO molde criado. Exceção: Personais filiados a uma academia podem editar o molde criado por aquela academia.

---

## 3. Modificações no Banco de Dados (Prisma)

**Arquivo:** `prisma/schema.prisma`

Atualmente o modelo `WeeklyPlan` é único por aluno (`studentId @unique`). Precisamos permitir múltiplos planos semanais por aluno, diferenciando o "Plano Ativo" dos "Planos da Biblioteca". Além disso, precisamos **rastrear o Criador** para as permissões.

```prisma
// [MODIFY] model Student
model Student {
  // ... campos existentes ...
  activeWeeklyPlanId String? @unique // Qual plano semanal o aluno está usando agora
  activeWeeklyPlan   WeeklyPlan? @relation("ActivePlan", fields: [activeWeeklyPlanId], references: [id])
  
  weeklyPlans        WeeklyPlan[] @relation("LibraryPlans") // Todos os planos da biblioteca
}

// [MODIFY] model WeeklyPlan
model WeeklyPlan {
  id          String  @id @default(cuid())
  
  // REMOVER: studentId String @unique
  // ADICIONAR: Relacionamento de posse
  studentId   String
  student     Student @relation("LibraryPlans", fields: [studentId], references: [id], onDelete: Cascade)
  
  title       String  @default("Meu Plano Semanal")
  description String? 
  
  isLibraryTemplate Boolean @default(true) // Se true, aparece na biblioteca. 
  
  // Rastreamento B2B para Access Control
  createdById   String? // Guarda a referência de quem criou (se foi Gym ou Personal)
  creatorType   String? // "GYM" | "PERSONAL" | "STUDENT"
  
  // O estudante que tem esse plano como ATIVO
  activeForStudent Student? @relation("ActivePlan")

  // ... slots: PlanSlot[]
}
```
*Atenção à Migração: A quebra da restrição `@unique` e mudança para `activeWeeklyPlanId` exigirá um script de migração cuidadoso para não perder os treinos atuais dos usuários em produção. (A ideia geral da migração é: todos os atuais mudam isLibraryTemplate=false e setam seu ID no `activeWeeklyPlanId` do Aluno correspondente).*

---

## 4. Backend (APIs e Server Actions)

### 4.1. CRUD da Biblioteca (Planos Semanais)
**Arquivos Novos/Modificados:**
- `app/api/workouts/library/route.ts`
  - **GET:** Retorna `WeeklyPlan[]` onde `studentId = query.studentId` e `isLibraryTemplate = true`.
  - **POST:** Cria um novo `WeeklyPlan` vazio na biblioteca. 
    - Se request vem de `Role = GYM`, garante que o Gym só tem **1** plano na biblioteca desse aluno. `createdById = user.gymId`, `creatorType = "GYM"`.
    - Se request vem de `Role = PERSONAL`, garante `createdById = user.personalId`, `creatorType = "PERSONAL"`.

- `app/api/workouts/library/[id]/route.ts`
  - **DELETE & PUT:** Alterar treinos/título da biblioteca.
  - *ACCESS CONTROL CHECK:*
    - Se o usuário for Aluno: Requer apenas `student.userId == req.userId`.
    - Se o usuário for GYM: Requer `createdById == req.gymId`.
    - Se o usuário for PERSONAL: Requer `createdById == req.personalId` **OU** (verifica no Prisma `GymPersonalAffiliation` se o Personal é filiado à Academia que é a dona do `createdById` do plano - se for, permite).

### 4.2. Ativação do Plano Semanal ("Tornar este o treino do dia/semana")
- `app/api/workouts/weekly-plan/activate/route.ts` (POST)
  - **Payload:** `{ libraryPlanId: string }`
  - **Lógica:** 
    1. Busca o `WeeklyPlan` da biblioteca (com slots e workouts).
    2. Cria uma cópia profunda (Clone) do `WeeklyPlan` inteiro, com `isLibraryTemplate = false` e `creatorType/createdById` copiados.
    3. Copia todos os `PlanSlot`, `Workout` e `WorkoutExercise`.
    4. Atualiza o `Student.activeWeeklyPlanId` para apontar para este novo clone.
    5. Opcional: Deleta o clone antigo se ele não for template (limpeza de Lixo).

---

## 5. Frontend - Gerenciamento de Estado (Zustand)

**Arquivo Modificado:** `stores/workout-store.ts` ou `student-unified-store.ts`
- **Novo State:** `libraryPlans: WeeklyPlan[]`
- **Novas Actions:**
  - `loadLibraryPlans(studentId: string)`
  - `activateLibraryPlan(planId: string)`
  - `createLibraryPlan()`
  - `deleteLibraryPlan(planId: string)`

---

## 6. Frontend - Interface de Usuário (Componentes)

### 6.1. Tela Principal de Learn (`learning-path.tsx`)
**Modificações:**
- Remover (ou ocultar) o botão "Lápis" (Edit Plan) do `UnitSectionCard`, já que a edição agora será focada na biblioteca.
- Adicionar o botão principal: `[+] Biblioteca de Treinos`.
- Ao clicar, abre o `LibraryModal`.

### 6.2. Novo Modal da Biblioteca (`library-modal.tsx`)
**Arquivo Novo:** `components/organisms/workout/library-modal.tsx`
- **Componentes:**
  - Lista de cards de `WeeklyPlan` salvos.
  - Cada Card mostra Título, Dias da semana ativos, e os botões:
    - **[ Ativar como Treino da Semana ]** (Chama a API de clone e fecha o modal).
    - **[ Editar ]** (Fecha o LibraryModal e abre o `EditPlanModal` antigo passando o `planId` da biblioteca).
    - **[ Excluir ]**
  - Card "Criar novo Menu de Treino".
- **Comportamento B2B:** Os botões de [Editar] e [Excluir] só devem aparecer (ou estar habilitados) se o usuário vizualizando for o dono do plano (conferir `createdById` e `creatorType` via API/Session). Personais filiados à academia dona poderão ver/editar o plano dela, respeitando o Access Control do Backend.

### 6.3. Adaptação do Edit Modal (`edit-plan-modal.tsx`)
- Precisa aceitar um `planId` específico como prop/queryState para ele saber qual plano está editando (o plano da biblioteca, e não o ativo).
- Se estiver editando o ativo, mostrar aviso: "Alterações aqui só afetam esta semana corrida. Para criar moldes reutilizáveis, use a Biblioteca." (Ou bloquear edição do ativo e forçar edição via biblioteca).

---

## 7. Controle de Acesso e Gerenciamento (Portais B2B)
- Personais e Academias na tela de "Student Management" (`app/gym/students/[id]` e `app/personal/students/[id]`) visualizarão uma listagem de todos os treinos que existem na biblioteca do aluno (apenas visualização básica `readonly`).
- Nesses portais B2B, existirão CTAs:
  - "Criar Treino Semanal" (Abre o modal de edição de plano em modo criação, envia para a lib). Só habilitado se a Instituição ainda não tem 1 treino criado pra ele.
  - "Editar Treino" (Se ela ou uma afiliada sua criou).
  - Ambos refletem na biblioteca do aluno, com os IDs corretos.

---

## 8. Ordem de Execução (Plano de Ação)

1. **Fase 1: Schema & DB** → Atualizar `schema.prisma` removendo `@unique` do `studentId` no `WeeklyPlan`, criar a prop `activeWeeklyPlanId` no `Student`, e as chaves `createdById/creatorType` no `WeeklyPlan`. *Escrever script de sync dos dados legados.*
2. **Fase 2: APIs Core** → Criar rotas de Clone (`/activate`) e CRUD da Biblioteca (com os novos Access Controls exigentes).
3. **Fase 3: Stores** → Hooks Zustand para carregar a biblioteca do aluno.
4. **Fase 4: Modais UI** → Construir o `LibraryModal` e listagem de planos.
5. **Fase 5: Integração Learning Path** → Trocar o Pencil Lápis pelo botão da Biblioteca e testar o switch de treinos com 1 clique (clone deep copy).
6. **Fase 6: Adaptação Edit Modal** → Refatorar o Edit Modal para receber o ID do plano da biblioteca.
7. **Fase 7: Portais B2B** → Adicionar a UI de biblioteca nos profiles de gestão de aluno da Academia e Personal.

---

## 9. Phase X: Verificação Final
- [ ] Segurança: Testar se um Personal B não filiado consegue editar treino da Academia A (deve falhar).
- [ ] Bancode Dados: O Clone Master deve copiar *tudo* corretamente (slots e exercises) e atualizar o ponteiro `activeWeeklyPlanId`.
- [ ] Teste Manual: "Criar Treino B2B", "Personal Filiado Edita Treino", "Ativar Treino no Aluno".
- [ ] Build e Lint checks.
