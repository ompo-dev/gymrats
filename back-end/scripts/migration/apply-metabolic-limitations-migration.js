const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function columnExists(columnName, tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' 
      AND column_name = '${columnName}'
    `);
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    return false;
  }
}

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de campos metabólicos, limitações e informações de gênero...\n");

    const studentColumnsToAdd = [
      { name: "isTrans", type: "BOOLEAN", description: "Se a pessoa é transgênero", table: "students" },
      { name: "usesHormones", type: "BOOLEAN", description: "Se faz uso de terapia hormonal", table: "students" },
      { name: "hormoneType", type: "TEXT", description: "Tipo de hormônio (testosterone/estrogen/none)", table: "students" },
    ];

    const profileColumnsToAdd = [
      { name: "bmr", type: "REAL", description: "Taxa metabólica basal", table: "student_profiles" },
      { name: "tdee", type: "REAL", description: "Gasto energético total diário", table: "student_profiles" },
      { name: "activityLevel", type: "INTEGER", description: "Nível de atividade física (1-10)", table: "student_profiles" },
      { name: "hormoneTreatmentDuration", type: "INTEGER", description: "Tempo de tratamento hormonal (meses)", table: "student_profiles" },
      { name: "physicalLimitations", type: "TEXT", description: "Limitações físicas (JSON array)", table: "student_profiles" },
      { name: "motorLimitations", type: "TEXT", description: "Limitações motoras (JSON array)", table: "student_profiles" },
      { name: "medicalConditions", type: "TEXT", description: "Condições médicas (JSON array)", table: "student_profiles" },
      { name: "limitationDetails", type: "TEXT", description: "Detalhes das limitações (JSON object)", table: "student_profiles" },
      { name: "dailyAvailableHours", type: "REAL", description: "Horas disponíveis por dia para treino", table: "student_profiles" },
    ];

    const allColumns = [...studentColumnsToAdd, ...profileColumnsToAdd];

    console.log(`Verificando e adicionando ${allColumns.length} colunas...\n`);

    for (let i = 0; i < allColumns.length; i++) {
      const column = allColumns[i];
      
      try {
        const exists = await columnExists(column.name, column.table);
        
        if (exists) {
          console.log(
            `⚠️  Coluna ${i + 1}/${allColumns.length} "${column.name}" (${column.table}) já existe, ignorando...`
          );
          continue;
        }

        const command = `ALTER TABLE "${column.table}" ADD COLUMN "${column.name}" ${column.type}`;
        await prisma.$executeRawUnsafe(command);
        
        console.log(
          `✅ Coluna ${i + 1}/${allColumns.length} "${column.name}" (${column.table}) - ${column.description} adicionada com sucesso`
        );
      } catch (error) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          (error.message.includes("column") && error.message.includes("already exists"))
        ) {
          console.log(
            `⚠️  Coluna ${i + 1}/${allColumns.length} "${column.name}" (${column.table}) já existe, ignorando...`
          );
        } else {
          console.error(`❌ Erro ao adicionar coluna "${column.name}" (${column.table}):`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo das mudanças:");
    console.log("\n📊 Tabela 'students':");
    console.log("   - Campo isTrans (Boolean) adicionado");
    console.log("   - Campo usesHormones (Boolean) adicionado");
    console.log("   - Campo hormoneType (Text) adicionado");
    console.log("\n📊 Tabela 'student_profiles':");
    console.log("   - Campo bmr (Taxa metabólica basal) adicionado");
    console.log("   - Campo tdee (Gasto energético total) adicionado");
    console.log("   - Campo activityLevel (1-10) adicionado");
    console.log("   - Campo hormoneTreatmentDuration (meses) adicionado");
    console.log("   - Campo physicalLimitations (JSON array) adicionado");
    console.log("   - Campo motorLimitations (JSON array) adicionado");
    console.log("   - Campo medicalConditions (JSON array) adicionado");
    console.log("   - Campo limitationDetails (JSON object) adicionado");
    console.log("   - Campo dailyAvailableHours (horas por dia) adicionado");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
