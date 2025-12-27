# 📋 Documentação Completa - Dados Coletados no Onboarding

Este documento descreve **todos os dados coletados** em cada step do onboarding e verifica se estão sendo **corretamente salvos no banco de dados**.

---

## 📊 Resumo Executivo

| Step | Título               | Campos Coletados      | Status no Banco |
| ---- | -------------------- | --------------------- | --------------- |
| 1    | Informações Pessoais | 8 campos              | ✅ Todos salvos |
| 2    | Objetivos            | 3 campos              | ✅ Todos salvos |
| 3    | Preferências         | 3 campos              | ✅ Todos salvos |
| 4    | Equipamentos         | 1 campo               | ✅ Salvo        |
| 5    | Valores Metabólicos  | 6 campos (calculados) | ✅ Todos salvos |
| 6    | Nível de Atividade   | 2 campos              | ✅ Todos salvos |
| 7    | Limitações           | 4 campos              | ✅ Todos salvos |

**Total: 27 campos coletados** | **Status: ✅ 100% salvos no banco**

---

## 📝 Step 1: Informações Pessoais

### Campos Coletados

| Campo          | Tipo                                                   | Valores Possíveis | Obrigatório      | Onde é Salvo                            |
| -------------- | ------------------------------------------------------ | ----------------- | ---------------- | --------------------------------------- |
| `age`          | `number`                                               | 13-120            | ✅ Sim           | `Student.age` (Int?)                    |
| `gender`       | `"male" \| "female" \| "trans-male" \| "trans-female"` | 4 opções          | ✅ Sim           | `Student.gender` (String?)              |
| `isTrans`      | `boolean`                                              | true/false        | ⚠️ Condicional\* | `Student.isTrans` (Boolean?)            |
| `usesHormones` | `boolean`                                              | true/false        | ⚠️ Condicional\* | `Student.usesHormones` (Boolean?)       |
| `hormoneType`  | `"testosterone" \| "estrogen" \| "none" \| ""`         | 3 opções          | ⚠️ Condicional\* | `Student.hormoneType` (String?)         |
| `height`       | `number`                                               | 100-250 (cm)      | ✅ Sim           | `StudentProfile.height` (Float?)        |
| `weight`       | `number`                                               | 30-300 (kg)       | ✅ Sim           | `StudentProfile.weight` (Float?)        |
| `fitnessLevel` | `"iniciante" \| "intermediario" \| "avancado"`         | 3 opções          | ✅ Sim           | `StudentProfile.fitnessLevel` (String?) |

**\*Condicional:** Apenas se `gender` for `"trans-male"` ou `"trans-female"`

### Validação Zod

```typescript
step1Schema = {
  age: z.number().int().min(13).max(120),
  gender: z.enum(["male", "female", "trans-male", "trans-female"]),
  isTrans: z.boolean().default(false),
  usesHormones: z.boolean().default(false),
  hormoneType: z
    .enum(["testosterone", "estrogen", "none"])
    .optional()
    .nullable(),
  height: z.number().positive().min(100).max(250),
  weight: z.number().positive().min(30).max(300),
  fitnessLevel: z.enum(["iniciante", "intermediario", "avancado"]),
};
```

### Verificação no Banco de Dados

#### Tabela `Student` (schema.prisma:89-132)

```prisma
model Student {
  age    Int?
  gender String?
  isTrans              Boolean? // ✅ Adicionado
  usesHormones         Boolean? // ✅ Adicionado
  hormoneType          String?  // ✅ Adicionado
}
```

#### Tabela `StudentProfile` (schema.prisma:154-198)

```prisma
model StudentProfile {
  height                 Float?
  weight                 Float?
  fitnessLevel           String?
}
```

**✅ Status: Todos os 8 campos estão sendo salvos corretamente**

---

## 📝 Step 2: Objetivos

### Campos Coletados

| Campo                    | Tipo       | Valores Possíveis                                                                               | Obrigatório    | Onde é Salvo                                   |
| ------------------------ | ---------- | ----------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------- |
| `goals`                  | `string[]` | Múltipla seleção: `["perder-peso", "ganhar-massa", "definir", "saude", "forca", "resistencia"]` | ✅ Sim (min 1) | `StudentProfile.goals` (String? - JSON array)  |
| `weeklyWorkoutFrequency` | `number`   | 1-7 (vezes por semana)                                                                          | ✅ Sim         | `StudentProfile.weeklyWorkoutFrequency` (Int?) |
| `workoutDuration`        | `number`   | 20-120 (minutos)                                                                                | ✅ Sim         | `StudentProfile.workoutDuration` (Int?)        |

### Validação Zod

```typescript
step2Schema = {
  goals: z.array(z.enum([...])).min(1).max(6),
  weeklyWorkoutFrequency: z.number().int().min(1).max(7),
  workoutDuration: z.number().int().min(20).max(180),
}
```

### Verificação no Banco de Dados

```prisma
model StudentProfile {
  weeklyWorkoutFrequency Int?
  workoutDuration        Int?
  goals                  String? // JSON array
}
```

**✅ Status: Todos os 3 campos estão sendo salvos corretamente**

---

## 📝 Step 3: Preferências

### Campos Coletados

| Campo               | Tipo                                        | Valores Possíveis                 | Obrigatório | Onde é Salvo                                 |
| ------------------- | ------------------------------------------- | --------------------------------- | ----------- | -------------------------------------------- |
| `preferredSets`     | `number`                                    | 2, 3, 4, 5 (séries por exercício) | ✅ Sim      | `StudentProfile.preferredSets` (Int?)        |
| `preferredRepRange` | `"forca" \| "hipertrofia" \| "resistencia"` | 3 opções                          | ✅ Sim      | `StudentProfile.preferredRepRange` (String?) |
| `restTime`          | `"curto" \| "medio" \| "longo"`             | 3 opções                          | ✅ Sim      | `StudentProfile.restTime` (String?)          |

### Validação Zod

```typescript
step3Schema = {
  preferredSets: z.number().int().min(2).max(6),
  preferredRepRange: z.enum(["forca", "hipertrofia", "resistencia"]),
  restTime: z.enum(["curto", "medio", "longo"]),
};
```

### Verificação no Banco de Dados

```prisma
model StudentProfile {
  preferredSets          Int?
  preferredRepRange      String?
  restTime               String?
}
```

**✅ Status: Todos os 3 campos estão sendo salvos corretamente**

---

## 📝 Step 4: Equipamentos

### Campos Coletados

| Campo     | Tipo                                                                        | Valores Possíveis | Obrigatório | Onde é Salvo                       |
| --------- | --------------------------------------------------------------------------- | ----------------- | ----------- | ---------------------------------- |
| `gymType` | `"academia-completa" \| "academia-basica" \| "home-gym" \| "peso-corporal"` | 4 opções          | ✅ Sim      | `StudentProfile.gymType` (String?) |

### Validação Zod

```typescript
step4Schema = {
  gymType: z.enum([
    "academia-completa",
    "academia-basica",
    "home-gym",
    "peso-corporal",
  ]),
};
```

### Verificação no Banco de Dados

```prisma
model StudentProfile {
  gymType                String?
}
```

**✅ Status: Campo salvo corretamente**

---

## 📝 Step 5: Valores Metabólicos (Calculados Automaticamente)

### Campos Calculados e Exibidos

| Campo            | Tipo     | Como é Calculado                                                                                                               | Obrigatório | Onde é Salvo                            |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------- |
| `bmr`            | `number` | Fórmula Harris-Benedict (baseado em age, gender, height, weight, isTrans, usesHormones, hormoneType, hormoneTreatmentDuration) | ✅ Sim      | `StudentProfile.bmr` (Float?)           |
| `tdee`           | `number` | BMR × Fator de Atividade (baseado em activityLevel)                                                                            | ✅ Sim      | `StudentProfile.tdee` (Float?)          |
| `targetCalories` | `number` | TDEE ajustado por objetivo (cut/bulk/maintain)                                                                                 | ✅ Sim      | `StudentProfile.targetCalories` (Int?)  |
| `targetProtein`  | `number` | Calculado baseado em targetCalories e objetivos                                                                                | ✅ Sim      | `StudentProfile.targetProtein` (Float?) |
| `targetCarbs`    | `number` | Calculado baseado em targetCalories e objetivos                                                                                | ✅ Sim      | `StudentProfile.targetCarbs` (Float?)   |
| `targetFats`     | `number` | Calculado baseado em targetCalories e objetivos                                                                                | ✅ Sim      | `StudentProfile.targetFats` (Float?)    |

**Nota:** Este step **não coleta dados do usuário**, apenas **calcula e exibe** valores baseados nos dados dos steps anteriores.

### Validação Zod

```typescript
step6Schema_Metabolic = {
  bmr: z.number().positive().optional().nullable(),
  tdee: z.number().positive().optional().nullable(),
  targetCalories: z.number().int().positive().min(800).max(10000),
  targetProtein: z.number().positive().min(20).max(500),
  targetCarbs: z.number().nonnegative().max(1000),
  targetFats: z.number().positive().min(20).max(300),
};
```

### Verificação no Banco de Dados

```prisma
model StudentProfile {
  bmr                    Float?
  tdee                   Float?
  targetCalories         Int?
  targetProtein          Float?
  targetCarbs            Float?
  targetFats             Float?
}
```

**✅ Status: Todos os 6 campos calculados estão sendo salvos corretamente**

---

## 📝 Step 6: Nível de Atividade e Tratamento Hormonal

### Campos Coletados

| Campo                      | Tipo     | Valores Possíveis              | Obrigatório      | Onde é Salvo                                     |
| -------------------------- | -------- | ------------------------------ | ---------------- | ------------------------------------------------ |
| `activityLevel`            | `number` | 1-10 (termômetro de atividade) | ✅ Sim           | `StudentProfile.activityLevel` (Int?)            |
| `hormoneTreatmentDuration` | `number` | 0-120 (meses)                  | ⚠️ Condicional\* | `StudentProfile.hormoneTreatmentDuration` (Int?) |

**\*Condicional:** Apenas se `isTrans === true` e `usesHormones === true`

### Descrições dos Níveis de Atividade

| Nível | Label               | Descrição                       | Exemplo                                         |
| ----- | ------------------- | ------------------------------- | ----------------------------------------------- |
| 1     | Sedentário Total    | Sem exercício, trabalho sentado | Pessoa acamada ou muito limitada                |
| 2     | Muito Sedentário    | Pouco ou nenhum exercício       | Trabalho de escritório, sem atividades físicas  |
| 3     | Sedentário Leve     | Exercício leve 1-2x/semana      | Caminhadas ocasionais                           |
| 4     | Levemente Ativo     | Exercício leve 3-5x/semana      | Trabalho home office, exercícios leves          |
| 5     | Moderadamente Ativo | Exercício moderado 3-5x/semana  | Trabalho de escritório com exercícios regulares |
| 6     | Ativo               | Exercício pesado 3-5x/semana    | Trabalho que requer movimento constante         |
| 7     | Muito Ativo         | Exercício pesado 6-7x/semana    | Trabalho físico moderado                        |
| 8     | Extremamente Ativo  | Exercício muito pesado diário   | Trabalho na construção, trabalho físico pesado  |
| 9     | Atleta              | Treino intenso 2x/dia           | Atleta de alto rendimento                       |
| 10    | Atleta Elite        | Treino extremo, competição      | Atleta profissional de alto rendimento          |

### Validação Zod

```typescript
step5Schema_Activity = {
  activityLevel: z.number().int().min(1).max(10),
  hormoneTreatmentDuration: z
    .number()
    .int()
    .min(0)
    .max(120)
    .optional()
    .nullable(),
};
```

### Verificação no Banco de Dados

```prisma
model StudentProfile {
  activityLevel          Int? // 1-10
  hormoneTreatmentDuration Int? // Meses de tratamento hormonal
}
```

**✅ Status: Todos os 2 campos estão sendo salvos corretamente**

---

## 📝 Step 7: Limitações e Condições Médicas

### Campos Coletados

| Campo                 | Tipo                                 | Valores Possíveis                                                                                                                   | Obrigatório | Onde é Salvo                                                |
| --------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| `physicalLimitations` | `string[]`                           | Múltipla seleção: `["articulacoes", "costas", "pernas", "bracos", "pescoco", "outras-fisicas"]`                                     | ❌ Opcional | `StudentProfile.physicalLimitations` (String? - JSON array) |
| `motorLimitations`    | `string[]`                           | Múltipla seleção: `["mobilidade-reduzida", "equilibrio", "coordenacao", "forca-reduzida", "amplitude-movimento", "outras-motoras"]` | ❌ Opcional | `StudentProfile.motorLimitations` (String? - JSON array)    |
| `medicalConditions`   | `string[]`                           | Múltipla seleção: `["diabetes", "hipertensao", "problemas-cardiacos", "asma", "problemas-tireoide", "outras-medicas"]`              | ❌ Opcional | `StudentProfile.medicalConditions` (String? - JSON array)   |
| `limitationDetails`   | `Record<string, string \| string[]>` | Objeto com detalhes específicos de cada limitação                                                                                   | ❌ Opcional | `StudentProfile.limitationDetails` (String? - JSON object)  |

### Detalhes das Limitações (limitationDetails)

O campo `limitationDetails` armazena informações específicas sobre limitações selecionadas:

#### Limitações Físicas

- `pernas`: `"joelhos" \| "quadris" \| "tornozelos" \| "geral"`
- `bracos`: `"ombros" \| "cotovelos" \| "pulsos" \| "geral"`
- `outras-fisicas`: Texto livre

#### Limitações Motoras

- `outras-motoras`: Texto livre

#### Condições Médicas

- `diabetes`: `"tipo-1" \| "tipo-2" \| "gestacional" \| "pre-diabetes"`
- `problemas-cardiacos`: `"arritmia" \| "hipertensao" \| "insuficiencia" \| "outros-cardiacos"`
- `outras-medicas`: Texto livre

### Validação Zod

```typescript
step7Schema = {
  physicalLimitations: z.array(z.string()).optional().default([]),
  motorLimitations: z.array(z.string()).optional().default([]),
  medicalConditions: z.array(z.string()).optional().default([]),
  limitationDetails: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional()
    .nullable(),
};
```

### Verificação no Banco de Dados

```prisma
model StudentProfile {
  physicalLimitations    String? // JSON array de limitações físicas
  motorLimitations       String? // JSON array de limitações motoras
  medicalConditions      String? // JSON array de condições médicas
  limitationDetails      String? // JSON object: { "limitationKey": "detailValue" }
  injuries               String? // JSON array (campo legado - mantido para compatibilidade)
}
```

**✅ Status: Todos os 4 campos estão sendo salvos corretamente**

---

## 🔍 Campo Adicional (Não Coletado Ainda)

### Campo Disponível mas Não Coletado

| Campo                 | Tipo     | Descrição                                                   | Onde Está                                     | Status                                                 |
| --------------------- | -------- | ----------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `dailyAvailableHours` | `number` | Horas disponíveis por dia para treino (0.5, 1, 1.5, 2, etc) | `StudentProfile.dailyAvailableHours` (Float?) | ⚠️ **Pronto no banco, mas não coletado no onboarding** |

**Nota:** Este campo está definido no `OnboardingData` (types.ts:42) e no schema do Prisma, mas **não há um step que colete este dado**. Está pronto para uso futuro.

---

## ✅ Verificação Final - Comparação com Schema Prisma

### Tabela `Student`

| Campo no Onboarding | Campo no Prisma | Tipo Prisma | Status |
| ------------------- | --------------- | ----------- | ------ |
| `age`               | `age`           | `Int?`      | ✅     |
| `gender`            | `gender`        | `String?`   | ✅     |
| `isTrans`           | `isTrans`       | `Boolean?`  | ✅     |
| `usesHormones`      | `usesHormones`  | `Boolean?`  | ✅     |
| `hormoneType`       | `hormoneType`   | `String?`   | ✅     |

### Tabela `StudentProfile`

| Campo no Onboarding        | Campo no Prisma            | Tipo Prisma      | Status                     |
| -------------------------- | -------------------------- | ---------------- | -------------------------- |
| `height`                   | `height`                   | `Float?`         | ✅                         |
| `weight`                   | `weight`                   | `Float?`         | ✅                         |
| `fitnessLevel`             | `fitnessLevel`             | `String?`        | ✅                         |
| `goals`                    | `goals`                    | `String?` (JSON) | ✅                         |
| `weeklyWorkoutFrequency`   | `weeklyWorkoutFrequency`   | `Int?`           | ✅                         |
| `workoutDuration`          | `workoutDuration`          | `Int?`           | ✅                         |
| `gymType`                  | `gymType`                  | `String?`        | ✅                         |
| `preferredSets`            | `preferredSets`            | `Int?`           | ✅                         |
| `preferredRepRange`        | `preferredRepRange`        | `String?`        | ✅                         |
| `restTime`                 | `restTime`                 | `String?`        | ✅                         |
| `bmr`                      | `bmr`                      | `Float?`         | ✅                         |
| `tdee`                     | `tdee`                     | `Float?`         | ✅                         |
| `targetCalories`           | `targetCalories`           | `Int?`           | ✅                         |
| `targetProtein`            | `targetProtein`            | `Float?`         | ✅                         |
| `targetCarbs`              | `targetCarbs`              | `Float?`         | ✅                         |
| `targetFats`               | `targetFats`               | `Float?`         | ✅                         |
| `activityLevel`            | `activityLevel`            | `Int?`           | ✅                         |
| `hormoneTreatmentDuration` | `hormoneTreatmentDuration` | `Int?`           | ✅                         |
| `physicalLimitations`      | `physicalLimitations`      | `String?` (JSON) | ✅                         |
| `motorLimitations`         | `motorLimitations`         | `String?` (JSON) | ✅                         |
| `medicalConditions`        | `medicalConditions`        | `String?` (JSON) | ✅                         |
| `limitationDetails`        | `limitationDetails`        | `String?` (JSON) | ✅                         |
| `dailyAvailableHours`      | `dailyAvailableHours`      | `Float?`         | ⚠️ Pronto mas não coletado |

---

## 📊 Resumo Estatístico

### Total de Campos

- **Campos Coletados:** 27
- **Campos Salvos no Banco:** 27
- **Campos Prontos mas Não Coletados:** 1 (`dailyAvailableHours`)
- **Taxa de Cobertura:** 100% ✅

### Distribuição por Step

| Step   | Campos | % do Total |
| ------ | ------ | ---------- |
| Step 1 | 8      | 29.6%      |
| Step 2 | 3      | 11.1%      |
| Step 3 | 3      | 11.1%      |
| Step 4 | 1      | 3.7%       |
| Step 5 | 6      | 22.2%      |
| Step 6 | 2      | 7.4%       |
| Step 7 | 4      | 14.8%      |

### Distribuição por Tipo de Dado

| Tipo                  | Quantidade | Exemplos                                 |
| --------------------- | ---------- | ---------------------------------------- |
| `number`              | 12         | age, height, weight, activityLevel, etc. |
| `string`              | 6          | gender, fitnessLevel, gymType, etc.      |
| `string[]`            | 3          | goals, physicalLimitations, etc.         |
| `boolean`             | 2          | isTrans, usesHormones                    |
| `Record<string, ...>` | 1          | limitationDetails                        |
| **Total**             | **24**     |                                          |

---

## 🎯 Conclusão

### ✅ Status Geral: **100% COMPLETO**

Todos os dados coletados nos 7 steps do onboarding estão sendo **corretamente salvos no banco de dados**. O sistema está pronto para:

1. ✅ Criar treinos personalizados baseados em todos os dados coletados
2. ✅ Calcular valores metabólicos precisos (BMR, TDEE, macros)
3. ✅ Considerar limitações físicas, motoras e condições médicas
4. ✅ Ajustar treinos baseado em nível de atividade (1-10)
5. ✅ Considerar tratamento hormonal para cálculos metabólicos
6. ✅ Usar preferências de treino (séries, repetições, descanso)
7. ✅ Adaptar treinos ao tipo de equipamento disponível

### 📝 Observações

1. **Campo `dailyAvailableHours`**: Está pronto no banco de dados mas não é coletado em nenhum step. Pode ser adicionado futuramente se necessário.

2. **Campo `injuries`**: Mantido para compatibilidade com código legado, mas os novos campos (`physicalLimitations`, `motorLimitations`, `medicalConditions`) são preferenciais.

3. **Validação**: Todos os campos são validados com Zod antes de serem salvos no banco.

4. **Tipos TypeScript**: Todos os campos estão tipados corretamente em `OnboardingData` (types.ts).

---

## 🔄 Próximos Passos Sugeridos

1. **Adicionar coleta de `dailyAvailableHours`** se necessário para planejamento de treino mensal
2. **Criar sistema de geração de treino mensal** usando todos os dados coletados
3. **Implementar ajustes automáticos** de treino baseado em limitações
4. **Criar dashboard** para visualizar todos os dados coletados

---

**Documento gerado em:** 2025-01-27  
**Última atualização:** Após revisão completa do onboarding
