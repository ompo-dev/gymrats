/**
 * Script para validar integridade dos dados do domínio Personal
 * Execute: node scripts/migration/validate-personal-integrity.js
 *
 * Valida:
 * - Contagens de personals, affiliations, assignments, subscriptions
 * - Status e valores em personal_subscriptions
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function validate() {
  try {
    console.log("📋 Validando integridade do domínio Personal...\n");

    const personalsCount = await prisma.personal.count();
    const affiliationsCount = await prisma.gymPersonalAffiliation.count();
    const activeAffiliationsCount = await prisma.gymPersonalAffiliation.count({
      where: { status: "active" },
    });
    const assignmentsCount = await prisma.studentPersonalAssignment.count();
    const activeAssignmentsCount = await prisma.studentPersonalAssignment.count(
      {
        where: { status: "active" },
      },
    );
    const subscriptionsCount = await prisma.personalSubscription.count();
    const pendingSubsCount = await prisma.personalSubscription.count({
      where: { status: "pending_payment" },
    });
    const activeSubsCount = await prisma.personalSubscription.count({
      where: { status: "active" },
    });

    console.log("📊 Contagens:");
    console.log(`   Personals: ${personalsCount}`);
    console.log(
      `   Gym Personal Affiliations: ${affiliationsCount} (${activeAffiliationsCount} ativas)`,
    );
    console.log(
      `   Student Personal Assignments: ${assignmentsCount} (${activeAssignmentsCount} ativas)`,
    );
    console.log(
      `   Personal Subscriptions: ${subscriptionsCount} (${activeSubsCount} ativas, ${pendingSubsCount} pendentes)`,
    );

    const subsWithAbacate = await prisma.personalSubscription.count({
      where: { abacatePayBillingId: { not: null } },
    });
    console.log(`   Subscriptions com abacatePayBillingId: ${subsWithAbacate}`);

    console.log("\n✅ Validação concluída.");
  } catch (error) {
    console.error("❌ Erro na validação:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validate();
