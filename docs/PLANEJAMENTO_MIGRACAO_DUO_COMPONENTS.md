# Planejamento: Migração StatCardLarge e SectionCard → Componentes Duo

## Objetivo

Substituir todos os usos de `StatCardLarge` e `SectionCard` pelos componentes do design system Duo (`DuoStatCard`, `DuoCard`, `DuoStatsGrid`, `DuoAchievementCard` quando aplicável) em toda a aplicação, e em seguida remover os arquivos obsoletos.

---

## 1. Mapeamento de APIs

### 1.1 StatCardLarge → DuoStatCard + DuoStatsGrid

| StatCardLarge (atual) | DuoStatCard (novo) | Observação |
|----------------------|-------------------|------------|
| `icon` (obrigatório) | `icon` (opcional) | Manter obrigatório nos usos |
| `value` | `value` | Direto |
| `label` | `label` | Direto |
| `subtitle` | `badge` | Mapear: subtitle → badge |
| `iconColor` ("duo-orange", etc.) | `iconColor` (string CSS var) | Mapear para `var(--duo-accent)`, `var(--duo-primary)`, etc. |

**Mapa iconColor (StatCardLarge → DuoStatCard):**
```ts
const iconColorMap: Record<string, string> = {
  "duo-orange": "var(--duo-accent)",
  "duo-yellow": "var(--duo-warning)",
  "duo-blue": "var(--duo-secondary)",
  "duo-green": "var(--duo-primary)",
  "duo-purple": "#A560E8", // ou var(--duo-purple) se existir
  "duo-red": "var(--duo-danger)",
};
```

**Layout:** StatCardLarge é vertical (ícone centralizado, valor grande). DuoStatCard é horizontal (ícone à esquerda). A mudança visual é intencional — design system Duo.

**Grid:** Onde há múltiplos StatCardLarge em grid (ex: 2x2, 4 colunas), envolver com `DuoStatsGrid` com `columns={2}` ou `columns={4}`.

---

### 1.2 SectionCard → DuoCard + DuoCardHeader

| SectionCard (atual) | DuoCard (novo) | Observação |
|---------------------|----------------|------------|
| `title` | DuoCardHeader + h2 | Manual |
| `icon` | DuoCardHeader + Icon | Manual |
| `headerAction` | DuoCardHeader (como child) | Manual |
| `variant` | DuoCard `variant` + `className` | DuoCard tem: default, elevated, outlined, interactive. SectionCard tem: default, small, highlighted, blue, orange, yellow. **Precisamos estender DuoCard ou usar className.** |
| `children` | children dentro de DuoCard | Direto |

**Padrão de substituição:**
```tsx
// Antes
<SectionCard title="Título" icon={Icon} headerAction={action} variant="blue">
  {children}
</SectionCard>

// Depois
<DuoCard variant="default" padding="md" className={variant === "blue" ? "border-2 border-[var(--duo-secondary)] bg-[var(--duo-secondary)]/10" : ""}>
  <DuoCardHeader>
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-5 w-5" style={{ color: "var(--duo-secondary)" }} />}
      <h2 className="font-bold text-[var(--duo-fg)]">{title}</h2>
    </div>
    {headerAction}
  </DuoCardHeader>
  {children}
</DuoCard>
```

**Decisão:** Criar um componente auxiliar `DuoSectionCard` em `components/duo/molecules/` que encapsule DuoCard + DuoCardHeader com a API do SectionCard, para evitar repetição em ~25 arquivos. Ou fazer a substituição inline em cada arquivo. **Recomendação:** criar `DuoSectionCard` para manter consistência e facilitar manutenção.

---

## 2. Inventário de Arquivos a Modificar

### 2.1 StatCardLarge (20 arquivos)

| Arquivo | Import atual | Usos |
|---------|--------------|------|
| `app/student/cardio/cardio-functional-page.tsx` | molecules/cards | 2 |
| `app/gym/components/gym-gamification.tsx` | ui | 4 |
| `app/student/page-content.tsx` | molecules/cards | 4 |
| `app/gym/components/gym-equipment-detail.tsx` | ui | 4 |
| `app/gym/components/gym-dashboard.tsx` | ui | 4 |
| `components/organisms/trackers/cardio-tracker.tsx` | molecules/cards | 4 |
| `components/organisms/trackers/weight-tracker.tsx` | molecules/cards | 1 |
| `app/gym/students/[id]/page.tsx` | ui | 8 |
| `app/student/payments/student-payments-page.tsx` | molecules/cards | 2 |
| `app/student/profile/profile-content.tsx` | ui | 4 |
| `app/gym/components/gym-stats.tsx` | ui | 4 |
| `app/gym/equipment/[id]/page-content.tsx` | ui | 4 |
| `app/gym/components/financial/financial-overview-tab.tsx` | molecules/cards | 4 |
| `app/gym/components/gym-student-detail.tsx` | ui | 4 |
| `app/gym/components/gym-equipment.tsx` | ui | 4 |
| `app/student/diet/diet-page.tsx` | molecules/cards | 2 |

### 2.2 SectionCard (22 arquivos)

| Arquivo | Import atual | Usos |
|---------|--------------|------|
| `components/home/level-progress-card.tsx` | ui | 1 |
| `components/organisms/trackers/nutrition-tracker.tsx` | molecules/cards | 2 |
| `app/gym/components/financial/subscription-plans-selector.tsx` | molecules/cards | 1 |
| `app/gym/equipment/[id]/page-content.tsx` | ui | 6 |
| `app/gym/components/gym-settings.tsx` | ui | 4 |
| `components/organisms/trackers/cardio-tracker.tsx` | molecules/cards | 3 |
| `app/student/payments/student-payments-page.tsx` | molecules/cards | 1 |
| `components/ui/water-intake-card.tsx` | ./section-card | 1 |
| `components/organisms/sections/subscription/plans-selector.tsx` | molecules/cards | 1 |
| `components/home/weight-progress-card.tsx` | ui | 1 |
| `components/organisms/home/home/weight-progress-card.tsx` | molecules/cards | 1 |
| `app/student/profile/profile-content.tsx` | ui | 4 |
| `components/organisms/education/components/muscle/muscle-detail.tsx` | molecules/cards | 3 |
| `app/student/learn/learning-path.tsx` | molecules/cards | 1 |
| `app/gym/components/gym-dashboard.tsx` | ui | 4 |
| `app/student/gyms/gym-profile-view.tsx` | molecules/cards | 4 |
| `app/student/education/components/lesson-quiz.tsx` | ui | 1 |
| `app/gym/components/gym-student-detail.tsx` | ui | 11 |
| `components/organisms/home/home/level-progress-card.tsx` | molecules/cards | 1 |
| `components/organisms/home/home/continue-workout-card.tsx` | molecules/cards | 3 |
| `components/organisms/education/components/lesson-detail.tsx` | (verificar) | ? |
| `app/gym/components/gym-equipment-detail.tsx` | ui | 8 |

---

## 3. Decisões Técnicas

### 3.1 DuoSectionCard (recomendado)

Criar `components/duo/molecules/duo-section-card.tsx` que replica a API do SectionCard usando DuoCard + DuoCardHeader internamente. Assim:
- Uma única implementação
- Todas as variants (blue, orange, yellow, highlighted) mapeadas
- Migração = trocar import + eventual ajuste de props

### 3.2 DuoStatsGrid

Usar `DuoStatsGrid` onde há grid de stats:
- `columns={2}` para layouts 2 colunas
- `columns={4}` para layouts 4 colunas (ex: gym-dashboard)

### 3.3 DuoAchievementCard

Usar **apenas** onde há progresso com current/total (ex: conquistas, níveis). Não substituir StatCardLarge por DuoAchievementCard — são propósitos diferentes.

---

## 4. Ordem de Execução

### Fase 1: Preparação
1. **Criar `DuoSectionCard`** em `components/duo/molecules/duo-section-card.tsx` com API compatível ao SectionCard (title, icon, headerAction, variant, children).
2. **Exportar** em `components/duo/index.ts`.
3. **Verificar** se DuoCard do duo precisa de variants adicionais (blue, orange, yellow, highlighted) ou se DuoSectionCard aplica via className.

### Fase 2: Migração StatCardLarge → DuoStatCard
1. Migrar arquivos que usam StatCardLarge (lista na seção 2.1).
2. Envolver grids com DuoStatsGrid onde aplicável.
3. Mapear `subtitle` → `badge`, `iconColor` → string CSS var.

### Fase 3: Migração SectionCard → DuoSectionCard (ou DuoCard inline)
1. Migrar arquivos que usam SectionCard (lista na seção 2.2).
2. Trocar import para `@/components/duo` e componente `DuoSectionCard`.

### Fase 4: Limpeza
1. Remover exports de `_compat.ts` (SectionCard, StatCardLarge).
2. Remover de `components/molecules/cards/index.ts`.
3. **Deletar** arquivos:
   - `components/ui/stat-card-large.tsx`
   - `components/molecules/cards/stat-card-large.tsx`
   - `components/ui/section-card.tsx`
   - `components/molecules/cards/section-card.tsx`
4. Atualizar READMEs e documentação que referenciam esses componentes.

---

## 5. Arquivos que Importam de Ambos (StatCardLarge + SectionCard)

- `app/gym/components/gym-dashboard.tsx`
- `app/gym/components/gym-equipment-detail.tsx`
- `app/gym/components/gym-student-detail.tsx`
- `app/gym/equipment/[id]/page-content.tsx`
- `app/student/profile/profile-content.tsx`
- `components/organisms/trackers/cardio-tracker.tsx`
- `app/student/payments/student-payments-page.tsx`

Priorizar esses para migração em lote.

---

## 6. Riscos e Mitigações

| Risco | Mitigação |
|-------|------------|
| Mudança visual (StatCardLarge vertical → DuoStatCard horizontal) | Validar em theme-test antes de migrar em massa. Se necessário, criar variante vertical no DuoStatCard. |
| SectionCard variant (blue, orange, yellow) não existe no DuoCard | DuoSectionCard aplica estilos via className ou DuoCard recebe variants adicionais. |
| WaterIntakeCard usa SectionCard internamente | Migrar WaterIntakeCard para usar DuoSectionCard/DuoCard. |
| UnitSectionCard | **Não depende** de SectionCard — é componente independente. Nenhuma alteração necessária. |

---

## 7. Checklist Final

- [ ] DuoSectionCard criado e exportado
- [ ] Todos os usos de StatCardLarge migrados para DuoStatCard
- [ ] Todos os usos de SectionCard migrados para DuoSectionCard/DuoCard
- [ ] DuoStatsGrid aplicado onde há grid de stats
- [ ] _compat.ts atualizado (remover exports)
- [ ] molecules/cards/index.ts atualizado
- [ ] Arquivos stat-card-large e section-card deletados (ui e molecules)
- [ ] Build e testes passando
- [ ] Documentação atualizada
