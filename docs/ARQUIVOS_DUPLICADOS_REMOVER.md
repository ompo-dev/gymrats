# 🗑️ ARQUIVOS DUPLICADOS PARA REMOVER

## ⚠️ ATENÇÃO

Todos estes arquivos foram **movidos para a estrutura Atomic Design** e são **duplicados**. Eles podem ser removidos após confirmar que:

1. ✅ Todos os imports foram atualizados
2. ✅ A aplicação está funcionando corretamente
3. ✅ Não há erros de build ou runtime

## 📋 ARQUIVOS PARA REMOVER

### Components Raiz (duplicados - já movidos)

#### Modals
- `components/add-meal-modal.tsx` → `organisms/modals/add-meal-modal.tsx`
- `components/equipment-search.tsx` → `organisms/modals/equipment-search.tsx`
- `components/exercise-alternative-selector.tsx` → `organisms/modals/exercise-alternative-selector.tsx`
- `components/food-search.tsx` → `organisms/modals/food-search.tsx`
- `components/streak-modal.tsx` → `organisms/modals/streak-modal.tsx`
- `components/subscription-cancel-dialog.tsx` → `organisms/modals/subscription-cancel-dialog.tsx`
- `components/workout-modal.tsx` → `organisms/workout/workout-modal.tsx`

#### Navigation
- `components/app-bottom-nav.tsx` → `organisms/navigation/app-bottom-nav.tsx`
- `components/app-header.tsx` → `organisms/navigation/app-header.tsx`
- `components/back-button.tsx` → `organisms/navigation/back-button.tsx`
- `components/gym-bottom-nav.tsx` → `organisms/navigation/gym-bottom-nav.tsx`
- `components/gym-selector.tsx` → `organisms/navigation/gym-selector.tsx`
- `components/gym-more-menu.tsx` → `organisms/navigation/gym-more-menu.tsx`

#### Trackers
- `components/cardio-tracker.tsx` → `organisms/trackers/cardio-tracker.tsx`
- `components/nutrition-tracker.tsx` → `organisms/trackers/nutrition-tracker.tsx`
- `components/weight-tracker.tsx` → `organisms/trackers/weight-tracker.tsx`

#### Sections
- `components/shop-card.tsx` → `organisms/sections/shop-card.tsx`
- `components/subscription-section.tsx` → `organisms/sections/subscription-section.tsx`
- `components/gym-map.tsx` → `organisms/sections/gym-map.tsx`

#### Workout
- `components/workout-node.tsx` → `organisms/workout/workout-node.tsx`
- `components/functional-workout.tsx` → `organisms/workout/functional-workout.tsx`

#### Generators
- `components/ai-diet-generator.tsx` → `organisms/generators/ai-diet-generator.tsx`
- `components/ai-workout-generator.tsx` → `organisms/generators/ai-workout-generator.tsx`

#### Education
- `components/lesson-complete.tsx` → `organisms/education/lesson-complete.tsx`
- `components/lesson-header.tsx` → `organisms/education/lesson-header.tsx`

#### PWA
- `components/app-updating-screen.tsx` → `organisms/pwa/app-updating-screen.tsx`
- `components/app-updating-screen-wrapper.tsx` → `organisms/pwa/app-updating-screen-wrapper.tsx`
- `components/pwa-update-banner.tsx` → `organisms/pwa/pwa-update-banner.tsx`

#### Outros Organisms
- `components/error-boundary.tsx` → `organisms/error-boundary.tsx`
- `components/loading-screen.tsx` → `organisms/loading-screen.tsx`
- `components/performance-optimizer.tsx` → `organisms/performance-optimizer.tsx`

#### Molecules
- `components/relative-time.tsx` → `molecules/relative-time.tsx`
- `components/subscription-badge.tsx` → `molecules/badges/subscription-badge.tsx`

#### Templates
- `components/app-layout.tsx` → `templates/layouts/app-layout.tsx`

#### Providers
- `components/theme-provider.tsx` → `providers/theme-provider.tsx`
- `components/client-providers.tsx` → `providers/client-providers.tsx`

### Pastas Duplicadas

#### Workout
- `components/workout/` → `organisms/workout/workout/`
  - `cardio-exercise-view.tsx`
  - `strength-exercise-view.tsx`
  - `workout-actions.tsx`
  - `workout-completion-screen.tsx`
  - `workout-header.tsx`

#### Subscription
- `components/subscription/` → `organisms/sections/subscription/`
  - `billing-period-selector.tsx`
  - `payment-modal.tsx`
  - `plan-card.tsx`
  - `plan-features.tsx`
  - `plans-selector.tsx`
  - `subscription-status.tsx`
  - `trial-offer.tsx`

## 📝 INSTRUÇÕES PARA REMOÇÃO

1. **Fazer backup** antes de remover
2. **Testar aplicação** após cada remoção
3. **Remover em lotes** (não tudo de uma vez)
4. **Verificar imports** após cada remoção
5. **Atualizar documentação** após remoção

## 🔍 VERIFICAÇÃO ANTES DE REMOVER

Execute estes comandos para verificar se os arquivos ainda estão sendo usados:

```bash
# Verificar se algum arquivo ainda é importado
grep -r "from.*add-meal-modal" app/ components/ stores/ hooks/
grep -r "from.*workout-modal" app/ components/ stores/ hooks/
grep -r "from.*app-layout" app/ components/ stores/ hooks/
```

Se não houver resultados, os arquivos podem ser removidos com segurança.

## ✅ ESTRUTURA FINAL

Após remover os duplicados, a estrutura será:

```
components/
├── atoms/              # Componentes básicos
├── molecules/          # Combinações simples
├── organisms/          # Componentes complexos
│   ├── generators/    # Geradores de IA
│   ├── education/     # Componentes educacionais
│   ├── pwa/           # Componentes PWA
│   ├── navigation/    # Navegação
│   ├── sections/      # Seções
│   ├── trackers/      # Rastreadores
│   ├── modals/        # Modais
│   └── workout/       # Treinos
├── templates/         # Templates de layout
└── providers/         # Providers React
```

