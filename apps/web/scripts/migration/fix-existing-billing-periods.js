const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixExistingSubs() {
  console.log("🛠️  Corrigindo billingPeriod para assinaturas existentes...");

  const subs = await prisma.subscription.findMany();
  let count = 0;

  for (const sub of subs) {
    let period = null;
    if (
      sub.plan.toLowerCase().includes("anual") ||
      sub.plan.toLowerCase().includes("annual")
    ) {
      period = "annual";
    } else if (
      sub.plan.toLowerCase().includes("mensal") ||
      sub.plan.toLowerCase().includes("monthly")
    ) {
      period = "monthly";
    }

    if (period && sub.billingPeriod !== period) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { billingPeriod: period },
      });
      count++;
    }
  }

  console.log(`✅ ${count} assinaturas de estudante corrigidas.`);
}

fixExistingSubs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
