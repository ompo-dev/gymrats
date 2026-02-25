import { db } from "@/lib/db";
import { Equipment, GymProfile, GymStats } from "@/lib/types";

export class GymInventoryService {
  /**
   * Busca o perfil da academia e inventário
   */
  static async getProfile(gymId: string): Promise<GymProfile | null> {
    const gym = await db.gym.findUnique({
      where: { id: gymId },
      include: {
        profile: true,
      },
    });

    if (!gym || !gym.profile) return null;

    return {
      id: gym.id,
      name: gym.name,
      address: gym.address,
      phone: gym.phone,
      email: gym.email,
      logo: gym.logo || undefined,
      cnpj: gym.cnpj || "",
      plan: gym.plan as any,
      equipmentCount: gym.profile.equipmentCount,
      totalStudents: gym.profile.totalStudents,
      activeStudents: gym.profile.activeStudents,
      rating: gym.rating || 0,
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
    } as GymProfile;
  }

  /**
   * Lista os equipamentos da academia
   */
  static async getEquipment(gymId: string): Promise<Equipment[]> {
    const equipment = await db.equipment.findMany({
      where: { gymId },
      orderBy: { name: "asc" },
    });

    return equipment.map((eq) => ({
      id: eq.id,
      name: eq.name,
      type: eq.type,
      status: eq.status as any,
      lastMaintenance: eq.lastMaintenance || undefined,
      brand: eq.brand || undefined,
      model: eq.model || undefined,
      usageStats: { totalUses: 0, avgUsageTime: 0, popularTimes: [] },
      maintenanceHistory: [],
    } as any));
  }

  /**
   * Busca um equipamento específico por ID
   */
  static async getEquipmentById(gymId: string, equipmentId: string): Promise<Equipment | null> {
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId, gymId },
    });

    if (!equipment) return null;

    return {
      id: equipment.id,
      name: equipment.name,
      type: equipment.type,
      status: equipment.status as any,
      lastMaintenance: equipment.lastMaintenance || undefined,
      brand: equipment.brand || undefined,
      model: equipment.model || undefined,
      usageStats: { totalUses: 0, avgUsageTime: 0, popularTimes: [] },
      maintenanceHistory: [],
    } as any;
  }

  /**
   * Lista os planos de assinatura da academia
   */
  static async getMembershipPlans(gymId: string) {
    const plans = await db.membershipPlan.findMany({
      where: { gymId, isActive: true },
      orderBy: { price: "asc" },
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      type: plan.type as "monthly" | "quarterly" | "semi-annual" | "annual" | "trial",
      price: plan.price,
      duration: plan.duration,
      benefits: plan.benefits ? JSON.parse(plan.benefits) : [],
      isActive: plan.isActive,
    }));
  }

  /**
   * Gera estatísticas gerais da academia
   */
  static async getStats(gymId: string): Promise<GymStats | null> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayCheckIns, activeNow, weekCheckIns, newMembers, canceledMembers, weekRevenueAgg, activeStudents] = await Promise.all([
      db.checkIn.count({ where: { gymId, timestamp: { gte: startOfToday } } }),
      db.checkIn.count({ where: { gymId, timestamp: { gte: startOfToday }, checkOut: null } }),
      db.checkIn.count({ where: { gymId, timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.gymMembership.count({ where: { gymId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.gymMembership.count({ where: { gymId, status: "canceled", updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.payment.aggregate({ where: { gymId, status: "paid", date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, _sum: { amount: true } }),
      db.gymMembership.count({ where: { gymId, status: "active" } }),
    ]);

    return {
      today: {
        checkins: todayCheckIns,
        activeStudents: activeNow,
        equipmentInUse: activeNow,
        peakHour: "18:00", // Placeholder
      },
      week: {
        totalCheckins: weekCheckIns,
        avgDailyCheckins: Math.round(weekCheckIns / 7),
        newMembers,
        canceledMembers,
        revenue: weekRevenueAgg._sum.amount ?? 0,
      },
      month: {
        totalCheckins: 0, // To be implemented
        retentionRate: 0,
        growthRate: 0,
        topStudents: [],
        mostUsedEquipment: [],
      },
    };
  }

  /**
   * Cria uma nova academia e inicializa profile/stats
   */
  static async createGym(userId: string, data: any) {
    const gym = await db.gym.create({
      data: {
        userId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        cnpj: data.cnpj || null,
      },
    });

    await db.gymProfile.create({
      data: { gymId: gym.id, equipmentCount: data.equipment?.length || 0 },
    });

    await db.gymStats.create({
      data: { gymId: gym.id },
    });

    if (data.equipment?.length > 0) {
      await db.equipment.createMany({
        data: data.equipment.map((eq: any) => ({
          gymId: gym.id,
          name: eq.name,
          type: eq.type,
          status: "available",
        })),
        skipDuplicates: true,
      });
    }

    return gym;
  }

  /**
   * Atualiza dados de onboarding de uma academia existente
   */
  static async updateOnboarding(gymId: string, data: any) {
    await db.gym.update({
      where: { id: gymId },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        cnpj: data.cnpj || null,
      },
    });

    await db.gymProfile.upsert({
      where: { gymId },
      create: { gymId, equipmentCount: data.equipment?.length || 0 },
      update: { equipmentCount: data.equipment?.length || 0 },
    });

    if (data.equipment?.length > 0) {
      await db.equipment.createMany({
        data: data.equipment.map((eq: any) => ({
          gymId,
          name: eq.name,
          type: eq.type,
          status: "available",
        })),
        skipDuplicates: true,
      });
    }
  }
}
