/**
 * Script para migrar Units → WeeklyPlan (7 slots semanais)
 *
 * 1. Aplica schema (weekOverride, weekly_plans, plan_slots) se não existir
 * 2. Migra dados: cria WeeklyPlan + PlanSlots para cada student
 *
 * Regras:
 * - Para cada Student com Units: cria WeeklyPlan, distribui workouts nos slots 0-6
 * - Para Students sem Units: cria WeeklyPlan com 7 slots rest
 * - Mantém Unit/Workout intactos (não deleta) para rollback
 *
 * Execute: node scripts/migration/apply-weekly-plan-migration.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applySchemaMigration() {
  console.log(
    "📐 Aplicando schema (weekOverride, weekly_plans, plan_slots)...\n",
  );

  const steps = [
    // 1. Adicionar weekOverride em students
    `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "weekOverride" TIMESTAMP(3)`,

    // 2. Criar tabela weekly_plans
    `CREATE TABLE IF NOT EXISTS "weekly_plans" (
			"id" TEXT NOT NULL,
			"studentId" TEXT NOT NULL,
			"title" TEXT NOT NULL DEFAULT 'Meu Plano Semanal',
			"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
			"updatedAt" TIMESTAMP(3) NOT NULL,
			CONSTRAINT "weekly_plans_pkey" PRIMARY KEY ("id")
		)`,

    // 3. Criar tabela plan_slots
    `CREATE TABLE IF NOT EXISTS "plan_slots" (
			"id" TEXT NOT NULL,
			"weeklyPlanId" TEXT NOT NULL,
			"dayOfWeek" INTEGER NOT NULL,
			"type" TEXT NOT NULL,
			"workoutId" TEXT,
			"order" INTEGER NOT NULL DEFAULT 0,
			CONSTRAINT "plan_slots_pkey" PRIMARY KEY ("id")
		)`,

    // 4-7. Índices e FKs (ignorar se já existem)
    `CREATE UNIQUE INDEX IF NOT EXISTS "weekly_plans_studentId_key" ON "weekly_plans"("studentId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "plan_slots_workoutId_key" ON "plan_slots"("workoutId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "plan_slots_weeklyPlanId_dayOfWeek_key" ON "plan_slots"("weeklyPlanId", "dayOfWeek")`,
    `CREATE INDEX IF NOT EXISTS "plan_slots_weeklyPlanId_idx" ON "plan_slots"("weeklyPlanId")`,
  ];

  for (let i = 0; i < steps.length; i++) {
    try {
      await prisma.$executeRawUnsafe(steps[i]);
      console.log(`   ✅ Passo ${i + 1}/${steps.length}`);
    } catch (e) {
      if (
        e.message?.includes("already exists") ||
        e.message?.includes("duplicate")
      ) {
        console.log(`   ⏭️  Passo ${i + 1} (já existe)`);
      } else {
        throw e;
      }
    }
  }

  // FKs - usar DO block para evitar erro se já existem
  const fkSteps = [
    [
      "weekly_plans_studentId_fkey",
      "weekly_plans",
      "studentId",
      "students",
      "id",
    ],
    [
      "plan_slots_weeklyPlanId_fkey",
      "plan_slots",
      "weeklyPlanId",
      "weekly_plans",
      "id",
    ],
    ["plan_slots_workoutId_fkey", "plan_slots", "workoutId", "workouts", "id"],
  ];
  for (const [name, table, col, refTable, refCol] of fkSteps) {
    try {
      await prisma.$executeRawUnsafe(`
				DO $$ BEGIN
					IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
						ALTER TABLE "${table}" ADD CONSTRAINT "${name}" 
						FOREIGN KEY ("${col}") REFERENCES "${refTable}"("${refCol}") 
						ON DELETE ${table === "plan_slots" && col === "workoutId" ? "SET NULL" : "CASCADE"} ON UPDATE CASCADE;
					END IF;
				END $$
			`);
      console.log(`   ✅ FK ${name}`);
    } catch (_e) {
      console.log(`   ⏭️  FK ${name} (pode já existir)`);
    }
  }

  console.log("\n✅ Schema aplicado.\n");
}

async function applyDataMigration() {
  try {
    console.log("📦 Migrando dados Units → WeeklyPlan...\n");

    const students = await prisma.student.findMany({
      include: {
        weeklyPlan: { include: { slots: true } },
        units: {
          include: {
            workouts: {
              include: { exercises: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    let created = 0;
    let skipped = 0;

    for (const student of students) {
      // Já tem WeeklyPlan com 7 slots? Pular
      if (student.weeklyPlan && student.weeklyPlan.slots.length >= 7) {
        console.log(`⏭️  Student ${student.id} já tem WeeklyPlan, ignorando`);
        skipped++;
        continue;
      }

      // Coletar todos os workouts das units (ordenados)
      const allWorkouts = student.units.flatMap((u) =>
        u.workouts.map((w) => ({ ...w, unitOrder: u.order })),
      );
      allWorkouts.sort((a, b) => {
        if (a.unitOrder !== b.unitOrder) return a.unitOrder - b.unitOrder;
        return (a.order ?? 0) - (b.order ?? 0);
      });

      const title = student.units[0]?.title || "Meu Plano Semanal";

      let weeklyPlan;

      if (student.weeklyPlan && student.weeklyPlan.slots.length < 7) {
        // Plano incompleto - deletar e recriar
        await prisma.planSlot.deleteMany({
          where: { weeklyPlanId: student.weeklyPlan.id },
        });
        weeklyPlan = student.weeklyPlan;
      } else {
        // Criar novo WeeklyPlan
        weeklyPlan = await prisma.weeklyPlan.create({
          data: {
            studentId: student.id,
            title,
          },
        });
      }

      // Criar 7 slots (0=Seg ... 6=Dom)
      // Workouts distribuídos por ordem: slot i recebe workout i (se existir)
      const slotsToCreate = [];
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const workout = allWorkouts[dayOfWeek];
        const isRest =
          !workout || workout.type === "rest" || !workout.exercises?.length;

        slotsToCreate.push({
          weeklyPlanId: weeklyPlan.id,
          dayOfWeek,
          type: isRest ? "rest" : "workout",
          workoutId: isRest ? null : workout.id,
          order: dayOfWeek,
        });
      }

      await prisma.planSlot.createMany({
        data: slotsToCreate,
      });

      const workoutCount = slotsToCreate.filter(
        (s) => s.type === "workout",
      ).length;
      const restCount = 7 - workoutCount;
      console.log(
        `✅ Student ${student.id}: WeeklyPlan criado (${workoutCount} treinos, ${restCount} descansos)`,
      );
      created++;
    }

    console.log("\n✅ Migração aplicada com sucesso!");
    console.log(`   - ${created} WeeklyPlans criados/atualizados`);
    console.log(`   - ${skipped} ignorados (já existiam)`);
    console.log("\n📋 Resumo:");
    console.log("   - Cada student tem 1 WeeklyPlan com 7 PlanSlots (Seg-Dom)");
    console.log("   - Workouts das Units distribuídos nos slots por ordem");
    console.log("   - Slots vazios = type 'rest'");
    console.log("   - Units mantidas para rollback (remover depois)");
  } catch (error) {
    console.error("❌ Erro ao migrar dados:", error);
    process.exit(1);
  }
}

async function main() {
  try {
    await applySchemaMigration();
    await applyDataMigration();
  } finally {
    await prisma.$disconnect();
  }
}

main();
