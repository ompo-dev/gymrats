/**
 * Migration: Tabela boost_campaign_engagements
 *
 * Controle de impressão/clique por aluno: cada aluno conta no máximo 1x por campanha.
 * Usado para métricas reais de visualizações e cliques nos anúncios da home.
 *
 * Execute: node scripts/migration/apply-boost-campaign-engagement-migration.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyBoostCampaignEngagementMigration() {
  console.log("🔄 Aplicando migration: Tabela boost_campaign_engagements...\n");

  try {
    const tableExistsResult = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'boost_campaign_engagements'
      ) as exists;
    `);

    const tblExists = tableExistsResult[0]?.exists || false;

    if (tblExists) {
      console.log("⚠️  Tabela 'boost_campaign_engagements' já existe.");
    } else {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "boost_campaign_engagements" (
          "id" TEXT NOT NULL,
          "campaignId" TEXT NOT NULL,
          "studentId" TEXT NOT NULL,
          "impressionAt" TIMESTAMP(3),
          "clickAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "boost_campaign_engagements_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "boost_campaign_engagements_campaignId_studentId_key" UNIQUE ("campaignId", "studentId")
        );
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "boost_campaign_engagements"
        ADD CONSTRAINT "boost_campaign_engagements_campaignId_fkey"
        FOREIGN KEY ("campaignId") REFERENCES "boost_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "boost_campaign_engagements"
        ADD CONSTRAINT "boost_campaign_engagements_studentId_fkey"
        FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX "boost_campaign_engagements_campaignId_idx" ON "boost_campaign_engagements"("campaignId");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX "boost_campaign_engagements_studentId_idx" ON "boost_campaign_engagements"("studentId");
      `);

      console.log("✅ Tabela 'boost_campaign_engagements' criada com sucesso!");
    }

    console.log("\n📝 Execute: npx prisma generate");
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  applyBoostCampaignEngagementMigration()
    .then(() => {
      console.log("\n✅ Migration concluída!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro na migration:", error);
      process.exit(1);
    });
}

module.exports = { applyBoostCampaignEngagementMigration };
