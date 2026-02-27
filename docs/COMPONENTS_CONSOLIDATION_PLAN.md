# Plano de Consolidação de Componentes – Eliminação de Duplicatas

**Projeto:** gymrats  
**Data:** 27 de fevereiro de 2025  
**Objetivo:** Eliminar componentes duplicados ou inferiores, consolidando no design system **Duo** e mantendo modais e componentes essenciais.

---

## Princípio Central: Função > Código

**O foco principal não é código idêntico, e sim FUNÇÃO idêntica.** Dois componentes que cumprem o mesmo propósito (ex.: "campo de texto", "alternar abas", "exibir overlay") são duplicatas funcionais, mesmo com implementações diferentes. Essas são as mais importantes de consolidar.

---

## Regras Fundamentais

| Regra | Descrição |
|-------|-----------|
| **Duo é canônico** | Nenhum item da pasta `components/duo/` será removido. Todos são essenciais e amplamente usados. |
| **Modais permanecem** | Todos os modais da aplicação são mantidos. Cada um tem propósito específico (AddMealModal, CheckInModal, etc.). |
| **Substituir, não duplicar** | Componentes inferiores ou duplicados devem ser substituídos pelos equivalentes Duo. |
| **Migração incremental** | Fazer migração por componente, validando cada etapa. |

---

## Índice

1. [Inventário de Duplicatas e Inferiores](#1-inventário-de-duplicatas-e-inferiores)
   - [1.A Duplicatas Funcionais (prioridade)](#1a-duplicatas-funcionais-mesma-função-implementações-diferentes--prioridade)
   - [1.0 Duplicatas Idênticas](#10-duplicatas-idênticas-ui--atomsmolecules)
2. [Plano de Migração por Componente](#2-plano-de-migração-por-componente)
3. [Componentes a Eliminar](#3-componentes-a-eliminar)
4. [Componentes a Manter (sem alteração)](#4-componentes-a-manter-sem-alteração)
5. [Ordem de Execução Recomendada](#5-ordem-de-execução-recomendada)
6. [Checklist de Validação](#6-checklist-de-validação)

---

## 1. Inventário de Duplicatas e Inferiores

### 1.A Duplicatas Funcionais (mesma função, implementações diferentes) — **PRIORIDADE**

Componentes que cumprem o **mesmo propósito** na aplicação. A consolidação aqui reduz complexidade e inconsistência de UX.

| Função | Componentes | Implementação | Canonizar em |
|-------|-------------|---------------|--------------|
| **Campo de texto** | Input (ui), DuoInput.Simple, FormInput | 3 formas de fazer a mesma coisa | DuoInput.Simple |
| **Dropdown / seleção** | Select (atoms), DuoSelect.Simple | 2 implementações | DuoSelect.Simple |
| **Botão** | Button (ui), DuoButton | shadcn vs Duo | DuoButton |
| **Alternar abas** | Tabs (ui/Radix), DuoTabs, FinancialTabsNavigation | Radix, Duo, custom | DuoTabs |
| **Overlay / modal** | Modal (organisms), Dialog (ui/Radix), DuoModal, Sheet, AlertDialog | 5 formas de overlay | Definir: Modal para fullscreen; Dialog/Sheet para Radix; DuoModal para design Duo |
| **Card / bloco de conteúdo** | Card (ui/shadcn), DuoCard, StepCard, SectionCard, StatCard, HistoryCard, RecordCard... | Card base vs Duo vs especializados | DuoCard + variantes (StepCard → DuoCard; StatCard → DuoStatCard) |
| **Barra de progresso** | Progress (ui), DuoProgress, ProgressRing | shadcn, Duo, ring | DuoProgress quando existir; ProgressRing para circular |
| **Badge / tag** | Badge (ui), DuoBadge, StatusBadge | shadcn vs Duo | DuoBadge quando aplicável |
| **Label de formulário** | Label (ui), Label (molecules) | idênticos | molecules (único) |
| **Card de estatística** | StatCard, StatCardLarge, DuoStatCard | 3 formas | DuoStatCard |
| **Card de histórico** | HistoryCard (ui), HistoryCard (molecules) | formatDate diferente | Consolidar em molecules |
| **Card de recorde** | RecordCard (ui), RecordCard (molecules) | idênticos | molecules (único) |

**Resumo:** Para cada função acima, deve existir **um** componente canônico. Os demais são wrappers, migrações pendentes ou legado.

---

### 1.0 Duplicatas Idênticas (ui ↔ atoms/molecules)

Componentes com **código idêntico** em múltiplos caminhos. Manter apenas em **um** local canônico (atoms ou molecules) e remover de ui.

| Componente | ui/ | atoms/ ou molecules/ | Manter em | Ação |
|------------|-----|----------------------|-----------|------|
| **Badge** | `ui/badge.tsx` | `molecules/badges/badge.tsx` | molecules | Remover ui/badge.tsx; atualizar imports |
| **Label** | `ui/label.tsx` | `molecules/forms/label.tsx` | molecules | Remover ui/label.tsx; atualizar imports |
| **Field** | `ui/field.tsx` | `molecules/forms/field.tsx` | molecules | Remover ui/field.tsx; atualizar imports |
| **Form** | `ui/form.tsx` | `molecules/forms/form.tsx` | molecules | Remover ui/form.tsx; atualizar imports |
| **InputGroup** | `ui/input-group.tsx` | `molecules/forms/input-group.tsx` | molecules | Remover ui/input-group.tsx; atualizar imports |
| **StatusBadge** | `ui/status-badge.tsx` | `molecules/badges/status-badge.tsx` | molecules | Remover ui/status-badge.tsx; atualizar imports |
| **RecordCard** | `ui/record-card.tsx` | `molecules/cards/record-card.tsx` | molecules | Remover ui/record-card.tsx; atualizar imports |
| **StatCard** | `ui/stat-card.tsx` | `molecules/cards/stat-card.tsx` | molecules | Remover ui/stat-card.tsx; atualizar imports |
| **Textarea** | `ui/textarea.tsx` | `atoms/inputs/textarea.tsx` | atoms | Remover ui/textarea.tsx; atualizar imports |
| **Progress** | `ui/progress.tsx` | `atoms/progress/progress.tsx` | atoms | Remover ui/progress.tsx; atualizar imports |
| **ProgressRing** | `ui/progress-ring.tsx` | `atoms/progress/progress-ring.tsx` | atoms | Remover ui/progress-ring.tsx; atualizar imports |

**Arquivos que importam de ui/** (precisam ser atualizados para atoms/molecules):
- `field.tsx`, `form.tsx`, `form-input.tsx` → usam `@/components/ui/label`
- `input-group.tsx` (ui e molecules) → usam `@/components/ui/textarea`
- `recent-history-card.tsx` → usa `@/components/ui/history-card`
- `personal-records-card.tsx` → usa `@/components/ui/record-card`
- `workout-node.tsx` → usa `@/components/atoms/progress/progress-ring` (já correto)

---

### 1.0.1 Duplicatas Funcionais com Código Similar (HistoryCard, FormInput)

| Componente | ui/ | molecules/ | Diferença | Ação |
|------------|-----|-------------|-----------|------|
| **HistoryCard** | `ui/history-card.tsx` | `molecules/cards/history-card.tsx` | ui tem `formatDate` rico (Hoje, Ontem, "27 de dez"); molecules usa `toLocaleDateString` simples | **Consolidar** – Manter versão ui em molecules (mais rica); remover ui |
| **FormInput** | `ui/form-input.tsx` | `molecules/forms/form-input.tsx` | ui tem debounce para number, min/max, onBlur; molecules é mais simples | **Consolidar** – Manter versão ui em molecules; remover ui; migrar para DuoInput.Simple no longo prazo |

---

### 1.1 FormInput → DuoInput.Simple

| Aspecto | FormInput | DuoInput.Simple |
|---------|-----------|-----------------|
| **Localização** | `molecules/forms/form-input.tsx`, `ui/form-input.tsx` | `duo/molecules/duo-input.tsx` |
| **Implementação** | Wrapper que usa DuoInput.Simple + motion | Componente base Duo |
| **Props** | value, onChange, delay, size, icon, etc. | label, error, leftIcon, rightIcon, etc. |
| **Conclusão** | **Eliminar** – FormInput é apenas um wrapper. Migrar usos para DuoInput.Simple. |

**Onde FormInput é usado:**

| Arquivo | Usos | Ação |
|---------|------|------|
| `app/gym/onboarding/steps/step1.tsx` | 3 | Trocar por DuoInput.Simple |
| `app/gym/onboarding/steps/step2.tsx` | 5 | Trocar por DuoInput.Simple |
| `app/gym/onboarding/steps/step3.tsx` | 1 | Trocar por DuoInput.Simple |
| `app/student/onboarding/steps/step1.tsx` | 3 | Trocar por DuoInput.Simple |
| `app/student/onboarding/steps/step6.tsx` | 1 | Trocar por DuoInput.Simple |
| `app/student/onboarding/steps/consolidated-step1.tsx` | 5 | Trocar por DuoInput.Simple |
| `components/molecules/limitation-selector.tsx` | 1 | Trocar por DuoInput.Simple |

**Nota:** FormInput adiciona `motion.div` com animação. Onde necessário, envolver com `FadeIn` ou `SlideIn` de `@/components/animations`.

---

### 1.2 Button (ui/button) → DuoButton

| Aspecto | Button | DuoButton |
|---------|--------|-----------|
| **Localização** | `ui/button.tsx`, `atoms/buttons/button.tsx` | `duo/atoms/duo-button.tsx` |
| **Estilo** | shadcn/CVA genérico | Design system Duo |
| **Conclusão** | **Migrar** – Substituir Button por DuoButton onde fizer sentido visual. Manter Button apenas para casos que dependem do estilo shadcn (ex: componentes de terceiros). |

**Onde Button é usado:** Diversos arquivos em app/gym, app/student, organisms. Ver `PLANEJAMENTO_MIGRACAO_DUO_COMPONENTS.md` e grep por `from.*button`.

**Estratégia:** Migração gradual. Priorizar páginas gym e student que já usam DuoCard/DuoStatCard.

---

### 1.3 Input (ui/input, atoms/inputs/input) → DuoInput

| Aspecto | Input | DuoInput |
|---------|-------|----------|
| **Localização** | `ui/input.tsx`, `atoms/inputs/input.tsx` | `duo/molecules/duo-input.tsx` |
| **Uso** | Poucos usos diretos (Input é base) | Amplamente usado via FormInput, DuoInput direto |
| **Conclusão** | **Manter por enquanto** – Input é usado em alguns lugares como base. Avaliar migração após FormInput. |

---

### 1.4 SectionCard → DuoCard

| Aspecto | SectionCard | DuoCard |
|---------|-------------|---------|
| **Localização** | `molecules/cards/section-card.tsx`, `ui/section-card.tsx` | `duo/molecules/duo-card.tsx` |
| **Status** | **Verificar** – Arquivos podem ter sido removidos. READMEs ainda referenciam. | |
| **Conclusão** | **Eliminar** – Ver `docs/PLANEJAMENTO_MIGRACAO_DUO_COMPONENTS.md` para plano detalhado. Criar `DuoSectionCard` ou substituir inline. |

**Arquivos afetados:** ~22 arquivos (ver PLANEJAMENTO_MIGRACAO_DUO_COMPONENTS.md seção 2.2).

---

### 1.5 StatCardLarge → DuoStatCard + DuoStatsGrid

| Aspecto | StatCardLarge | DuoStatCard |
|---------|---------------|-------------|
| **Localização** | `molecules/cards/stat-card-large.tsx`, `ui/stat-card-large.tsx` | `duo/molecules/duo-stat-card.tsx` |
| **Status** | **Verificar** – Arquivos podem ter sido removidos. READMEs ainda referenciam. | |
| **Layout** | Vertical (ícone centralizado) | Horizontal (ícone à esquerda) |
| **Conclusão** | **Eliminar** – Substituir por DuoStatCard dentro de DuoStatsGrid. |

**Arquivos afetados:** ~20 arquivos (ver PLANEJAMENTO_MIGRACAO_DUO_COMPONENTS.md seção 2.1).

---

### 1.6 OptionSelector

| Aspecto | Detalhe |
|---------|---------|
| **Status** | `molecules/selectors/index.ts` exporta apenas `DuoSelect`. Não há arquivo `option-selector.tsx` em components. |
| **Conclusão** | **Já consolidado** – OptionSelector foi substituído por DuoSelect. READMEs podem estar desatualizados. |

---

### 1.7 atoms/buttons/duo-button

| Aspecto | Detalhe |
|---------|---------|
| **Status** | `atoms/buttons/` contém apenas `button.tsx` (re-export de ui/button) e `index.ts`. Não há duo-button em atoms. |
| **ui/duo-button.tsx** | Re-exporta de `@/components/duo`. |
| **Conclusão** | **Sem duplicata** – DuoButton está apenas em duo/ e re-exportado em ui. |

---

### 1.8 molecules/cards/duo-card

| Aspecto | Detalhe |
|---------|---------|
| **Status** | `molecules/cards/index.ts` não exporta duo-card. DuoCard vem de `@/components/duo`. |
| **Conclusão** | **Sem duplicata** – DuoCard está apenas em duo. |

---

### 1.9 _compat.ts

| Aspecto | Detalhe |
|---------|---------|
| **Localização** | `ui/_compat.ts` |
| **Propósito** | Re-exports para compatibilidade durante migração Atomic Design. |
| **Conclusão** | **Eliminar após migração** – Quando todos os componentes forem migrados, remover _compat.ts e atualizar imports. |

---

## 2. Plano de Migração por Componente

### Fase 0: Duplicatas Idênticas (quick wins)

**Objetivo:** Remover arquivos duplicados em ui/ que são idênticos aos de atoms/ ou molecules/.

1. **Label** – Alta prioridade (usado por Form, Field, InputGroup)
   - Atualizar `field.tsx`, `form.tsx` (ui e molecules) para `@/components/molecules/forms/label`
   - Remover `ui/label.tsx`

2. **Textarea** – Alta prioridade (usado por InputGroup)
   - Atualizar `input-group.tsx` (ui e molecules) para `@/components/atoms/inputs/textarea`
   - Remover `ui/textarea.tsx`

3. **RecordCard e HistoryCard** – Profile importa de ui
   - Atualizar `recent-history-card.tsx` e `personal-records-card.tsx` para molecules
   - Para HistoryCard: primeiro copiar `formatDate` rico de ui para molecules
   - Remover `ui/record-card.tsx` e `ui/history-card.tsx`

4. **Form, Field, InputGroup** – Após Label e Textarea
   - Atualizar todos os imports para molecules/forms
   - Remover arquivos de ui/

5. **Badge, StatusBadge, StatCard, Progress, ProgressRing**
   - Atualizar imports pontuais
   - Remover de ui/

---

### Fase 1: FormInput → DuoInput.Simple

1. **Criar helper** (opcional): Se a animação motion for desejada em muitos lugares, criar `DuoInputAnimated` em `components/duo/molecules/` que envolve DuoInput.Simple com FadeIn.
2. **Migrar cada arquivo** listado na seção 1.1.
3. **Remover** `molecules/forms/form-input.tsx` e `ui/form-input.tsx`.
4. **Atualizar** `_compat.ts` e `molecules/forms/index.ts` para remover FormInput.

**Exemplo de migração:**

```tsx
// Antes
<FormInput.Simple
  label="Nome"
  value={name}
  onChange={setName}
  required
  error={errors.name}
/>

// Depois
<DuoInput.Simple
  label="Nome *"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
  error={errors.name}
/>
```

---

### Fase 2: SectionCard → DuoCard (ou DuoSectionCard)

Seguir `docs/PLANEJAMENTO_MIGRACAO_DUO_COMPONENTS.md`:

1. Criar `DuoSectionCard` em `components/duo/molecules/` com API compatível (title, icon, headerAction, variant).
2. Migrar os ~22 arquivos.
3. Remover `section-card.tsx` de molecules e ui.

---

### Fase 3: StatCardLarge → DuoStatCard

Seguir `docs/PLANEJAMENTO_MIGRACAO_DUO_COMPONENTS.md`:

1. Mapear iconColor (duo-orange → var(--duo-accent), etc.).
2. Envolver múltiplos cards com DuoStatsGrid.
3. Migrar os ~20 arquivos.
4. Remover `stat-card-large.tsx`.

---

### Fase 4: Button → DuoButton (parcial)

1. Identificar usos de Button em páginas que já usam Duo (gym, student).
2. Substituir por DuoButton mantendo variantes equivalentes.
3. Manter Button para componentes que precisam do estilo shadcn (dialog, sheet, etc.).

---

### Fase 5: Limpeza _compat.ts

1. Após todas as migrações, remover exports obsoletos de _compat.ts.
2. Atualizar todos os imports que usam _compat.
3. Remover _compat.ts quando vazio.

---

## 3. Componentes a Eliminar

### 3.1 Duplicatas Idênticas (remover de ui/)

| Componente | Remover de | Manter em | Prioridade |
|-------------|------------|-----------|------------|
| Badge | ui/badge.tsx | molecules/badges/badge.tsx | Média |
| Label | ui/label.tsx | molecules/forms/label.tsx | Alta |
| Field | ui/field.tsx | molecules/forms/field.tsx | Média |
| Form | ui/form.tsx | molecules/forms/form.tsx | Alta |
| InputGroup | ui/input-group.tsx | molecules/forms/input-group.tsx | Média |
| StatusBadge | ui/status-badge.tsx | molecules/badges/status-badge.tsx | Média |
| RecordCard | ui/record-card.tsx | molecules/cards/record-card.tsx | Alta |
| StatCard | ui/stat-card.tsx | molecules/cards/stat-card.tsx | Média |
| Textarea | ui/textarea.tsx | atoms/inputs/textarea.tsx | Alta |
| Progress | ui/progress.tsx | atoms/progress/progress.tsx | Média |
| ProgressRing | ui/progress-ring.tsx | atoms/progress/progress-ring.tsx | Média |

### 3.2 Duplicatas Funcionais (consolidar)

| Componente | Ação | Prioridade |
|-------------|------|------------|
| HistoryCard | Manter versão ui em molecules; remover ui | Alta |
| FormInput | Consolidar ui → molecules; migrar para DuoInput.Simple | Alta |

### 3.3 Wrappers e Migrações para Duo

| Componente | Localização | Substituir por | Prioridade |
|-------------|-------------|----------------|------------|
| FormInput | molecules/forms/form-input.tsx, ui/form-input.tsx | DuoInput.Simple | Alta |
| SectionCard | molecules/cards/section-card.tsx, ui/section-card.tsx | DuoCard / DuoSectionCard | Alta |
| StatCardLarge | molecules/cards/stat-card-large.tsx, ui/stat-card-large.tsx | DuoStatCard + DuoStatsGrid | Alta |
| _compat.ts | ui/_compat.ts | Imports diretos | Após migrações |

---

## 4. Componentes a Manter (sem alteração)

### 4.1 Pasta components/duo/ – Intocável

Todos os arquivos em `components/duo/` permanecem. Inclui:

- **Atoms:** DuoBadge, DuoButton, DuoIcon, DuoProgress, DuoText
- **Molecules:** DuoAchievementCard, DuoCard, DuoInput, DuoModal, DuoSelect, DuoStatCard, DuoTabs
- **Organisms:** DuoColorPicker, DuoStatsGrid
- **Theme:** DuoThemeProvider

### 4.2 Modais – Todos mantidos

| Modal | Localização | Propósito |
|-------|-------------|-----------|
| AddMealModal | organisms/modals | Adicionar refeição |
| AddEquipmentModal | organisms/gym | Adicionar equipamento |
| AddStudentModal | organisms/gym | Adicionar aluno |
| CheckInModal | organisms/gym | Check-in de aluno |
| CreateUnitModal | organisms/modals | Criar unidade |
| DeleteConfirmationModal | organisms/modals | Confirmar exclusão |
| EditUnitModal | organisms/modals | Editar unidade |
| EquipmentSearch | organisms/modals | Buscar equipamento |
| ExerciseAlternativeSelector | organisms/modals | Selecionar alternativa |
| ExerciseSearch | organisms/modals | Buscar exercício |
| FoodSearch | organisms/modals | Buscar alimento |
| FoodSearchChat | organisms/modals | Busca com chat |
| MaintenanceModal | organisms/gym | Manutenção |
| Modal (base) | organisms/modals | Base para modais |
| PixPaymentModal | organisms/gym/financial | Pagamento PIX |
| AddExpenseModal | organisms/gym/financial | Adicionar despesa |
| StreakModal | organisms/modals | Modal de sequência |
| SubscriptionCancelDialog | organisms/modals | Cancelar assinatura |
| WorkoutChat | organisms/modals | Chat de treino |
| WorkoutPreviewCard | organisms/modals | Preview de treino |

### 4.3 Outros essenciais

- **Animations:** FadeIn, SlideIn, StaggerContainer, StaggerItem, WhileInView
- **Providers:** QueryProvider, ThemeProvider, ClientProviders
- **Templates:** AppLayout
- **Organisms específicos:** ErrorBoundary, LoadingScreen, trackers (NutritionTracker, WeightTracker, CardioTracker), etc.

---

## 5. Ordem de Execução Recomendada

**Prioridade: consolidar por FUNÇÃO, não por código.**

1. **Função "Campo de texto"** – FormInput → DuoInput.Simple (7 arquivos)
2. **Função "Dropdown"** – Select → DuoSelect.Simple (onde aplicável)
3. **Função "Botão"** – Button → DuoButton (parcial; manter shadcn onde necessário)
4. **Função "Card"** – StepCard → DuoCard; StatCard/StatCardLarge → DuoStatCard
5. **Função "Tabs"** – Tabs (Radix) vs DuoTabs: avaliar migração EquipmentTabs para DuoTabs
6. **Função "Overlay"** – Modal vs Dialog vs DuoModal: manter separação (Modal=fullscreen Duo; Dialog/Sheet=Radix para shadcn)
7. **Duplicatas idênticas** (11 componentes) – remover ui/, atualizar imports
8. **HistoryCard** – consolidar formatDate rico em molecules; remover ui
9. **_compat.ts** – limpeza final

---

## 6. Checklist de Validação

### Por função (prioridade)
- [ ] **Campo de texto:** apenas DuoInput.Simple (FormInput eliminado)
- [ ] **Dropdown:** apenas DuoSelect.Simple (Select eliminado onde aplicável)
- [ ] **Botão:** DuoButton em páginas Duo; Button apenas para shadcn
- [ ] **Card:** DuoCard + DuoStatCard; StepCard migrado para DuoCard
- [ ] **Tabs:** DuoTabs onde faz sentido; Tabs Radix apenas onde necessário

### Duplicatas idênticas (código)
- [ ] Badge, Label, Field, Form, InputGroup removidos de ui/
- [ ] StatusBadge, RecordCard, StatCard removidos de ui/
- [ ] Textarea, Progress, ProgressRing removidos de ui/
- [ ] HistoryCard consolidado (formatDate rico em molecules); ui removido

### Migrações Duo
- [ ] FormInput eliminado; todos os usos migrados para DuoInput.Simple
- [ ] SectionCard eliminado; DuoCard/DuoSectionCard em uso (se existir)
- [ ] StatCardLarge eliminado; DuoStatCard + DuoStatsGrid em uso (se existir)

### Geral
- [ ] Nenhum componente removido de components/duo/
- [ ] Todos os modais mantidos e funcionais
- [ ] Build passa sem erros
- [ ] Testes manuais em fluxos críticos (onboarding, gym, student, profile)
- [ ] _compat.ts removido ou minimizado

---

## Referências

- `COMPONENTS_MEGA_REPORT.md` – Mapeamento completo da pasta components/
- `docs/PLANEJAMENTO_MIGRACAO_DUO_COMPONENTS.md` – Plano detalhado SectionCard e StatCardLarge
- `components/duo/` – Design system canônico
