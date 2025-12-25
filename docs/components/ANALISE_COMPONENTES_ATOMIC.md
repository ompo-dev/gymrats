# 📊 ANÁLISE DE COMPONENTES - ATOMIC DESIGN

## ✅ COMPONENTES EM USO

### Atoms (Componentes Básicos)

- ✅ `ui/button.tsx` - Usado em múltiplos lugares
- ✅ `ui/input.tsx` - Usado em forms
- ✅ `ui/label.tsx` - Usado em forms
- ✅ `ui/progress.tsx` - Usado em workout-modal
- ✅ `animations/*` - Todos usados

### Molecules (Componentes Compostos)

- ✅ `ui/duo-card.tsx` - Usado extensivamente
- ✅ `ui/section-card.tsx` - Usado extensivamente
- ✅ `ui/stat-card-large.tsx` - Usado em dashboards
- ✅ `ui/option-selector.tsx` - Usado em múltiplos lugares
- ✅ `ui/select.tsx` - Usado em gym-selector
- ✅ `add-meal-modal.tsx` - Usado em diet-page
- ✅ `food-search.tsx` - Usado em diet-page
- ✅ `equipment-search.tsx` - Usado em workout-modal
- ✅ `exercise-alternative-selector.tsx` - Usado em workout-modal
- ✅ `weight-tracker.tsx` - Usado em workout-modal
- ✅ `back-button.tsx` - Usado em personalization e cardio
- ✅ `subscription/*` - Todos usados

### Organisms (Componentes Complexos)

- ✅ `app-layout.tsx` - Usado em layouts
- ✅ `app-header.tsx` - Usado em app-layout
- ✅ `app-bottom-nav.tsx` - Usado em app-layout
- ✅ `gym-bottom-nav.tsx` - Usado em gym layout
- ✅ `gym-selector.tsx` - Usado em app-header
- ✅ `gym-map.tsx` - Usado em student page
- ✅ `gym-more-menu.tsx` - Usado em gym page
- ✅ `workout-modal.tsx` - Usado em layout-content
- ✅ `workout-node.tsx` - Usado em learning-path
- ✅ `workout/*` - Todos usados
- ✅ `nutrition-tracker.tsx` - Usado em diet-page
- ✅ `shop-card.tsx` - Usado em student page
- ✅ `home/*` - Todos usados
- ✅ `subscription-section.tsx` - Usado em payments

### Templates

- ✅ `app-layout.tsx` - Layout principal

### Providers/Utils

- ✅ `client-providers.tsx` - Usado em layout
- ✅ `error-boundary.tsx` - Usado em layout
- ✅ `loading-screen.tsx` - Usado em layouts
- ✅ `app-updating-screen-wrapper.tsx` - Usado em layout
- ✅ `app-updating-screen.tsx` - Usado em wrapper
- ✅ `pwa-update-banner.tsx` - Usado em layout
- ✅ `performance-optimizer.tsx` - Usado em layout
- ✅ `providers/query-provider.tsx` - Usado em layout
- ✅ `theme-provider.tsx` - Usado em layout
- ✅ `relative-time.tsx` - Usado em gym-dashboard

## ❌ COMPONENTES NÃO UTILIZADOS (PODEM SER REMOVIDOS)

### Componentes de Social/Features Futuras

- ❌ `challenges.tsx` - Não importado em nenhum lugar
- ❌ `friends-list.tsx` - Não importado em nenhum lugar
- ❌ `leaderboard.tsx` - Não importado em nenhum lugar
- ❌ `social-feed.tsx` - Não importado em nenhum lugar

### Componentes de Educação (Não usados diretamente)

- ❌ `lesson-complete.tsx` - Não importado (pode estar em subcomponentes)
- ❌ `lesson-header.tsx` - Não importado (pode estar em subcomponentes)

## 🔄 COMPONENTES COM PADRÕES SIMILARES (CONSOLIDAR)

### Modais

1. **Modal Base Necessário**

   - `add-meal-modal.tsx` - Modal de adicionar refeição
   - `food-search.tsx` - Modal de busca de alimentos
   - `equipment-search.tsx` - Modal de busca de equipamentos
   - `exercise-alternative-selector.tsx` - Modal de seleção de alternativas
   - `subscription/payment-modal.tsx` - Modal de pagamento
   - `streak-modal.tsx` - Modal de streak
   - `subscription-cancel-dialog.tsx` - Dialog de cancelamento

   **Ação**: Criar `atoms/modals/base-modal.tsx` com props dinâmicas

### Cards

1. **Card Base Necessário**

   - `ui/duo-card.tsx` - Card principal
   - `ui/section-card.tsx` - Card de seção
   - `ui/stat-card-large.tsx` - Card de estatística
   - `ui/macro-card.tsx` - Card de macro
   - `ui/meal-card.tsx` - Card de refeição
   - `ui/history-card.tsx` - Card de histórico
   - `ui/record-card.tsx` - Card de recorde
   - `home/*-card.tsx` - Cards de home

   **Ação**: Consolidar em `molecules/cards/base-card.tsx` com variants

### Forms

1. **Form Base Necessário**

   - `ui/form-input.tsx` - Input de form
   - `ui/input-group.tsx` - Grupo de inputs
   - `ui/form.tsx` - Form base
   - `ui/field.tsx` - Campo de form

   **Ação**: Já existe estrutura, apenas organizar

### Trackers

1. **Tracker Base Necessário**

   - `nutrition-tracker.tsx` - Tracker de nutrição
   - `weight-tracker.tsx` - Tracker de peso
   - `cardio-tracker.tsx` - Tracker de cardio

   **Ação**: Criar `organisms/trackers/base-tracker.tsx` com extensibilidade

## 📁 ESTRUTURA PROPOSTA ATOMIC DESIGN

```
components/
├── atoms/
│   ├── buttons/
│   │   ├── button.tsx (de ui/)
│   │   ├── duo-button.tsx (de ui/)
│   │   └── index.ts
│   ├── inputs/
│   │   ├── input.tsx (de ui/)
│   │   ├── textarea.tsx (de ui/)
│   │   ├── select.tsx (de ui/)
│   │   └── index.ts
│   ├── icons/
│   │   └── (ícones são do lucide-react, não precisamos pasta)
│   ├── typography/
│   │   └── (tipografia via classes Tailwind)
│   ├── modals/
│   │   ├── base-modal.tsx (NOVO - consolidar modais)
│   │   └── index.ts
│   ├── progress/
│   │   ├── progress.tsx (de ui/)
│   │   ├── progress-ring.tsx (de ui/)
│   │   └── index.ts
│   └── index.ts
├── molecules/
│   ├── cards/
│   │   ├── base-card.tsx (NOVO - consolidar cards)
│   │   ├── duo-card.tsx (de ui/)
│   │   ├── section-card.tsx (de ui/)
│   │   ├── stat-card.tsx (de ui/)
│   │   ├── stat-card-large.tsx (de ui/)
│   │   ├── macro-card.tsx (de ui/)
│   │   ├── meal-card.tsx (de ui/)
│   │   ├── history-card.tsx (de ui/)
│   │   ├── record-card.tsx (de ui/)
│   │   └── index.ts
│   ├── forms/
│   │   ├── form-input.tsx (de ui/)
│   │   ├── input-group.tsx (de ui/)
│   │   ├── form.tsx (de ui/)
│   │   ├── field.tsx (de ui/)
│   │   ├── label.tsx (de ui/)
│   │   └── index.ts
│   ├── selectors/
│   │   ├── option-selector.tsx (de ui/)
│   │   └── index.ts
│   ├── badges/
│   │   ├── badge.tsx (de ui/)
│   │   ├── status-badge.tsx (de ui/)
│   │   ├── subscription-badge.tsx
│   │   └── index.ts
│   └── index.ts
├── organisms/
│   ├── navigation/
│   │   ├── app-header.tsx
│   │   ├── app-bottom-nav.tsx
│   │   ├── gym-bottom-nav.tsx
│   │   ├── gym-selector.tsx
│   │   ├── back-button.tsx
│   │   └── index.ts
│   ├── sections/
│   │   ├── shop-card.tsx
│   │   ├── subscription-section.tsx
│   │   ├── subscription/ (pasta completa)
│   │   └── index.ts
│   ├── trackers/
│   │   ├── base-tracker.tsx (NOVO)
│   │   ├── nutrition-tracker.tsx
│   │   ├── weight-tracker.tsx
│   │   ├── cardio-tracker.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── add-meal-modal.tsx
│   │   ├── food-search.tsx
│   │   ├── equipment-search.tsx
│   │   ├── exercise-alternative-selector.tsx
│   │   ├── streak-modal.tsx
│   │   └── index.ts
│   ├── workout/
│   │   ├── workout-modal.tsx
│   │   ├── workout-node.tsx
│   │   └── workout/ (pasta completa)
│   ├── home/
│   │   └── (pasta completa)
│   └── index.ts
├── templates/
│   ├── layouts/
│   │   ├── app-layout.tsx
│   │   └── index.ts
│   └── index.ts
├── providers/
│   ├── client-providers.tsx
│   ├── error-boundary.tsx
│   ├── query-provider.tsx
│   ├── theme-provider.tsx
│   └── index.ts
├── animations/
│   └── (pasta completa)
└── index.ts (barrel export principal)
```

## 🎯 PRÓXIMOS PASSOS

1. ✅ Criar estrutura de pastas
2. ✅ Mover componentes para estrutura Atomic
3. ✅ Criar componentes base (base-modal, base-card, base-tracker)
4. ✅ Refatorar componentes para usar bases
5. ✅ Remover componentes não utilizados
6. ✅ Atualizar imports
7. ✅ Testar funcionamento
