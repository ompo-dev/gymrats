# Relatório Completo - Pasta components/

**Projeto:** gymrats  
**Data:** 27 de fevereiro de 2025  
**Escopo:** Mapeamento completo da pasta `components/` com estrutura, propósito e usos de cada arquivo.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Estrutura de Pastas em Árvore](#2-estrutura-de-pastas-em-árvore)
3. [Atoms](#3-atoms)
4. [Molecules](#4-molecules)
5. [Organisms](#5-organisms)
6. [Templates](#6-templates)
7. [UI](#7-ui)
8. [Duo](#8-duo)
9. [Animations](#9-animations)
10. [Providers](#10-providers)
11. [Resumo Estatístico](#11-resumo-estatístico)

---

## 1. Visão Geral

A pasta `components/` é a biblioteca de componentes de UI do projeto gymrats, organizada por camadas seguindo Atomic Design (atoms, molecules, organisms, templates) com extensões específicas (ui, duo, animations, providers).

### README Principal (components/README.md)

- **Caminho:** `components`
- **Finalidade:** biblioteca de componentes de UI e composição por camadas
- **Subpastas:** admin/, animations/, atoms/, home/, molecules/, organisms/, providers/, templates/, ui/

---

## 2. Estrutura de Pastas em Árvore

```
components/
├── README.md
├── animations/
│   ├── README.md
│   ├── fade-in.tsx
│   ├── slide-in.tsx
│   ├── stagger-container.tsx
│   ├── stagger-item.tsx
│   └── while-in-view.tsx
├── atoms/
│   ├── README.md
│   ├── index.ts
│   ├── buttons/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── button.tsx
│   │   └── duo-button.tsx
│   ├── inputs/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── textarea.tsx
│   ├── modals/
│   │   ├── README.md
│   │   └── index.ts
│   └── progress/
│       ├── README.md
│       ├── index.ts
│       ├── exercise-steppers.tsx
│       ├── progress.tsx
│       ├── progress-ring.tsx
│       └── stepper-dot.tsx
├── duo/
│   ├── index.ts
│   ├── atoms/
│   │   ├── duo-badge.tsx
│   │   ├── duo-button.tsx
│   │   ├── duo-icon.tsx
│   │   ├── duo-progress.tsx
│   │   └── duo-text.tsx
│   ├── molecules/
│   │   ├── duo-achievement-card.tsx
│   │   ├── duo-card.tsx
│   │   ├── duo-input.tsx
│   │   ├── duo-modal.tsx
│   │   ├── duo-select.tsx
│   │   ├── duo-stat-card.tsx
│   │   └── duo-tabs.tsx
│   ├── organisms/
│   │   ├── duo-color-picker.tsx
│   │   └── duo-stats-grid.tsx
│   └── theme-provider.tsx
├── molecules/
│   ├── README.md
│   ├── index.ts
│   ├── limitation-selector.tsx
│   ├── relative-time.tsx
│   ├── badges/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── badge.tsx
│   │   ├── status-badge.tsx
│   │   └── subscription-badge.tsx
│   ├── cards/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── history-card.tsx
│   │   ├── meal-card.tsx
│   │   ├── record-card.tsx
│   │   ├── stat-card.tsx
│   │   ├── step-card.tsx
│   │   ├── water-intake-card.tsx
│   │   ├── duo-card.tsx
│   │   ├── macro-card.tsx
│   │   ├── section-card.tsx
│   │   └── stat-card-large.tsx
│   ├── forms/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── field.tsx
│   │   ├── form.tsx
│   │   ├── form-input.tsx
│   │   ├── input-group.tsx
│   │   └── label.tsx
│   └── selectors/
│       ├── README.md
│       └── index.ts
├── organisms/
│   ├── README.md
│   ├── index.ts
│   ├── error-boundary.tsx
│   ├── loading-screen.tsx
│   ├── loading-screen-fallback.tsx
│   ├── performance-optimizer.tsx
│   ├── reminders-banner.tsx
│   ├── education/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── education-page.tsx
│   │   ├── educational-lessons.tsx
│   │   ├── muscle-explorer.tsx
│   │   └── components/
│   │       ├── README.md
│   │       ├── index.ts
│   │       ├── lesson-detail.tsx
│   │       ├── lesson-filters.tsx
│   │       ├── lesson-list.tsx
│   │       ├── lesson-quiz.tsx
│   │       ├── markdown-renderer.tsx
│   │       └── muscle/
│   │           ├── README.md
│   │           ├── exercise-detail.tsx
│   │           ├── exercise-list.tsx
│   │           ├── muscle-detail.tsx
│   │           ├── muscle-list.tsx
│   │           └── search-bar.tsx
│   ├── generators/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── ai-diet-generator.tsx
│   │   └── ai-workout-generator.tsx
│   ├── gym/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── academias/
│   │   │   ├── index.ts
│   │   │   ├── academias-loading.tsx
│   │   │   ├── create-gym-button.tsx
│   │   │   ├── create-gym-dialog.tsx
│   │   │   ├── gym-card.tsx
│   │   │   └── hooks/use-academias-page.ts
│   │   ├── equipment-detail/
│   │   │   ├── index.ts
│   │   │   ├── equipment-header-card.tsx
│   │   │   ├── equipment-info-tab.tsx
│   │   │   ├── equipment-in-use-card.tsx
│   │   │   ├── equipment-maintenance-tab.tsx
│   │   │   ├── equipment-not-found.tsx
│   │   │   ├── equipment-stats-grid.tsx
│   │   │   ├── equipment-tabs.tsx
│   │   │   ├── equipment-usage-tab.tsx
│   │   │   └── utils/equipment-status.tsx
│   │   ├── financial/
│   │   │   ├── README.md
│   │   │   ├── add-expense-modal.tsx
│   │   │   ├── financial-coupons-tab.tsx
│   │   │   ├── financial-expenses-tab.tsx
│   │   │   ├── financial-overview-tab.tsx
│   │   │   ├── financial-payments-tab.tsx
│   │   │   ├── financial-referrals-tab.tsx
│   │   │   ├── financial-subscription-tab.tsx
│   │   │   ├── financial-tabs-navigation.tsx
│   │   │   ├── pix-payment-modal.tsx
│   │   │   ├── subscription-plans-selector.tsx
│   │   │   ├── subscription-status-card.tsx
│   │   │   └── subscription-trial-card.tsx
│   │   ├── gym-dashboard.tsx
│   │   ├── gym-equipment.tsx
│   │   ├── gym-equipment-detail.tsx
│   │   ├── gym-financial.tsx
│   │   ├── gym-gamification.tsx
│   │   ├── gym-settings.tsx
│   │   ├── gym-stats.tsx
│   │   ├── gym-student-detail.tsx
│   │   ├── gym-student-detail/
│   │   │   ├── index.tsx
│   │   │   ├── hooks/use-gym-student-detail.ts
│   │   │   └── components/
│   │   │       ├── index.ts
│   │   │       ├── diet-tab.tsx
│   │   │       ├── overview-tab.tsx
│   │   │       ├── payments-tab.tsx
│   │   │       ├── progress-tab.tsx
│   │   │       ├── student-header-card.tsx
│   │   │       ├── student-tab-selector.tsx
│   │   │       └── workouts-tab.tsx
│   │   ├── gym-students.tsx
│   │   ├── add-equipment-modal.tsx
│   │   ├── add-student-modal.tsx
│   │   ├── checkin-modal.tsx
│   │   ├── maintenance-modal.tsx
│   │   ├── membership-plans-page.tsx
│   │   └── index.ts
│   ├── home/
│   │   ├── README.md
│   │   ├── index.ts
│   │   └── home/
│   │       ├── README.md
│   │       ├── continue-workout-card.tsx
│   │       ├── level-progress-card.tsx
│   │       ├── nutrition-status-card.tsx
│   │       ├── recent-workouts-card.tsx
│   │       └── weight-progress-card.tsx
│   ├── modals/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── add-meal-modal.tsx
│   │   ├── create-unit-modal.tsx
│   │   ├── delete-confirmation-modal.tsx
│   │   ├── edit-unit-modal.tsx
│   │   ├── empty-state.tsx
│   │   ├── end-of-list-state.tsx
│   │   ├── equipment-search.tsx
│   │   ├── exercise-alternative-selector.tsx
│   │   ├── exercise-search.tsx
│   │   ├── food-search.tsx
│   │   ├── food-search-chat.tsx
│   │   ├── loading-more-state.tsx
│   │   ├── loading-state.tsx
│   │   ├── modal.tsx
│   │   ├── modal-container.tsx
│   │   ├── modal-content.tsx
│   │   ├── modal-header.tsx
│   │   ├── search-input.tsx
│   │   ├── streak-modal.tsx
│   │   ├── subscription-cancel-dialog.tsx
│   │   ├── workout-chat.tsx
│   │   └── workout-preview-card.tsx
│   ├── navigation/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── app-bottom-nav.tsx
│   │   ├── app-header.tsx
│   │   ├── back-button.tsx
│   │   ├── gym-bottom-nav.tsx
│   │   ├── gym-more-menu.tsx
│   │   └── gym-selector.tsx
│   ├── pwa/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── app-updating-screen.tsx
│   │   ├── app-updating-screen-wrapper.tsx
│   │   └── pwa-update-banner.tsx
│   ├── sections/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── gym-map.tsx
│   │   ├── shop-card.tsx
│   │   ├── subscription-section.tsx
│   │   └── subscription/
│   │       ├── README.md
│   │       ├── billing-period-selector.tsx
│   │       ├── plan-card.tsx
│   │       ├── plan-features.tsx
│   │       ├── plans-selector.tsx
│   │       ├── subscription-status.tsx
│   │       └── trial-offer.tsx
│   ├── trackers/
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── cardio-tracker.tsx
│   │   ├── nutrition-tracker.tsx
│   │   └── weight-tracker.tsx
│   └── workout/
│       ├── README.md
│       ├── index.ts
│       ├── functional-workout.tsx
│       ├── workout-modal.tsx
│       ├── workout-node.tsx
│       └── workout/
│           ├── README.md
│           ├── cardio-config-modal.tsx
│           ├── cardio-exercise-view.tsx
│           ├── exercise-card-view.tsx
│           ├── weight-tracker-overlay.tsx
│           ├── workout-completion-view.tsx
│           ├── workout-footer.tsx
│           ├── workout-header.tsx
│           └── README.md
├── providers/
│   ├── README.md
│   ├── index.ts
│   ├── query-provider.tsx
│   ├── client-providers.tsx
│   ├── student-data-provider.tsx
│   └── theme-provider.tsx
├── templates/
│   ├── README.md
│   ├── index.ts
│   └── layouts/
│       ├── README.md
│       ├── index.ts
│       └── app-layout.tsx
└── ui/
    ├── README.md
    ├── _compat.ts
    ├── use-toast.ts
    ├── alert-dialog.tsx
    ├── badge.tsx
    ├── button-group.tsx
    ├── button.tsx
    ├── calendar.tsx
    ├── card.tsx
    ├── carousel.tsx
    ├── command.tsx
    ├── custom-checkbox.tsx
    ├── dialog.tsx
    ├── duo-button.tsx
    ├── duo-card.tsx
    ├── field.tsx
    ├── food-item-card.tsx
    ├── form-input.tsx
    ├── form.tsx
    ├── history-card.tsx
    ├── input-group.tsx
    ├── input.tsx
    ├── item.tsx
    ├── label.tsx
    ├── macro-card.tsx
    ├── meal-card.tsx
    ├── navigation-button-card.tsx
    ├── option-selector.tsx
    ├── pagination.tsx
    ├── profile-header.tsx
    ├── progress-ring.tsx
    ├── progress.tsx
    ├── range-slider.tsx
    ├── record-card.tsx
    ├── section-card.tsx
    ├── select.tsx
    ├── separator.tsx
    ├── sheet.tsx
    ├── sidebar.tsx
    ├── skeleton.tsx
    ├── stat-card-large.tsx
    ├── stat-card.tsx
    ├── status-badge.tsx
    ├── step-card.tsx
    ├── tabs.tsx
    ├── textarea.tsx
    ├── toast.tsx
    ├── toaster.tsx
    ├── toggle-group.tsx
    ├── toggle.tsx
    ├── tooltip.tsx
    ├── unit-section-card.tsx
    ├── water-intake-card.tsx
    └── workout-node-button.tsx
```

---

## 3. Atoms

### 3.1 atoms/buttons

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `button.tsx` | `Button`, `buttonVariants` | Botão base com variantes CVA | app/gym components, app/student, app/welcome |
| `duo-button.tsx` | `DuoButton`, `duoButtonVariants` | Botão estilo Duo | components/atoms/buttons/index.ts, components/ui/_compat.ts |
| `index.ts` | Re-exporta buttons | Barrel file | components/atoms/index.ts |

### 3.2 atoms/inputs

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `input.tsx` | `Input` | Input de texto base | components/atoms/inputs/index.ts, components/ui/_compat.ts |
| `select.tsx` | `Select`, `SelectOption`, `selectTriggerVariants` | Select customizado | components/organisms/navigation/gym-selector.tsx |
| `textarea.tsx` | `Textarea` | Área de texto | components/atoms/inputs/index.ts, components/ui/_compat.ts |
| `index.ts` | Re-exporta inputs | Barrel file | components/atoms/index.ts |

### 3.3 atoms/progress

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `exercise-steppers.tsx` | `ExerciseSteppers` | Steppers de exercícios | weight-tracker-overlay.tsx, workout-header.tsx |
| `progress-ring.tsx` | `ProgressRing` | Anel de progresso animado | workout-node.tsx |
| `progress.tsx` | `Progress` | Barra de progresso | components/atoms/progress/index.ts |
| `stepper-dot.tsx` | `StepperDot`, `stepperDotVariants` | Ponto do stepper | exercise-steppers.tsx |
| `index.ts` | Re-exporta progress | Barrel file | components/atoms/index.ts |

### 3.4 atoms/modals

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `index.ts` | - | Barrel (vazio ou re-export) | components/atoms/index.ts |

---

## 4. Molecules

### 4.1 molecules/badges

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `badge.tsx` | `Badge`, `badgeVariants` | Badge genérico | - |
| `status-badge.tsx` | `StatusBadge` | Badge de status | - |
| `subscription-badge.tsx` | `SubscriptionBadge` | Badge de assinatura | - |
| `index.ts` | Re-exporta badges | Barrel file | components/molecules/index.ts |

### 4.2 molecules/cards

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `history-card.tsx` | `HistoryCard` | Card de histórico | components/ui/_compat.ts |
| `meal-card.tsx` | `MealCard` | Card de refeição | nutrition-tracker.tsx |
| `record-card.tsx` | `RecordCard` | Card de recorde | components/ui/_compat.ts |
| `stat-card.tsx` | `StatCard` | Card de estatística | components/ui/_compat.ts |
| `step-card.tsx` | `StepCard` | Card de passo (onboarding) | app/gym/onboarding, app/student/onboarding |
| `water-intake-card.tsx` | `WaterIntakeCard` | Card de ingestão de água | nutrition-tracker.tsx |
| `duo-card.tsx` | `DuoCard`, `duoCardVariants` | Card estilo Duo | Diversos (app/gym, app/student, etc.) |
| `macro-card.tsx` | `MacroCard` | Card de macronutrientes | nutrition-tracker.tsx |
| `section-card.tsx` | `SectionCard` | Card de seção | Diversos (app/gym, app/student) |
| `stat-card-large.tsx` | `StatCardLarge` | Card de estatística grande | cardio-tracker, weight-tracker, diet-page |
| `index.ts` | Re-exporta cards | Barrel file | components/molecules/index.ts |

### 4.3 molecules/forms

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `field.tsx` | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, etc. | Campo de formulário | components/ui/_compat.ts |
| `form.tsx` | `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormField` | Formulário react-hook-form | components/ui/_compat.ts |
| `form-input.tsx` | `FormInput` | Input com label | app/gym/onboarding, app/student/onboarding, limitation-selector |
| `input-group.tsx` | `InputGroup`, `InputGroupAddon`, etc. | Grupo de inputs | components/ui/_compat.ts |
| `label.tsx` | `Label` | Label de formulário | components/ui/_compat.ts |
| `index.ts` | Re-exporta forms | Barrel file | components/molecules/index.ts |

### 4.4 molecules/selectors

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `index.ts` | - | Barrel (vazio ou re-export) | components/molecules/index.ts |

### 4.5 molecules (raiz)

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `limitation-selector.tsx` | `LimitationSelector` | Seletor de limitações | app/student/onboarding (consolidated-step3, step7) |
| `relative-time.tsx` | `RelativeTime` | Tempo relativo formatado | app/gym/dashboard, equipment pages |
| `index.ts` | Re-exporta subpastas | Barrel file | - |

---

## 5. Organisms

### 5.1 organisms (raiz)

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `error-boundary.tsx` | `ErrorBoundary` | Boundary de erro React | app/layout.tsx, client-providers.tsx |
| `loading-screen.tsx` | `LoadingScreen` | Tela de carregamento | app/gym/layout.tsx, app/student/layout.tsx |
| `loading-screen-fallback.tsx` | `LoadingScreenFallback` | Fallback de loading | app/gym/layout.tsx |
| `performance-optimizer.tsx` | `PerformanceOptimizer` | Preconnect e otimizações | app/layout.tsx |
| `reminders-banner.tsx` | `RemindersBanner` | Banner de lembretes | - |
| `index.ts` | Re-exporta organisms | Barrel file | - |

### 5.2 organisms/education

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `education-page.tsx` | `EducationPage` | Página de educação | app/student/page-content.tsx |
| `educational-lessons.tsx` | `EducationalLessons` | Lista de lições | app/student/page-content.tsx |
| `muscle-explorer.tsx` | `MuscleExplorer` | Explorador de músculos | app/student/page-content.tsx |
| `index.ts` | Re-exporta | Barrel file | components/organisms/index.ts |

#### organisms/education/components

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `lesson-detail.tsx` | `LessonDetail` | Detalhe da lição | educational-lessons.tsx |
| `lesson-filters.tsx` | `LessonFilters` | Filtros de lições | educational-lessons.tsx |
| `lesson-list.tsx` | `LessonList` | Lista de lições | educational-lessons.tsx |
| `lesson-quiz.tsx` | `LessonQuiz` | Quiz da lição | educational-lessons.tsx |
| `markdown-renderer.tsx` | `MarkdownRenderer` | Renderiza markdown | - |
| `index.ts` | Re-exporta | Barrel file | - |

#### organisms/education/components/muscle

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `exercise-detail.tsx` | `ExerciseDetail` | Detalhe do exercício | muscle-explorer.tsx |
| `exercise-list.tsx` | `ExerciseList` | Lista de exercícios | muscle-explorer.tsx |
| `muscle-detail.tsx` | `MuscleDetail` | Detalhe do músculo | muscle-explorer.tsx |
| `muscle-list.tsx` | `MuscleList` | Lista de músculos | muscle-explorer.tsx |
| `search-bar.tsx` | `SearchBar` | Barra de busca | muscle-explorer.tsx |

### 5.3 organisms/generators

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `ai-diet-generator.tsx` | `AIDietGenerator` | Gerador de dieta com IA | generators/index.ts |
| `ai-workout-generator.tsx` | `AIWorkoutGenerator` | Gerador de treino com IA | generators/index.ts |
| `index.ts` | Re-exporta | Barrel file | components/organisms/index.ts |

### 5.4 organisms/gym

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `gym-dashboard.tsx` | `GymDashboardPage` | Dashboard da academia | app/gym/page-content.tsx |
| `gym-equipment.tsx` | `GymEquipmentPage` | Página de equipamentos | app/gym/equipment/page.tsx |
| `gym-equipment-detail.tsx` | `GymEquipmentDetail` | Detalhe do equipamento | gym-equipment.tsx |
| `gym-financial.tsx` | `GymFinancialPage` | Financeiro da academia | app/gym/page-content.tsx |
| `gym-gamification.tsx` | `GymGamificationPage` | Gamificação | app/gym/page-content.tsx |
| `gym-settings.tsx` | `GymSettingsPage` | Configurações | app/gym/settings/page.tsx |
| `gym-stats.tsx` | `GymStatsPage` | Estatísticas | app/gym/page-content.tsx |
| `gym-student-detail.tsx` | `GymStudentDetail` | Detalhe do aluno | app/gym/students/[id]/page.tsx |
| `gym-students.tsx` | `GymStudentsPage` | Lista de alunos | app/gym/page-content.tsx |
| `add-equipment-modal.tsx` | `AddEquipmentModal` | Modal adicionar equipamento | gym-equipment-detail.tsx, gym-equipment.tsx |
| `add-student-modal.tsx` | `AddStudentModal` | Modal adicionar aluno | gym-students.tsx |
| `checkin-modal.tsx` | `CheckInModal` | Modal de check-in | gym-dashboard.tsx |
| `maintenance-modal.tsx` | `MaintenanceModal` | Modal de manutenção | gym-equipment-detail.tsx |
| `membership-plans-page.tsx` | `MembershipPlansPage` | Planos de assinatura | gym-settings.tsx |
| `index.ts` | Re-exporta | Barrel file | app/gym/academias/page-content.tsx |

#### organisms/gym/academias

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `academias-loading.tsx` | - | Loading de academias | - |
| `create-gym-button.tsx` | `CreateGymButton` | Botão criar academia | - |
| `create-gym-dialog.tsx` | `CreateGymDialog` | Dialog criar academia | - |
| `gym-card.tsx` | `GymCard` | Card de academia | - |
| `hooks/use-academias-page.ts` | `useAcademiasPage` | Hook da página | - |
| `index.ts` | Re-exporta | Barrel file | app/gym/academias/page-content.tsx |

#### organisms/gym/equipment-detail

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `equipment-header-card.tsx` | - | Header do equipamento | - |
| `equipment-info-tab.tsx` | - | Tab de informações | - |
| `equipment-in-use-card.tsx` | - | Card em uso | - |
| `equipment-maintenance-tab.tsx` | - | Tab de manutenção | - |
| `equipment-not-found.tsx` | - | Equipamento não encontrado | - |
| `equipment-stats-grid.tsx` | - | Grid de estatísticas | - |
| `equipment-tabs.tsx` | - | Tabs do equipamento | - |
| `equipment-usage-tab.tsx` | - | Tab de uso | - |
| `utils/equipment-status.tsx` | - | Utilitário de status | - |
| `index.ts` | Re-exporta | Barrel file | app/gym/equipment/[id]/page-content.tsx |

#### organisms/gym/financial

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `add-expense-modal.tsx` | - | Modal adicionar despesa | - |
| `financial-coupons-tab.tsx` | `FinancialCouponsTab` | Tab coupons | gym-financial |
| `financial-expenses-tab.tsx` | `FinancialExpensesTab` | Tab despesas | gym-financial |
| `financial-overview-tab.tsx` | `FinancialOverviewTab` | Tab overview | gym-financial |
| `financial-payments-tab.tsx` | `FinancialPaymentsTab` | Tab pagamentos | gym-financial |
| `financial-referrals-tab.tsx` | `FinancialReferralsTab` | Tab indicações | gym-financial |
| `financial-subscription-tab.tsx` | `FinancialSubscriptionTab` | Tab assinatura | gym-financial |
| `financial-tabs-navigation.tsx` | `FinancialTabsNavigation` | Navegação tabs | - |
| `pix-payment-modal.tsx` | - | Modal PIX | - |
| `subscription-plans-selector.tsx` | `SubscriptionPlansSelector` | Seletor de planos | - |
| `subscription-status-card.tsx` | `SubscriptionStatusCard` | Card status assinatura | - |
| `subscription-trial-card.tsx` | `SubscriptionTrialCard` | Card trial | - |

#### organisms/gym/gym-student-detail

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `index.tsx` | `GymStudentDetail` | Detalhe do aluno | gym-student-detail.tsx |
| `hooks/use-gym-student-detail.ts` | `useGymStudentDetail` | Hook | - |
| `components/diet-tab.tsx` | - | Tab dieta | - |
| `components/overview-tab.tsx` | - | Tab overview | - |
| `components/payments-tab.tsx` | - | Tab pagamentos | - |
| `components/progress-tab.tsx` | - | Tab progresso | - |
| `components/student-header-card.tsx` | - | Header do aluno | - |
| `components/student-tab-selector.tsx` | - | Seletor de tabs | - |
| `components/workouts-tab.tsx` | - | Tab treinos | - |

### 5.5 organisms/home

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `index.ts` | `LevelProgressCard`, `RecentWorkoutsCard`, `WeightProgressCard` | - | components/organisms/index.ts |

#### organisms/home/home

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `continue-workout-card.tsx` | `ContinueWorkoutCard` | Card continuar treino | - |
| `level-progress-card.tsx` | `LevelProgressCard` | Card progresso nível | - |
| `nutrition-status-card.tsx` | `NutritionStatusCard` | Card status nutrição | - |
| `recent-workouts-card.tsx` | `RecentWorkoutsCard` | Card treinos recentes | - |
| `weight-progress-card.tsx` | `WeightProgressCard` | Card progresso peso | - |

### 5.6 organisms/modals

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `add-meal-modal.tsx` | `AddMealModal` | Modal adicionar refeição | app/student/diet/diet-page.tsx |
| `create-unit-modal.tsx` | `CreateUnitModal` | Modal criar unidade | app/student/learn/learning-path.tsx |
| `delete-confirmation-modal.tsx` | `DeleteConfirmationModal` | Modal confirmar exclusão | edit-unit-modal.tsx |
| `edit-unit-modal.tsx` | `EditUnitModal` | Modal editar unidade | app/student/learn/learning-path.tsx |
| `empty-state.tsx` | `EmptyState` | Estado vazio | exercise-search.tsx |
| `end-of-list-state.tsx` | `EndOfListState` | Fim da lista | exercise-search.tsx |
| `equipment-search.tsx` | `EquipmentSearch` | Busca de equipamentos | app/gym/onboarding/step4 |
| `exercise-alternative-selector.tsx` | `ExerciseAlternativeSelector` | Seletor de alternativas | workout-modal.tsx |
| `exercise-search.tsx` | `ExerciseSearch` | Busca de exercícios | edit-unit-modal.tsx |
| `food-search.tsx` | `FoodSearch` | Busca de alimentos | app/student/diet/diet-page.tsx |
| `food-search-chat.tsx` | `FoodSearchChat` | Chat busca alimentos | food-search.tsx |
| `loading-more-state.tsx` | `LoadingMoreState` | Loading mais | exercise-search.tsx |
| `loading-state.tsx` | `LoadingState` | Loading | exercise-search.tsx |
| `modal-container.tsx` | `ModalContainer` | Container do modal | edit-unit-modal, exercise-search |
| `modal-content.tsx` | `ModalContent` | Conteúdo do modal | edit-unit-modal, exercise-search |
| `modal-header.tsx` | `ModalHeader` | Header do modal | edit-unit-modal, exercise-search |
| `search-input.tsx` | `SearchInput` | Input de busca | exercise-search.tsx |
| `streak-modal.tsx` | `StreakModal` | Modal de streak | app-header.tsx |
| `subscription-cancel-dialog.tsx` | `SubscriptionCancelDialog` | Dialog cancelar assinatura | app/student/payments |
| `workout-chat.tsx` | `WorkoutChat` | Chat de treino | edit-unit-modal.tsx |
| `workout-preview-card.tsx` | `WorkoutPreviewCard` | Card preview treino | workout-chat.tsx |
| `index.ts` | Re-exporta modals | Barrel file | app/student/layout-content.tsx |

### 5.7 organisms/navigation

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `app-bottom-nav.tsx` | `AppBottomNav` | Navegação inferior | app-layout.tsx |
| `app-header.tsx` | `AppHeader` | Header do app | app-layout.tsx |
| `back-button.tsx` | `BackButton` | Botão voltar | cardio-functional-page |
| `gym-bottom-nav.tsx` | `GymBottomNav` | Nav inferior gym | - |
| `gym-more-menu.tsx` | `GymMoreMenu` | Menu mais gym | app/gym/page-content.tsx |
| `gym-selector.tsx` | `GymSelector` | Seletor de academia | app-header.tsx |
| `index.ts` | Re-exporta | Barrel file | components/organisms/index.ts |

### 5.8 organisms/pwa

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `app-updating-screen.tsx` | `AppUpdatingScreen` | Tela de atualização | app-updating-screen-wrapper |
| `app-updating-screen-wrapper.tsx` | `AppUpdatingScreenWrapper` | Wrapper de atualização | app/layout.tsx |
| `pwa-update-banner.tsx` | `PWAUpdateBanner` | Banner de atualização PWA | app/layout.tsx |
| `index.ts` | Re-exporta | Barrel file | components/organisms/index.ts |

### 5.9 organisms/sections

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `gym-map.tsx` | `GymMap` | Mapa de academias | app/student/page-content.tsx |
| `shop-card.tsx` | `ShopCard` | Card da loja | - |
| `subscription-section.tsx` | `SubscriptionSection` | Seção de assinatura | financial-subscription-tab, student-payments |
| `index.ts` | Re-exporta | Barrel file | components/organisms/index.ts |

#### organisms/sections/subscription

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `billing-period-selector.tsx` | `BillingPeriodSelector` | Seletor período | plans-selector.tsx |
| `plan-card.tsx` | `PlanCard` | Card de plano | plans-selector.tsx |
| `plan-features.tsx` | `PlanFeatures` | Features do plano | plans-selector.tsx |
| `plans-selector.tsx` | `PlansSelector` | Seletor de planos | subscription-section.tsx |
| `subscription-status.tsx` | `SubscriptionStatus` | Status assinatura | subscription-section.tsx |
| `trial-offer.tsx` | `TrialOffer` | Oferta trial | subscription-section.tsx |

### 5.10 organisms/trackers

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `cardio-tracker.tsx` | `CardioTracker` | Tracker de cardio | cardio-functional-page.tsx |
| `nutrition-tracker.tsx` | `NutritionTracker` | Tracker de nutrição | diet-page.tsx |
| `weight-tracker.tsx` | `WeightTracker` | Tracker de peso | weight-tracker-overlay.tsx |
| `index.ts` | Re-exporta | Barrel file | components/organisms/index.ts |

### 5.11 organisms/workout

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `functional-workout.tsx` | `FunctionalWorkout` | Treino funcional | cardio-functional-page.tsx |
| `workout-modal.tsx` | `WorkoutModal` | Modal de treino | app/student/layout-content.tsx |
| `workout-node.tsx` | `WorkoutNode` | Nó de treino | app/student/learn/learning-path.tsx |
| `index.ts` | Re-exporta | Barrel file | components/organisms/index.ts |

#### organisms/workout/workout

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `cardio-config-modal.tsx` | - | Modal config cardio | workout-modal |
| `cardio-exercise-view.tsx` | - | View exercício cardio | workout-modal |
| `exercise-card-view.tsx` | - | View card exercício | workout-modal |
| `weight-tracker-overlay.tsx` | - | Overlay tracker peso | workout-modal |
| `workout-completion-view.tsx` | - | View conclusão treino | workout-modal |
| `workout-footer.tsx` | - | Footer do treino | workout-modal |
| `workout-header.tsx` | - | Header do treino | workout-modal |

---

## 6. Templates

### 6.1 templates/layouts

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `app-layout.tsx` | `AppLayout` | Layout principal com header e footer | app/gym/layout-content.tsx, app/student/layout-content.tsx |
| `index.ts` | Re-exporta | Barrel file | components/templates/index.ts |

---

## 7. UI

Componentes de UI base (shadcn/ui style). Muitos são wrappers ou re-exports de atoms/molecules.

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `_compat.ts` | Re-exports de compatibilidade | Compatibilidade entre atoms e ui | - |
| `use-toast.ts` | `useToast`, `toast`, `reducer` | Hook de toast | - |
| `alert-dialog.tsx` | `AlertDialog`, `AlertDialogContent`, etc. | Dialog de alerta | membership-plans-page, subscription-cancel-dialog |
| `badge.tsx` | `Badge`, `badgeVariants` | Badge | - |
| `button-group.tsx` | `ButtonGroup`, `ButtonGroupSeparator` | Grupo de botões | - |
| `button.tsx` | `Button`, `buttonVariants` | Botão | Diversos (app/gym, app/student) |
| `calendar.tsx` | `Calendar`, `CalendarDayButton` | Calendário | - |
| `card.tsx` | `Card`, `CardHeader`, `CardContent`, etc. | Card | - |
| `carousel.tsx` | `Carousel`, `CarouselContent`, etc. | Carrossel | - |
| `command.tsx` | `Command`, `CommandDialog`, etc. | Command palette | - |
| `custom-checkbox.tsx` | `CustomCheckbox` | Checkbox customizado | onboarding |
| `dialog.tsx` | `Dialog`, `DialogContent`, etc. | Dialog | streak-modal, command |
| `duo-button.tsx` | Re-export DuoButton | Botão Duo | - |
| `duo-card.tsx` | Re-export DuoCard | Card Duo | - |
| `field.tsx` | `Field`, `FieldLabel`, etc. | Campo | - |
| `food-item-card.tsx` | `FoodItemCard` | Card de alimento | meal-card |
| `form-input.tsx` | `FormInput` | Input de formulário | onboarding, limitation-selector |
| `form.tsx` | `Form`, `FormItem`, etc. | Formulário | - |
| `history-card.tsx` | `HistoryCard` | Card de histórico | profile-content |
| `input-group.tsx` | `InputGroup`, etc. | Grupo de inputs | - |
| `input.tsx` | `Input` | Input | Diversos |
| `item.tsx` | `Item`, `ItemGroup`, etc. | Item | - |
| `label.tsx` | `Label` | Label | Diversos |
| `macro-card.tsx` | `MacroCard` | Card de macronutrientes | - |
| `meal-card.tsx` | `MealCard` | Card de refeição | - |
| `navigation-button-card.tsx` | `NavigationButtonCard` | Card de navegação | gym-more-menu, student-more-menu |
| `option-selector.tsx` | `OptionSelector` | Seletor de opções | Diversos (gym, onboarding) |
| `pagination.tsx` | `Pagination`, etc. | Paginação | - |
| `profile-header.tsx` | `ProfileHeader` | Header de perfil | profile-content |
| `progress-ring.tsx` | `ProgressRing` | Anel de progresso | - |
| `progress.tsx` | `Progress` | Barra de progresso | - |
| `range-slider.tsx` | `RangeSlider` | Slider de range | onboarding |
| `record-card.tsx` | `RecordCard` | Card de recorde | profile-content |
| `section-card.tsx` | `SectionCard` | Card de seção | Diversos |
| `select.tsx` | `Select`, etc. | Select | - |
| `separator.tsx` | `Separator` | Separador | field, button-group, sidebar |
| `sheet.tsx` | `Sheet`, `SheetContent`, etc. | Sheet | sidebar |
| `sidebar.tsx` | `Sidebar`, `SidebarContent`, etc. | Sidebar | - |
| `skeleton.tsx` | `Skeleton` | Skeleton | sidebar |
| `stat-card-large.tsx` | `StatCardLarge` | Card de estatística grande | Diversos |
| `stat-card.tsx` | `StatCard` | Card de estatística | profile-header |
| `status-badge.tsx` | `StatusBadge` | Badge de status | history-card |
| `step-card.tsx` | `StepCard` | Card de passo | - |
| `tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Tabs | equipment/page, students/[id] |
| `textarea.tsx` | `Textarea` | Textarea | input-group |
| `toast.tsx` | `Toast`, `ToastProvider`, etc. | Toast | toaster, use-toast |
| `toaster.tsx` | `Toaster` | Toaster | - |
| `toggle-group.tsx` | `ToggleGroup`, `ToggleGroupItem` | Toggle group | - |
| `toggle.tsx` | `Toggle`, `toggleVariants` | Toggle | toggle-group |
| `tooltip.tsx` | `Tooltip`, `TooltipContent`, etc. | Tooltip | sidebar |
| `unit-section-card.tsx` | `UnitSectionCard` | Card de seção de unidade | learning-path.tsx |
| `water-intake-card.tsx` | `WaterIntakeCard` | Card de água | - |
| `workout-node-button.tsx` | `WorkoutNodeButton` | Botão nó de treino | workout-node.tsx |

---

## 8. Duo

Sistema de componentes com design system "Duo". Exporta via `@/components/duo`.

### 8.1 duo/atoms

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `duo-badge.tsx` | `DuoBadge` | Badge Duo | - |
| `duo-button.tsx` | `DuoButton`, `duoButtonVariants` | Botão Duo | Diversos (via @/components/duo) |
| `duo-icon.tsx` | `DuoIcon` | Ícone Duo | - |
| `duo-progress.tsx` | `DuoProgress` | Progresso Duo | - |
| `duo-text.tsx` | `DuoText` | Texto Duo | - |

### 8.2 duo/molecules

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `duo-achievement-card.tsx` | `DuoAchievementCard` | Card de conquista | - |
| `duo-card.tsx` | `DuoCard` | Card Duo | Muito usado (via @/components/duo) |
| `duo-input.tsx` | `DuoInput` | Input Duo | sidebar, maintenance-modal, form-input |
| `duo-modal.tsx` | `DuoModal` | Modal Duo | - |
| `duo-select.tsx` | `DuoSelect`, `DuoSelectOption` | Select Duo | lesson-filters, limitation-selector, maintenance-modal |
| `duo-stat-card.tsx` | `DuoStatCard` | Card de estatística | cardio, diet |
| `duo-tabs.tsx` | `DuoTabs` | Tabs Duo | - |

### 8.3 duo/organisms

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `duo-color-picker.tsx` | `DuoColorPicker` | Seletor de cor | - |
| `duo-stats-grid.tsx` | `DuoStatsGrid` | Grid de estatísticas | cardio, diet |

### 8.4 duo

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `theme-provider.tsx` | `DuoThemeProvider` | Provider de tema | - |
| `index.ts` | Re-exporta todos os Duo | Barrel file | Muito usado em todo o projeto |

---

## 9. Animations

Componentes de animação baseados em Framer Motion.

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `fade-in.tsx` | `FadeIn` | Animação de fade in | app/gym components, app/student/education, cardio |
| `slide-in.tsx` | `SlideIn` | Animação de slide in | app/gym components, app/student/education |
| `stagger-container.tsx` | `StaggerContainer` | Container para stagger | app/student/learn/learning-path.tsx |
| `stagger-item.tsx` | `StaggerItem` | Item de stagger | app/student/learn/learning-path.tsx |
| `while-in-view.tsx` | `WhileInView` | Animação enquanto em view | app/student/page-content.tsx |

---

## 10. Providers

| Arquivo | Export | Propósito | Onde é usado |
|---------|--------|-----------|---|
| `client-providers.tsx` | `ClientProviders` | Providers do cliente | components/providers/index.ts |
| `query-provider.tsx` | `QueryProvider` | Provider React Query | app/layout.tsx |
| `student-data-provider.tsx` | `StudentDataProvider` | Provider de dados do aluno | - |
| `theme-provider.tsx` | `ThemeProvider` | Provider de tema | components/providers/index.ts |
| `index.ts` | Re-exporta | Barrel file | - |

---

## 11. Resumo Estatístico

| Categoria | Arquivos .tsx | Arquivos .ts | READMEs | Total |
|-----------|---------------|--------------|---------|-------|
| **animations** | 5 | 0 | 1 | 6 |
| **atoms** | 9 | 4 | 5 | 18 |
| **duo** | 16 | 1 | 0 | 17 |
| **molecules** | 22 | 4 | 5 | 31 |
| **organisms** | 95 | 8 | 15 | 118 |
| **providers** | 4 | 1 | 1 | 6 |
| **templates** | 1 | 2 | 2 | 5 |
| **ui** | 52 | 2 | 1 | 55 |
| **TOTAL** | **204** | **22** | **30** | **~256** |

### Observações

- O projeto segue **Atomic Design** com atoms, molecules, organisms e templates.
- **Duo** é um design system paralelo com componentes próprios (atoms, molecules, organisms).
- **UI** contém componentes base (shadcn/ui style) e muitos re-exports para compatibilidade.
- **Organisms** é a maior categoria, com subdomínios: education, gym, modals, navigation, pwa, sections, trackers, workout.
- **Providers** encapsula QueryProvider, ThemeProvider, ClientProviders e StudentDataProvider.
- **Animations** usa Framer Motion e é amplamente usado em páginas gym e student.

---

*Relatório gerado automaticamente. Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.*
