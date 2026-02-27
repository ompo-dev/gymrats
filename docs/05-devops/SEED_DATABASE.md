# 🌱 SCRIPT DE SEED - POPULAÇÃO DO BANCO DE DADOS

## 📋 Descrição

Este script popula o banco de dados com dados iniciais necessários para o funcionamento da aplicação GymRats.

## 🗂️ Dados Populados

### 1. Units e Workouts

- ✅ **3 Units** (Semana 1, Semana 2, Semana 3)
- ✅ **6 Workouts completos** com exercícios
- ✅ **Exercícios com alternativas** (AlternativeExercises)
- ✅ Estrutura completa de treinos para iniciantes

### 2. Gyms (Academias)

- ✅ **3 Academias parceiras** com dados completos:
  - PowerFit Academia
  - FitZone Premium
  - Strong Life Gym
- ✅ Campos incluídos:
  - Localização (latitude, longitude)
  - Rating e reviews
  - Amenities (JSON)
  - Opening Hours (JSON)
  - Photos (JSON)
  - `isPartner = true`

### 3. Membership Plans

- ✅ **Plans para cada academia**:
  - Mensal
  - Trimestral
  - Benefícios (JSON)

### 4. Food Items

- ✅ **20 alimentos** na base de dados
- ✅ Categorias: protein, carbs, vegetables, fruits, fats, dairy, snacks
- ✅ Valores nutricionais completos (calorias, proteína, carboidratos, gorduras)

## 🚀 Como Executar

### Pré-requisitos

1. **Todas as migrations devem estar aplicadas:**

   ```bash
   node scripts/migration/apply-alternative-exercises-migration.js
   node scripts/migration/apply-weight-history-migration.js
   node scripts/migration/apply-gym-locations-payment-migration.js
   node scripts/migration/apply-nutrition-migration.js
   ```

2. **Prisma Client deve estar atualizado:**
   ```bash
   npx prisma generate
   ```

### Executar Seed

```bash
node scripts/seed-database.js
```

### Comportamento

- ✅ **Idempotente**: Pode ser executado múltiplas vezes
- ✅ **Verifica existência**: Se dados já existem, atualiza
- ✅ **Não duplica**: Evita criar registros duplicados
- ✅ **Logs detalhados**: Mostra progresso de cada operação

## 📊 Dados Criados

### Units

1. **Semana 1** (order: 1)

   - Peito e Tríceps - Dia A
   - Costas e Bíceps - Dia B
   - Corrida Intervalada

2. **Semana 2** (order: 2)

   - Pernas Completo - Dia C
   - Bike Resistência
   - HIIT Completo

3. **Semana 3** (order: 3)
   - Ombros e Trapézio

### Gyms

1. **PowerFit Academia**

   - Localização: Rua das Flores, 123 - Centro
   - Coordinates: -23.5505, -46.6333
   - Rating: 4.8 (234 reviews)
   - Plans: Mensal (R$ 120), Trimestral (R$ 330)

2. **FitZone Premium**

   - Localização: Av. Paulista, 1500 - Bela Vista
   - Coordinates: -23.5629, -46.6544
   - Rating: 4.6 (189 reviews)
   - Plans: Mensal (R$ 150)

3. **Strong Life Gym**
   - Localização: Rua Augusta, 890 - Jardins
   - Coordinates: -23.5558, -46.6614
   - Rating: 4.9 (312 reviews)
   - Plans: Mensal (R$ 140)
   - Aberta 24h

### Foods

**Proteínas:**

- Peito de frango grelhado
- Ovo inteiro cozido
- Salmão grelhado
- Whey Protein
- Atum em lata
- Frango desfiado

**Carboidratos:**

- Arroz integral cozido
- Batata doce cozida
- Aveia em flocos
- Quinoa cozida
- Batata inglesa cozida

**Frutas:**

- Banana
- Maçã
- Mamão

**Vegetais:**

- Brócolis cozido
- Espinafre cozido

**Gorduras:**

- Azeite de oliva
- Abacate

**Laticínios:**

- Queijo cottage

**Snacks:**

- Amendoim

## ⚠️ Notas Importantes

1. **Usuário Admin**: O script cria um usuário admin (`admin@gymrats.com`) para associar as academias. Em produção, isso deve ser configurado adequadamente.

2. **Senha**: A senha do usuário admin é um placeholder. Em produção, deve ser uma senha hash real.

3. **Dados de Seed**: O arquivo `lib/mock-data.ts` foi removido. Os dados de units, workouts e alimentos são definidos diretamente em `scripts/seed-database.js`. Dados de academia vêm do banco.

4. **Execução Segura**: O script verifica existência antes de criar, então é seguro executar múltiplas vezes.

## 🔄 Atualizar Dados

Se você precisar atualizar os dados:

1. **Edite o arquivo** `scripts/seed-database.js`
2. **Execute novamente**: `node scripts/seed-database.js`
3. **O script atualizará** os dados existentes ou criará novos

## 📝 Próximos Passos Após Seed

1. ✅ Verificar dados no banco:

   ```sql
   SELECT COUNT(*) FROM units;
   SELECT COUNT(*) FROM workouts;
   SELECT COUNT(*) FROM gyms;
   SELECT COUNT(*) FROM food_items;
   ```

2. ✅ Testar funcionalidades:

   - Buscar units e workouts na aplicação
   - Buscar academias parceiras
   - Buscar alimentos

3. ✅ Popular com dados reais:
   - Adicionar mais alimentos
   - Adicionar mais academias
   - Criar mais units e workouts

---

**Status:** ✅ Script criado e pronto para uso
**Data:** 2025-01-XX
