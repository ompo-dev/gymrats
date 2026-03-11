/**
 * Execute: node scripts/migration/apply-pix-cache-payments-migration.js
 *
 * Adiciona cache do PIX em payments para reutilizar PIX válido ao clicar
 * "Pagar agora" no histórico, evitando criar novo PIX e mostrando countdown correto.
 *
 * Colunas em payments:
 * - pixBrCode       TEXT     - brCode copia-e-cola do PIX
 * - pixBrCodeBase64 TEXT     - QR em base64
 * - pixExpiresAt    TIMESTAMP - quando o PIX invalida
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyMigration() {
  console.log("🔄 Aplicando migration: cache PIX em payments...\n");

  const columns = [
    { name: "pixBrCode", type: "TEXT" },
    { name: "pixBrCodeBase64", type: "TEXT" },
    { name: "pixExpiresAt", type: "TIMESTAMP(3)" },
  ];

  try {
    for (const col of columns) {
      const existsResult = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'payments'
          AND column_name = '${col.name}'
        ) as exists
      `);

      const colExists = existsResult[0]?.exists || false;

      if (colExists) {
        console.log(`⚠️  Coluna '${col.name}' já existe.`);
      } else {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "payments" ADD COLUMN "${col.name}" ${col.type}`
        );
        console.log(`✅ Coluna '${col.name}' adicionada com sucesso!`);
      }
    }

    console.log("\n📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo: cache de PIX em payments para reutilizar no \"Pagar agora\"");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  applyMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { applyMigration };
