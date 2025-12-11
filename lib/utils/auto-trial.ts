import { db } from "@/lib/db";

export async function initializeStudentTrial(studentId: string) {
  try {
    const existingSubscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const subscription = await db.subscription.create({
      data: {
        studentId,
        plan: "premium",
        status: "trialing",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd: trialEnd,
      },
    });

    return subscription;
  } catch (error) {
    console.error("Erro ao inicializar trial do aluno:", error);
    return null;
  }
}

export async function initializeGymTrial(gymId: string) {
  try {
    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    const activeStudents = await db.gymMembership.count({
      where: {
        gymId,
        status: "active",
      },
    });

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const subscription = await db.gymSubscription.create({
      data: {
        gymId,
        plan: "basic",
        billingPeriod: "monthly", // Trial sempre é mensal
        status: "trialing",
        basePrice: 150,
          pricePerStudent: 1.5,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd: trialEnd,
      },
    });

    return subscription;
  } catch (error) {
    console.error("Erro ao inicializar trial da academia:", error);
    return null;
  }
}

