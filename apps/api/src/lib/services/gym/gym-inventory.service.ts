import { getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";
import type {
  Equipment,
  GymProfile,
  GymStats,
  MaintenanceRecord,
} from "@/lib/types";

interface CreateGymInput {
  name: string;
  address: string;
  phone: string;
  email: string;
  cnpj?: string;
  latitude?: number | null;
  longitude?: number | null;
  equipment?: Array<{ name: string; type: string }>;
}

interface UpdateOnboardingInput {
  name: string;
  address: string;
  phone: string;
  email: string;
  cnpj?: string;
  latitude?: number | null;
  longitude?: number | null;
  equipment?: Array<{ name: string; type: string }>;
}

const GYM_PROFILE_CACHE_TTL_SECONDS = 30;
const GYM_EQUIPMENT_CACHE_TTL_SECONDS = 30;
const GYM_STATS_CACHE_TTL_SECONDS = 15;

function buildGymInventoryCacheKey(
  gymId: string,
  resource: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  const query = Object.entries(params ?? {})
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return query.length > 0
    ? `gym:inventory:${gymId}:${resource}:${query}`
    : `gym:inventory:${gymId}:${resource}`;
}

function normalizeMaintenanceType(
  type?: string | null,
): MaintenanceRecord["type"] {
  if (type === "preventive" || type === "corrective") {
    return type;
  }

  return "inspection";
}

function mapEquipment(eq: {
  id: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: Date | null;
  lastMaintenance: Date | null;
  nextMaintenance: Date | null;
  status: string;
  currentUserId: string | null;
  currentUserName: string | null;
  currentStartTime: Date | null;
  qrCode: string | null;
  maintenanceHistory?: Array<{
    id: string;
    date: Date;
    type: string;
    description: string | null;
    performedBy: string | null;
    cost: number | null;
    nextScheduled: Date | null;
  }>;
}): Equipment {
  return {
    id: eq.id,
    name: eq.name,
    type: eq.type,
    status: eq.status as Equipment["status"],
    brand: eq.brand || undefined,
    model: eq.model || undefined,
    serialNumber: eq.serialNumber || undefined,
    purchaseDate: eq.purchaseDate || undefined,
    lastMaintenance: eq.lastMaintenance || undefined,
    nextMaintenance: eq.nextMaintenance || undefined,
    currentUser: eq.currentUserId
      ? {
          studentId: eq.currentUserId,
          studentName: eq.currentUserName ?? "Aluno",
          startTime: eq.currentStartTime ?? new Date(),
        }
      : undefined,
    usageStats: { totalUses: 0, avgUsageTime: 0, popularTimes: [] },
    maintenanceHistory: (eq.maintenanceHistory ?? []).map((record) => ({
      id: record.id,
      date: record.date,
      type: normalizeMaintenanceType(record.type),
      description: record.description ?? "",
      performedBy: record.performedBy ?? "",
      cost: record.cost ?? undefined,
      nextScheduled: record.nextScheduled ?? undefined,
    })),
    qrCode: eq.qrCode || undefined,
  };
}

export class GymInventoryService {
  /**
   * Busca o perfil da academia e inventário
   */
  static async getProfile(
    gymId: string,
    options?: { fresh?: boolean },
  ): Promise<GymProfile | null> {
    const cacheKey = buildGymInventoryCacheKey(gymId, "profile");

    if (!options?.fresh) {
      const cached = await getCachedJson<GymProfile | null>(cacheKey);
      if (cached) {
        return cached as GymProfile | null;
      }
    }

    const gym = await db.gym.findUnique({
      where: { id: gymId },
      include: {
        profile: true,
      },
    });

    if (!gym || !gym.profile) return null;

    let openingHours:
      | {
          open: string;
          close: string;
          days: string[];
          byDay?: Record<string, { open: string; close: string }>;
        }
      | undefined;
    if (gym.openingHours) {
      try {
        openingHours = JSON.parse(gym.openingHours) as {
          open: string;
          close: string;
          days: string[];
          byDay?: Record<string, { open: string; close: string }>;
        };
      } catch {
        openingHours = undefined;
      }
    }

    const profile = {
      id: gym.id,
      name: gym.name,
      address: gym.address,
      phone: gym.phone,
      email: gym.email,
      logo: gym.logo || undefined,
      cnpj: gym.cnpj || "",
      pixKey: gym.pixKey || undefined,
      pixKeyType: gym.pixKeyType || undefined,
      openingHours,
      plan: (gym.plan ?? "basic") as GymProfile["plan"],
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

    await setCachedJson(cacheKey, profile, GYM_PROFILE_CACHE_TTL_SECONDS);

    return profile;
  }

  /**
   * Lista os equipamentos da academia
   */
  static async getEquipment(
    gymId: string,
    options?: { fresh?: boolean },
  ): Promise<Equipment[]> {
    const cacheKey = buildGymInventoryCacheKey(gymId, "equipment");

    if (!options?.fresh) {
      const cached = await getCachedJson<Equipment[]>(cacheKey);
      if (cached) {
        return cached as Equipment[];
      }
    }

    const equipment = await db.equipment.findMany({
      where: { gymId },
      orderBy: { name: "asc" },
      include: {
        maintenanceHistory: {
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });

    const payload = equipment.map(mapEquipment);

    await setCachedJson(cacheKey, payload, GYM_EQUIPMENT_CACHE_TTL_SECONDS);

    return payload;
  }

  /**
   * Busca um equipamento específico por ID
   */
  static async getEquipmentById(
    gymId: string,
    equipmentId: string,
  ): Promise<Equipment | null> {
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId, gymId },
      include: {
        maintenanceHistory: {
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });

    if (!equipment) return null;

    return mapEquipment(equipment);
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
      type: plan.type as
        | "monthly"
        | "quarterly"
        | "semi-annual"
        | "annual"
        | "trial",
      price: plan.price,
      duration: plan.duration,
      benefits: plan.benefits ? JSON.parse(plan.benefits) : [],
      isActive: plan.isActive,
    }));
  }

  /**
   * Gera estatísticas gerais da academia
   */
  static async getStats(
    gymId: string,
    options?: { fresh?: boolean },
  ): Promise<GymStats | null> {
    const cacheKey = buildGymInventoryCacheKey(gymId, "stats");

    if (!options?.fresh) {
      const cached = await getCachedJson<GymStats | null>(cacheKey);
      if (cached) {
        return cached as GymStats | null;
      }
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(
      startOfToday.getFullYear(),
      startOfToday.getMonth(),
      1,
    );

    const [
      todayCheckIns,
      activeNow,
      weekCheckIns,
      newMembers,
      canceledMembers,
      weekRevenueAgg,
      _activeStudents,
      monthCheckIns,
      monthTopStudentsRaw,
      weekCheckInsRaw,
    ] = await Promise.all([
      db.accessEvent.count({
        where: {
          gymId,
          subjectType: "STUDENT",
          status: "applied",
          directionResolved: "entry",
          occurredAt: { gte: startOfToday },
        },
      }),
      db.presenceSession.count({
        where: {
          gymId,
          subjectType: "STUDENT",
          status: "open",
        },
      }),
      db.accessEvent.count({
        where: {
          gymId,
          subjectType: "STUDENT",
          status: "applied",
          directionResolved: "entry",
          occurredAt: { gte: startOfWeek },
        },
      }),
      db.gymMembership.count({
        where: { gymId, createdAt: { gte: startOfWeek } },
      }),
      db.gymMembership.count({
        where: { gymId, status: "canceled", updatedAt: { gte: startOfWeek } },
      }),
      db.payment.aggregate({
        where: { gymId, status: "paid", date: { gte: startOfWeek } },
        _sum: { amount: true },
      }),
      db.gymMembership.count({ where: { gymId, status: "active" } }),
      db.accessEvent.count({
        where: {
          gymId,
          subjectType: "STUDENT",
          status: "applied",
          directionResolved: "entry",
          occurredAt: { gte: startOfMonth },
        },
      }),
      db.accessEvent.groupBy({
        by: ["studentId", "subjectName"],
        where: {
          gymId,
          subjectType: "STUDENT",
          status: "applied",
          directionResolved: "entry",
          occurredAt: { gte: startOfMonth },
          studentId: { not: null },
        },
        _count: { id: true },
      }),
      db.accessEvent.findMany({
        where: {
          gymId,
          subjectType: "STUDENT",
          status: "applied",
          directionResolved: "entry",
          occurredAt: { gte: startOfWeek },
        },
        select: { occurredAt: true },
      }),
    ]);

    const sortedTop = monthTopStudentsRaw
      .sort((a, b) => b._count.id - a._count.id)
      .slice(0, 5);

    const year = startOfToday.getFullYear();
    const month = startOfToday.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const topStudents = await Promise.all(
      sortedTop.map(async (row) => {
        const student = row.studentId
          ? await db.student.findUnique({
              where: { id: row.studentId },
              select: { avatar: true },
            })
          : null;
        const checkins = row._count.id;
        const attendanceRate = Math.round((checkins / daysInMonth) * 100);
        return {
          id: row.studentId ?? "",
          name: row.subjectName ?? "Aluno",
          avatar: student?.avatar ?? undefined,
          totalVisits: checkins,
          checkins,
          attendanceRate,
        };
      }),
    );

    const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const DAY_KEYS = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const byDay: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };
    const byHour: Record<number, number> = {};
    for (let h = 6; h <= 22; h++) byHour[h] = 0;

    for (const c of weekCheckInsRaw) {
      const d = new Date(c.occurredAt);
      const dayOfWeek = d.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      byDay[dayIndex] = (byDay[dayIndex] ?? 0) + 1;
      const hour = d.getHours();
      if (hour >= 6 && hour <= 22) {
        byHour[hour] = (byHour[hour] ?? 0) + 1;
      }
    }

    const checkinsByDay = DAY_LABELS.map((day, i) => ({
      day,
      dayKey: DAY_KEYS[i],
      checkins: byDay[i] ?? 0,
    }));

    const checkinsByHour = Object.entries(byHour)
      .map(([h, count]) => ({
        hour: `${h}h`,
        hourNum: Number(h),
        checkins: count,
      }))
      .sort((a, b) => a.hourNum - b.hourNum);

    const peakHourNum = checkinsByHour.reduce(
      (best, cur) => (cur.checkins > best.checkins ? cur : best),
      { hourNum: 18, checkins: 0 },
    );

    const stats = {
      today: {
        checkins: todayCheckIns,
        activeStudents: activeNow,
        equipmentInUse: activeNow,
        peakHour: `${String(peakHourNum.hourNum).padStart(2, "0")}:00`,
      },
      week: {
        totalCheckins: weekCheckIns,
        avgDailyCheckins: Math.round(weekCheckIns / 7),
        newMembers,
        canceledMembers,
        revenue: weekRevenueAgg._sum.amount ?? 0,
        checkinsByDay,
        checkinsByHour,
      },
      month: {
        totalCheckins: monthCheckIns,
        retentionRate: 0,
        growthRate: 0,
        topStudents,
        mostUsedEquipment: [],
      },
    };

    await setCachedJson(cacheKey, stats, GYM_STATS_CACHE_TTL_SECONDS);

    return stats;
  }

  /**
   * Cria uma nova academia e inicializa profile/stats
   */
  static async createGym(userId: string, data: CreateGymInput) {
    const gym = await db.gym.create({
      data: {
        userId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        cnpj: data.cnpj || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
    });

    await db.gymProfile.create({
      data: { gymId: gym.id, equipmentCount: data.equipment?.length || 0 },
    });

    await db.gymStats.create({
      data: { gymId: gym.id },
    });

    if (data.equipment && data.equipment.length > 0) {
      await db.equipment.createMany({
        data: data.equipment.map((eq) => ({
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
  static async updateOnboarding(gymId: string, data: UpdateOnboardingInput) {
    await db.gym.update({
      where: { id: gymId },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        cnpj: data.cnpj || null,
        ...(data.latitude != null && { latitude: data.latitude }),
        ...(data.longitude != null && { longitude: data.longitude }),
      },
    });

    await db.gymProfile.upsert({
      where: { gymId },
      create: { gymId, equipmentCount: data.equipment?.length || 0 },
      update: { equipmentCount: data.equipment?.length || 0 },
    });

    if (data.equipment && data.equipment.length > 0) {
      await db.equipment.createMany({
        data: data.equipment.map((eq) => ({
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
