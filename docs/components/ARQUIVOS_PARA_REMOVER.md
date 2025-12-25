# 🗑️ ARQUIVOS PARA REMOVER - REFATORAÇÃO ATOMIC DESIGN

## ⚠️ ATENÇÃO

Estes arquivos são **duplicados** e foram movidos para a estrutura Atomic Design. Eles podem ser removidos após confirmar que:

1. ✅ Todos os imports foram atualizados
2. ✅ A aplicação está funcionando corretamente
3. ✅ Não há erros de build ou runtime

## 📋 ARQUIVOS DUPLICADOS PARA REMOVER

### Components Raiz (duplicados)
```
components/
├── add-meal-modal.tsx                    → Movido para organisms/modals/
├── app-bottom-nav.tsx                    → Movido para organisms/navigation/
├── app-header.tsx                        → Movido para organisms/navigation/
├── app-layout.tsx                        → Movido para templates/layouts/
├── back-button.tsx                       → Movido para organisms/navigation/
├── cardio-tracker.tsx                    → Movido para organisms/trackers/
├── equipment-search.tsx                   → Movido para organisms/modals/
├── exercise-alternative-selector.tsx     → Movido para organisms/modals/
├── food-search.tsx                       → Movido para organisms/modals/
├── gym-bottom-nav.tsx                    → Movido para organisms/navigation/
├── gym-selector.tsx                      → Movido para organisms/navigation/
├── nutrition-tracker.tsx                 → Movido para organisms/trackers/
├── shop-card.tsx                         → Movido para organisms/sections/
├── streak-modal.tsx                      → Movido para organisms/modals/
├── subscription-badge.tsx                → Movido para molecules/badges/
├── subscription-cancel-dialog.tsx        → Movido para organisms/modals/
├── subscription-section.tsx              → Movido para organisms/sections/
├── weight-tracker.tsx                    → Movido para organisms/trackers/
├── workout-modal.tsx                     → Movido para organisms/workout/
└── workout-node.tsx                      → Movido para organisms/workout/
```

### Components/Home (duplicados)
```
components/home/
├── level-progress-card.tsx               → Movido para organisms/home/home/
├── recent-workouts-card.tsx              → Movido para organisms/home/home/
└── weight-progress-card.tsx             → Movido para organisms/home/home/
```

### Components/Subscription (duplicados)
```
components/subscription/
├── billing-period-selector.tsx          → Movido para organisms/sections/subscription/
├── payment-modal.tsx                     → Movido para organisms/sections/subscription/
├── plan-card.tsx                         → Movido para organisms/sections/subscription/
├── plan-features.tsx                     → (Verificar se foi movido)
├── plans-selector.tsx                    → Movido para organisms/sections/subscription/
├── subscription-status.tsx               → Movido para organisms/sections/subscription/
└── trial-offer.tsx                      → Movido para organisms/sections/subscription/
```

### Components/Workout (duplicados)
```
components/workout/
├── cardio-exercise-view.tsx              → Movido para organisms/workout/workout/
├── strength-exercise-view.tsx             → Movido para organisms/workout/workout/
├── workout-actions.tsx                  → (Verificar se foi movido)
├── workout-completion-screen.tsx         → Movido para organisms/workout/workout/
└── workout-header.tsx                    → Movido para organisms/workout/workout/
```

### Components/UI (duplicados - já movidos)
```
components/ui/
├── button.tsx                            → Movido para atoms/buttons/
├── duo-button.tsx                        → Movido para atoms/buttons/
├── input.tsx                             → Movido para atoms/inputs/
├── textarea.tsx                          → Movido para atoms/inputs/
├── select.tsx                            → Movido para atoms/inputs/
├── progress.tsx                          → Movido para atoms/progress/
├── progress-ring.tsx                     → Movido para atoms/progress/
├── duo-card.tsx                          → Movido para molecules/cards/
├── section-card.tsx                      → Movido para molecules/cards/
├── stat-card-large.tsx                   → Movido para molecules/cards/
├── stat-card.tsx                         → Movido para molecules/cards/
├── macro-card.tsx                        → Movido para molecules/cards/
├── meal-card.tsx                         → Movido para molecules/cards/
├── history-card.tsx                      → Movido para molecules/cards/
├── record-card.tsx                       → Movido para molecules/cards/
├── water-intake-card.tsx                 → Movido para molecules/cards/
├── step-card.tsx                         → Movido para molecules/cards/
├── option-selector.tsx                   → Movido para molecules/selectors/
├── form-input.tsx                        → Movido para molecules/forms/
├── input-group.tsx                       → Movido para molecules/forms/
├── form.tsx                              → Movido para molecules/forms/
├── field.tsx                             → Movido para molecules/forms/
├── label.tsx                             → Movido para molecules/forms/
├── badge.tsx                             → Movido para molecules/badges/
├── status-badge.tsx                      → Movido para molecules/badges/
└── _compat.ts                            → Arquivo de compatibilidade (remover após migração completa)
```

## ✅ COMPONENTES QUE DEVEM PERMANECER EM `components/ui/`

Estes componentes são específicos do shadcn/ui ou não foram movidos ainda:

- `alert-dialog.tsx` - Componente do shadcn/ui
- `button-group.tsx` - Componente do shadcn/ui
- `calendar.tsx` - Componente do shadcn/ui
- `card.tsx` - Componente base do shadcn/ui
- `carousel.tsx` - Componente do shadcn/ui
- `command.tsx` - Componente do shadcn/ui
- `custom-checkbox.tsx` - Componente customizado
- `dialog.tsx` - Componente do shadcn/ui
- `food-item-card.tsx` - Componente específico
- `item.tsx` - Componente específico
- `navigation-button-card.tsx` - Componente específico
- `pagination.tsx` - Componente do shadcn/ui
- `profile-header.tsx` - Componente específico
- `range-slider.tsx` - Componente específico
- `separator.tsx` - Componente do shadcn/ui
- `sheet.tsx` - Componente do shadcn/ui
- `sidebar.tsx` - Componente do shadcn/ui
- `skeleton.tsx` - Componente do shadcn/ui
- `tabs.tsx` - Componente do shadcn/ui
- `toast.tsx` - Componente do shadcn/ui
- `toaster.tsx` - Componente do shadcn/ui
- `toggle-group.tsx` - Componente do shadcn/ui
- `toggle.tsx` - Componente do shadcn/ui
- `tooltip.tsx` - Componente do shadcn/ui
- `unit-section-card.tsx` - Componente específico
- `use-toast.ts` - Hook do shadcn/ui
- `workout-node-button.tsx` - Componente específico

## 📝 INSTRUÇÕES PARA REMOÇÃO

1. **Fazer backup** antes de remover
2. **Testar aplicação** após cada remoção
3. **Remover em lotes** (não tudo de uma vez)
4. **Verificar imports** após cada remoção
5. **Atualizar documentação** após remoção

## 🔍 VERIFICAÇÃO ANTES DE REMOVER

Execute estes comandos para verificar se os arquivos ainda estão sendo usados:

```bash
# Verificar se workout-modal.tsx ainda é usado
grep -r "from.*workout-modal" app/ components/ stores/ hooks/

# Verificar se app-layout.tsx ainda é usado
grep -r "from.*app-layout" app/ components/ stores/ hooks/

# Verificar outros arquivos
grep -r "from.*add-meal-modal" app/ components/ stores/ hooks/
```

Se não houver resultados, os arquivos podem ser removidos com segurança.

