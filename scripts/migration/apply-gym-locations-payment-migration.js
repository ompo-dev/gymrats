/**
 * Script para aplicar migration de campos de localização do Gym e PaymentMethod
 * Execute: node scripts/apply-gym-locations-payment-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de localização de academias e métodos de pagamento...\n");

    const commands = [
      // 1. Adicionar campos de localização em gyms
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "latitude" REAL`,
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "longitude" REAL`,
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "rating" REAL DEFAULT 0`,
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "totalReviews" INTEGER DEFAULT 0`,
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "amenities" TEXT`,
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "openingHours" TEXT`,
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "photos" TEXT`,
      `ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "isPartner" BOOLEAN DEFAULT false`,

      // 2. Criar índices para busca por localização
      `CREATE INDEX IF NOT EXISTS "gyms_latitude_longitude_idx" ON "gyms"("latitude", "longitude")`,

      // 3. Criar tabela de métodos de pagamento
      `CREATE TABLE IF NOT EXISTS "payment_methods" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "cardBrand" TEXT,
        "last4" TEXT,
        "expiryMonth" INTEGER,
        "expiryYear" INTEGER,
        "holderName" TEXT,
        "pixKey" TEXT,
        "pixKeyType" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "payment_methods_userId_fkey" 
          FOREIGN KEY ("userId") 
          REFERENCES "users" ("id") 
          ON DELETE CASCADE ON UPDATE CASCADE
      )`,

      // 4. Criar índice para payment_methods
      `CREATE INDEX IF NOT EXISTS "payment_methods_userId_idx" 
       ON "payment_methods"("userId")`,
    ];

    console.log(`Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      try {
        await prisma.$executeRawUnsafe(commands[i]);
        console.log(
          `✅ Comando ${i + 1}/${commands.length} executado com sucesso`
        );
      } catch (error) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("does not exist") ||
          (error.message.includes("column") &&
            error.message.includes("already exists")) ||
          (error.message.includes("table") &&
            error.message.includes("already exists"))
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${commands.length} ignorado (já existe ou não necessário)`
          );
        } else {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo das mudanças:");
    console.log("   - Campos de localização adicionados em gyms");
    console.log("   - Tabela payment_methods criada");
    console.log("   - Índices criados para melhor performance");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

