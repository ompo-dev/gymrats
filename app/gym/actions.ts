"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { db } from "@/lib/db";
import type {
  GymProfile,
  GymStats,
  StudentData,
  Equipment,
  FinancialSummary,
  Payment,
  Coupon,
  Referral,
  Expense,
  MembershipPlan,
} from "@/lib/types";
import {
  mockGymProfile,
  mockGymStats,
  mockStudents,
  mockEquipment,
  mockFinancialSummary,
  mockRecentCheckIns,
  mockPayments,
  mockCoupons,
  mockReferrals,
  mockExpenses,
  mockMembershipPlans,
} from "@/lib/gym-mock-data";
import type { CheckIn } from "@/lib/types";

export async function getGymProfile() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockGymProfile;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockGymProfile;
    }

    const gym = await db.gym.findUnique({
      where: { id: session.user.gym.id },
      include: {
        profile: true,
      },
    });

    if (!gym || !gym.profile) {
      return mockGymProfile;
    }

    const gymProfile: GymProfile = {
      id: gym.id,
      name: gym.name,
      logo: gym.logo || undefined,
      address: gym.address,
      phone: gym.phone,
      email: gym.email,
      cnpj: gym.cnpj || "",
      plan: gym.plan as "basic" | "premium" | "enterprise",
      totalStudents: gym.profile.totalStudents,
      activeStudents: gym.profile.activeStudents,
      equipmentCount: gym.profile.equipmentCount,
      createdAt: gym.createdAt,
      gamification: {
        level: gym.profile.level,
        xp: gym.profile.xp,
        xpToNextLevel: gym.profile.xpToNextLevel,
        currentStreak: gym.profile.currentStreak,
        longestStreak: gym.profile.longestStreak,
        achievements: [],
        monthlyStudentGoal: gym.profile.monthlyStudentGoal ?? 0,
        avgStudentFrequency: gym.profile.avgStudentFrequency ?? 0,
        equipmentUtilization: gym.profile.equipmentUtilization ?? 0,
        ranking: gym.profile.ranking ?? 0,
      },
    };

    return gymProfile;
  } catch (error) {
    console.error("Erro ao buscar perfil da academia:", error);
    return mockGymProfile;
  }
}

export async function getGymStats() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockGymStats;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockGymStats;
    }

    const stats = await db.gymStats.findUnique({
      where: { gymId: session.user.gym.id },
    });

    if (!stats) {
      return mockGymStats;
    }

    const gymStats: GymStats = {
      today: {
        checkins: stats.todayCheckins,
        activeStudents: stats.todayActiveStudents,
        equipmentInUse: stats.todayEquipmentInUse,
        peakHour: "19:00",
      },
      week: {
        totalCheckins: stats.weekTotalCheckins,
        avgDailyCheckins: stats.weekAvgDailyCheckins,
        newMembers: stats.weekNewMembers,
        canceledMembers: stats.weekCanceledMembers,
        revenue: 0,
      },
      month: {
        totalCheckins: stats.monthTotalCheckins,
        retentionRate: stats.monthRetentionRate,
        growthRate: stats.monthGrowthRate,
        topStudents: [],
        mostUsedEquipment: [],
      },
    };

    return gymStats;
  } catch (error) {
    console.error("Erro ao buscar estatísticas da academia:", error);
    return mockGymStats;
  }
}

export async function getGymStudents() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockStudents;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockStudents;
    }

    const memberships = await db.gymMembership.findMany({
      where: { gymId: session.user.gym.id },
      include: {
        student: {
          include: {
            user: true,
            profile: true,
            progress: true,
          },
        },
      },
    });

    const students: StudentData[] = memberships.map((membership) => {
      const student = membership.student;
      const user = student.user;
      const profile = student.profile;
      const progress = student.progress;

      return {
        id: student.id,
        name: user.name,
        email: user.email,
        avatar: student.avatar || undefined,
        age: student.age ?? 0,
        gender: (student.gender as "male" | "female") || "male",
        phone: student.phone || "",
        membershipStatus: membership.status as
          | "active"
          | "inactive"
          | "suspended",
        joinDate: membership.createdAt,
        lastVisit: undefined,
        totalVisits: 0,
        currentStreak: progress?.currentStreak || 0,
        currentWeight: profile?.weight ?? 0,
        attendanceRate: 0,
        favoriteEquipment: [],
        assignedTrainer: undefined,
        profile: profile
          ? {
              id: student.id,
              name: user.name,
              age: student.age ?? 0,
              gender: (student.gender as "male" | "female") || "male",
              height: profile.height ?? 0,
              weight: profile.weight ?? 0,
              fitnessLevel:
                (profile.fitnessLevel as
                  | "iniciante"
                  | "intermediario"
                  | "avancado") || "iniciante",
              weeklyWorkoutFrequency:
                profile.weeklyWorkoutFrequency || undefined,
              workoutDuration: profile.workoutDuration || undefined,
              goals: profile.goals ? JSON.parse(profile.goals) : [],
              availableEquipment: profile.availableEquipment
                ? JSON.parse(profile.availableEquipment)
                : [],
              gymType: profile.gymType || undefined,
              preferredWorkoutTime: profile.preferredWorkoutTime || undefined,
              preferredSets: profile.preferredSets || undefined,
              preferredRepRange: profile.preferredRepRange || undefined,
              restTime: profile.restTime || undefined,
              targetCalories: profile.targetCalories || undefined,
              targetProtein: profile.targetProtein || undefined,
            }
          : {
              id: student.id,
              name: user.name,
              age: student.age ?? 0,
              gender: (student.gender as "male" | "female") || "male",
              height: 0,
              weight: 0,
              fitnessLevel: undefined,
              weeklyWorkoutFrequency: undefined,
              workoutDuration: undefined,
              goals: [],
              availableEquipment: [],
              gymType: undefined,
              preferredWorkoutTime: undefined,
              preferredSets: undefined,
              preferredRepRange: undefined,
              restTime: undefined,
              targetCalories: undefined,
              targetProtein: undefined,
            },
        progress: progress
          ? {
              currentStreak: progress.currentStreak || 0,
              longestStreak: progress.longestStreak || 0,
              totalXP: progress.totalXP || 0,
              currentLevel: progress.currentLevel || 1,
              xpToNextLevel: progress.xpToNextLevel || 0,
              workoutsCompleted: progress.workoutsCompleted || 0,
              todayXP: progress.todayXP || 0,
              achievements: [],
              lastActivityDate:
                progress.lastActivityDate?.toISOString() ||
                new Date().toISOString(),
              dailyGoalXP: progress.dailyGoalXP || 50,
              weeklyXP: [0, 0, 0, 0, 0, 0, 0],
            }
          : {
              currentStreak: 0,
              longestStreak: 0,
              totalXP: 0,
              currentLevel: 1,
              xpToNextLevel: 100,
              workoutsCompleted: 0,
              todayXP: 0,
              achievements: [],
              lastActivityDate: new Date().toISOString(),
              dailyGoalXP: 50,
              weeklyXP: [0, 0, 0, 0, 0, 0, 0],
            },
        workoutHistory: [],
        personalRecords: [],
        weightHistory: [],
      } as StudentData;
    });

    return students.length > 0 ? students : mockStudents;
  } catch (error) {
    console.error("Erro ao buscar alunos da academia:", error);
    return mockStudents;
  }
}

export async function getGymEquipment() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockEquipment;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockEquipment;
    }

    const equipment = await db.equipment.findMany({
      where: { gymId: session.user.gym.id },
    });

    const equipmentList: Equipment[] = equipment.map((eq) => ({
      id: eq.id,
      name: eq.name,
      type: eq.type as "cardio" | "musculacao" | "funcional",
      brand: eq.brand || undefined,
      model: eq.model || undefined,
      serialNumber: eq.serialNumber || undefined,
      purchaseDate: eq.purchaseDate || undefined,
      lastMaintenance: eq.lastMaintenance || undefined,
      nextMaintenance: eq.nextMaintenance || undefined,
      status: eq.status as "available" | "in-use" | "maintenance" | "broken",
      currentUser:
        eq.currentUserId && eq.currentUserName && eq.currentStartTime
          ? {
              studentId: eq.currentUserId,
              studentName: eq.currentUserName,
              startTime: eq.currentStartTime,
            }
          : undefined,
      usageStats: {
        totalUses: 0,
        avgUsageTime: 0,
        popularTimes: [],
      },
      maintenanceHistory: [],
    }));

    return equipmentList.length > 0 ? equipmentList : mockEquipment;
  } catch (error) {
    console.error("Erro ao buscar equipamentos da academia:", error);
    return mockEquipment;
  }
}

export async function getGymFinancialSummary() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockFinancialSummary;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockFinancialSummary;
    }

    const payments = await db.payment.findMany({
      where: { gymId: session.user.gym.id },
    });

    const expenses = await db.expense.findMany({
      where: { gymId: session.user.gym.id },
    });

    const totalRevenue = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const pendingPayments = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const overduePayments = payments
      .filter((p) => p.status === "overdue")
      .reduce((sum, p) => sum + p.amount, 0);

    const financialSummary: FinancialSummary = {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      monthlyRecurring: totalRevenue,
      pendingPayments,
      overduePayments,
      averageTicket: payments.length > 0 ? totalRevenue / payments.length : 0,
      churnRate: 0,
      revenueGrowth: 0,
    };

    return financialSummary;
  } catch (error) {
    console.error("Erro ao buscar resumo financeiro:", error);
    return mockFinancialSummary;
  }
}

export async function getGymRecentCheckIns() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockRecentCheckIns;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockRecentCheckIns;
    }

    const checkIns = await db.checkIn.findMany({
      where: { gymId: session.user.gym.id },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    const recentCheckIns: CheckIn[] = checkIns.map((checkIn) => ({
      id: checkIn.id,
      studentId: checkIn.studentId,
      studentName: checkIn.studentName,
      timestamp: checkIn.timestamp,
    }));

    return recentCheckIns.length > 0 ? recentCheckIns : mockRecentCheckIns;
  } catch (error) {
    console.error("Erro ao buscar check-ins recentes:", error);
    return mockRecentCheckIns;
  }
}

export async function getGymEquipmentById(equipmentId: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockEquipment.find((e) => e.id === equipmentId) || null;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockEquipment.find((e) => e.id === equipmentId) || null;
    }

    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId, gymId: session.user.gym.id },
      include: {
        maintenanceHistory: true,
      },
    });

    if (!equipment) {
      return null;
    }

    const equipmentData: Equipment = {
      id: equipment.id,
      name: equipment.name,
      type: equipment.type as "cardio" | "musculacao" | "funcional",
      brand: equipment.brand || undefined,
      model: equipment.model || undefined,
      serialNumber: equipment.serialNumber || undefined,
      purchaseDate: equipment.purchaseDate || undefined,
      lastMaintenance: equipment.lastMaintenance || undefined,
      nextMaintenance: equipment.nextMaintenance || undefined,
      status: equipment.status as
        | "available"
        | "in-use"
        | "maintenance"
        | "broken",
      currentUser:
        equipment.currentUserId &&
        equipment.currentUserName &&
        equipment.currentStartTime
          ? {
              studentId: equipment.currentUserId,
              studentName: equipment.currentUserName,
              startTime: equipment.currentStartTime,
            }
          : undefined,
      usageStats: {
        totalUses: 0,
        avgUsageTime: 0,
        popularTimes: [],
      },
      maintenanceHistory: equipment.maintenanceHistory.map((record) => ({
        id: record.id,
        date: record.date,
        type: record.type as "preventive" | "corrective" | "inspection",
        description: record.description || "",
        performedBy: record.performedBy || "",
        cost: record.cost || undefined,
        nextScheduled: record.nextScheduled || undefined,
      })),
    };

    return equipmentData;
  } catch (error) {
    console.error("Erro ao buscar equipamento:", error);
    return mockEquipment.find((e) => e.id === equipmentId) || null;
  }
}

export async function getGymStudentById(studentId: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockStudents.find((s) => s.id === studentId) || null;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockStudents.find((s) => s.id === studentId) || null;
    }

    const membership = await db.gymMembership.findFirst({
      where: {
        gymId: session.user.gym.id,
        studentId: studentId,
      },
      include: {
        student: {
          include: {
            user: true,
            profile: true,
            progress: true,
          },
        },
      },
    });

    if (!membership || !membership.student) {
      return null;
    }

    const student = membership.student;
    const user = student.user;
    const profile = student.profile;
    const progress = student.progress;

    const studentData: StudentData = {
      id: student.id,
      name: user.name,
      email: user.email,
      avatar: student.avatar || undefined,
      age: student.age ?? 0,
      gender: (student.gender as "male" | "female") || "male",
      phone: student.phone || "",
      membershipStatus: membership.status as
        | "active"
        | "inactive"
        | "suspended",
      joinDate: membership.createdAt,
      lastVisit: undefined,
      totalVisits: 0,
      currentStreak: progress?.currentStreak || 0,
      currentWeight: profile?.weight ?? 0,
      attendanceRate: 0,
      favoriteEquipment: [],
      assignedTrainer: undefined,
      profile: profile
        ? {
            id: student.id,
            name: user.name,
            age: student.age ?? 0,
            gender: (student.gender as "male" | "female") || "male",
            height: profile.height ?? 0,
            weight: profile.weight ?? 0,
            fitnessLevel:
              (profile.fitnessLevel as
                | "iniciante"
                | "intermediario"
                | "avancado") || "iniciante",
            weeklyWorkoutFrequency: profile.weeklyWorkoutFrequency || undefined,
            workoutDuration: profile.workoutDuration || undefined,
            goals: profile.goals ? JSON.parse(profile.goals) : [],
            availableEquipment: profile.availableEquipment
              ? JSON.parse(profile.availableEquipment)
              : [],
            gymType: profile.gymType || undefined,
            preferredWorkoutTime: profile.preferredWorkoutTime || undefined,
            preferredSets: profile.preferredSets || undefined,
            preferredRepRange: profile.preferredRepRange || undefined,
            restTime: profile.restTime || undefined,
            targetCalories: profile.targetCalories || undefined,
            targetProtein: profile.targetProtein || undefined,
            targetCarbs: profile.targetCarbs || undefined,
            targetFats: profile.targetFats || undefined,
          }
        : {
            id: student.id,
            name: user.name,
            age: student.age ?? 0,
            gender: (student.gender as "male" | "female") || "male",
            height: 0,
            weight: 0,
            fitnessLevel: undefined,
            weeklyWorkoutFrequency: undefined,
            workoutDuration: undefined,
            goals: [],
            availableEquipment: [],
            gymType: undefined,
            preferredWorkoutTime: undefined,
            preferredSets: undefined,
            preferredRepRange: undefined,
            restTime: undefined,
            targetCalories: undefined,
            targetProtein: undefined,
            targetCarbs: undefined,
            targetFats: undefined,
          },
      progress: progress
        ? {
            currentStreak: progress.currentStreak || 0,
            longestStreak: progress.longestStreak || 0,
            totalXP: progress.totalXP || 0,
            currentLevel: progress.currentLevel || 1,
            xpToNextLevel: progress.xpToNextLevel || 0,
            workoutsCompleted: progress.workoutsCompleted || 0,
            todayXP: progress.todayXP || 0,
            achievements: [],
            lastActivityDate:
              progress.lastActivityDate?.toISOString() ||
              new Date().toISOString(),
            dailyGoalXP: progress.dailyGoalXP || 50,
            weeklyXP: [0, 0, 0, 0, 0, 0, 0],
          }
        : {
            currentStreak: 0,
            longestStreak: 0,
            totalXP: 0,
            currentLevel: 1,
            xpToNextLevel: 100,
            workoutsCompleted: 0,
            todayXP: 0,
            achievements: [],
            lastActivityDate: new Date().toISOString(),
            dailyGoalXP: 50,
            weeklyXP: [0, 0, 0, 0, 0, 0, 0],
          },
      workoutHistory: [],
      personalRecords: [],
      weightHistory: [],
    };

    return studentData;
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    return mockStudents.find((s) => s.id === studentId) || null;
  }
}

export async function getGymStudentPayments(studentId: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockPayments.filter((p) => p.studentId === studentId);
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockPayments.filter((p) => p.studentId === studentId);
    }

    const payments = await db.payment.findMany({
      where: {
        gymId: session.user.gym.id,
        studentId: studentId,
      },
      include: {
        plan: true,
      },
    });

    const paymentList: Payment[] = payments.map((payment) => ({
      id: payment.id,
      studentId: payment.studentId,
      studentName: payment.studentName,
      planId: payment.planId || "",
      planName: payment.plan?.name || "",
      amount: payment.amount,
      date: payment.date,
      dueDate: payment.dueDate,
      status: payment.status as "paid" | "pending" | "overdue",
      paymentMethod:
        (payment.paymentMethod as "pix" | "credit-card" | "bank-transfer") ||
        "pix",
    }));

    return paymentList.length > 0
      ? paymentList
      : mockPayments.filter((p) => p.studentId === studentId);
  } catch (error) {
    console.error("Erro ao buscar pagamentos do aluno:", error);
    return mockPayments.filter((p) => p.studentId === studentId);
  }
}

export async function getGymPayments() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockPayments;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockPayments;
    }

    const payments = await db.payment.findMany({
      where: { gymId: session.user.gym.id },
      orderBy: { dueDate: "desc" },
      include: {
        plan: true,
      },
    });

    const paymentList: Payment[] = payments.map((payment) => ({
      id: payment.id,
      studentId: payment.studentId,
      studentName: payment.studentName,
      planId: payment.planId || "",
      planName: payment.plan?.name || "",
      amount: payment.amount,
      date: payment.date,
      dueDate: payment.dueDate,
      status: payment.status as "paid" | "pending" | "overdue",
      paymentMethod:
        (payment.paymentMethod as "pix" | "credit-card" | "bank-transfer") ||
        "pix",
    }));

    return paymentList.length > 0 ? paymentList : mockPayments;
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    return mockPayments;
  }
}

export async function getGymCoupons() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockCoupons;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockCoupons;
    }

    return mockCoupons;
  } catch (error) {
    console.error("Erro ao buscar cupons:", error);
    return mockCoupons;
  }
}

export async function getGymReferrals() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockReferrals;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockReferrals;
    }

    return mockReferrals;
  } catch (error) {
    console.error("Erro ao buscar indicações:", error);
    return mockReferrals;
  }
}

export async function getGymExpenses() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockExpenses;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockExpenses;
    }

    const expenses = await db.expense.findMany({
      where: { gymId: session.user.gym.id },
      orderBy: { date: "desc" },
    });

    const expenseList: Expense[] = expenses.map((expense) => {
      const expenseTypeMap: Record<
        string,
        "maintenance" | "equipment" | "staff" | "utilities" | "rent" | "other"
      > = {
        maintenance: "maintenance",
        equipment: "equipment",
        staff: "staff",
        utilities: "utilities",
        rent: "rent",
        operational: "other",
        marketing: "other",
        other: "other",
      };

      return {
        id: expense.id,
        type: expenseTypeMap[expense.type] || "other",
        description: expense.description || "",
        amount: expense.amount,
        date: expense.date,
        category: expense.category || "",
      };
    });

    return expenseList.length > 0 ? expenseList : mockExpenses;
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
    return mockExpenses;
  }
}

export async function getGymMembershipPlans() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockMembershipPlans;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return mockMembershipPlans;
    }

    return mockMembershipPlans;
  } catch (error) {
    console.error("Erro ao buscar planos de assinatura:", error);
    return mockMembershipPlans;
  }
}

export async function getGymSubscription() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return null;
    }

    const subscription = await db.gymSubscription.findUnique({
      where: { gymId: session.user.gym.id },
    });

    if (!subscription) {
      return null;
    }

    const activeStudents = await db.gymMembership.count({
      where: {
        gymId: session.user.gym.id,
        status: "active",
      },
    });

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      basePrice: subscription.basePrice,
      pricePerStudent: subscription.pricePerStudent,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      trialStart: subscription.trialStart,
      trialEnd: subscription.trialEnd,
      isTrial: subscription.trialEnd
        ? new Date() < subscription.trialEnd
        : false,
      daysRemaining: subscription.trialEnd
        ? Math.max(
            0,
            Math.ceil(
              (subscription.trialEnd.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null,
      activeStudents,
      billingPeriod: subscription.billingPeriod || "monthly", // Default para monthly se não existir
      totalAmount:
        (subscription.billingPeriod || "monthly") === "annual"
          ? subscription.basePrice // Plano anual: preço fixo, sem cobrança por aluno
          : subscription.basePrice +
            subscription.pricePerStudent * activeStudents, // Plano mensal: base + por aluno
    };
  } catch (error) {
    console.error("Erro ao buscar assinatura:", error);
    return null;
  }
}

export async function startGymTrial() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return { error: "Não autenticado" };
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.gym) {
      return { error: "Academia não encontrada" };
    }

    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId: session.user.gym.id },
    });

    if (existingSubscription) {
      return { error: "Assinatura já existe" };
    }

    const activeStudents = await db.gymMembership.count({
      where: {
        gymId: session.user.gym.id,
        status: "active",
      },
    });

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const planPrices = {
      basic: { base: 150, perStudent: 1.5 },
      premium: { base: 250, perStudent: 1 },
      enterprise: { base: 400, perStudent: 0.5 },
    };

    const prices = planPrices.basic;

    const subscription = await db.gymSubscription.create({
      data: {
        gymId: session.user.gym.id,
        plan: "basic",
        billingPeriod: "monthly", // Trial sempre é mensal
        status: "trialing",
        basePrice: prices.base,
        pricePerStudent: prices.perStudent,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd: trialEnd,
      },
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("Erro ao iniciar trial:", error);
    return { error: "Erro ao iniciar trial" };
  }
}
