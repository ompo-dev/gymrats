import type { StudentData } from "@gymrats/types";
import type { GymDataSection, GymUnifiedData } from "@gymrats/types/gym-unified";
import { createBootstrapResponse, measureBootstrapSection } from "@gymrats/domain";
import {
  centsToReais,
  getGymPlanConfig,
} from "@/lib/access-control/plans-config";
import { db } from "@/lib/db";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { GymFinancialService } from "@/lib/services/gym/gym-financial.service";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";
import { GymMemberService } from "@/lib/services/gym/gym-member.service";
import { getTimeMs } from "@/lib/utils/date-safe";

export const DEFAULT_GYM_BOOTSTRAP_SECTIONS: GymDataSection[] = [
  "profile",
  "stats",
  "students",
  "equipment",
  "financialSummary",
  "recentCheckIns",
  "membershipPlans",
  "payments",
  "expenses",
  "coupons",
  "campaigns",
  "balanceWithdraws",
  "subscription",
];

type MemberWithStudent = {
  student: {
    id: string;
    user?: { name?: string; email?: string; image?: string };
    avatar?: string;
    name?: string;
    email?: string;
    age?: number;
    gender?: string;
    phone?: string;
    profile?: Record<string, unknown>;
    progress?: Record<string, unknown>;
  };
  studentId?: string;
  status?: string;
  membershipStatus?: string;
  createdAt: Date;
  joinDate?: Date;
};

function transformMembersToStudents(members: MemberWithStudent[]): StudentData[] {
  return members.map((membership) => {
    const student = membership.student ?? membership;
    const user = student.user ?? {};
    const profile = student.profile ?? {};
    const progress = student.progress ?? {};
    const status =
      membership.status ?? membership.membershipStatus ?? "active";

    return {
      id:
        student.id ??
        membership.studentId ??
        "",
      name: (user.name as string) ?? (student.name as string) ?? "",
      email: (user.email as string) ?? (student.email as string) ?? "",
      avatar: (student.avatar ?? user.image) as string | undefined,
      age: (student.age as number) ?? 0,
      gender: (student.gender as string) ?? "",
      phone: (student.phone as string) ?? "",
      membershipStatus:
        status === "active"
          ? "active"
          : status === "suspended"
            ? "suspended"
            : "inactive",
      joinDate: membership.createdAt ?? membership.joinDate,
      totalVisits: (progress.workoutsCompleted as number) ?? 0,
      currentStreak: (progress.currentStreak as number) ?? 0,
      currentWeight: (profile.weight as number) ?? 0,
      attendanceRate: 0,
      profile: {
        id: student.id,
        height: (profile.height as number) ?? 0,
        weight: (profile.weight as number) ?? 0,
        fitnessLevel: (profile.fitnessLevel as string) ?? "beginner",
        goals: Array.isArray(profile.goals)
          ? profile.goals
          : typeof profile.goals === "string"
            ? (() => {
                try {
                  return JSON.parse(profile.goals) ?? [];
                } catch {
                  return [];
                }
              })()
            : [],
        weeklyWorkoutFrequency: (profile.weeklyWorkoutFrequency as number) ?? 0,
      },
      progress: {
        currentStreak: (progress.currentStreak as number) ?? 0,
        totalXP: (progress.totalXP as number) ?? 0,
        currentLevel: (progress.currentLevel as number) ?? 1,
        xpToNextLevel: (progress.xpToNextLevel as number) ?? 100,
        weeklyXP: Array.isArray(progress.weeklyXP)
          ? progress.weeklyXP
          : [0, 0, 0, 0, 0, 0, 0],
      },
      workoutHistory: [],
      personalRecords: [],
      weightHistory: [],
      favoriteEquipment: [],
    };
  }) as StudentData[];
}

export function parseGymBootstrapSections(sectionsParam?: string): GymDataSection[] {
  if (!sectionsParam) {
    return DEFAULT_GYM_BOOTSTRAP_SECTIONS;
  }

  const allowed = new Set(DEFAULT_GYM_BOOTSTRAP_SECTIONS);
  const sections = sectionsParam
    .split(",")
    .map((section) => section.trim())
    .filter(
      (section): section is GymDataSection =>
        allowed.has(section as GymDataSection),
    );

  return sections.length > 0 ? [...new Set(sections)] : DEFAULT_GYM_BOOTSTRAP_SECTIONS;
}

async function getGymSubscriptionSnapshot(gymId: string) {
  const subscription = await db.gymSubscription.findUnique({
    where: { gymId },
  });

  if (!subscription) {
    return null;
  }

  const [activeStudents, activePersonals, hasEverPaid] = await Promise.all([
    db.gymMembership.count({
      where: { gymId, status: "active" },
    }),
    db.gymPersonalAffiliation.count({
      where: { gymId, status: "active" },
    }),
    db.subscriptionPayment.count({
      where: {
        gymSubscriptionId: subscription.id,
        status: "succeeded",
      },
    }),
  ]);

  const billingPeriod =
    (subscription.billingPeriod as "monthly" | "annual" | undefined) ??
    "monthly";
  const planConfig = getGymPlanConfig(subscription.plan);
  const basePrice = planConfig
    ? centsToReais(planConfig.prices[billingPeriod])
    : subscription.basePrice;
  const pricePerStudent = planConfig
    ? billingPeriod === "annual"
      ? 0
      : centsToReais(planConfig.pricePerStudent)
    : subscription.pricePerStudent;
  const pricePerPersonal = planConfig
    ? billingPeriod === "annual"
      ? 0
      : centsToReais(planConfig.pricePerPersonal ?? 0)
    : (subscription.pricePerPersonal ?? 0);
  const trialEndMs = getTimeMs(subscription.trialEnd);
  const isTrial = !!subscription.trialEnd && (trialEndMs ?? 0) > Date.now();
  const daysRemaining =
    trialEndMs != null
      ? Math.max(0, Math.ceil((trialEndMs - Date.now()) / (1000 * 3600 * 24)))
      : null;
  const totalAmount =
    billingPeriod === "annual"
      ? basePrice
      : basePrice +
        pricePerStudent * activeStudents +
        pricePerPersonal * activePersonals;
  const hasHistoricalPaidStatus = ["active", "canceled", "expired"].includes(
    subscription.status,
  );
  const isFirstPayment =
    isTrial || (!hasHistoricalPaidStatus && hasEverPaid === 0);

  return {
    ...subscription,
    billingPeriod,
    basePrice,
    pricePerStudent,
    pricePerPersonal,
    isTrial,
    daysRemaining,
    activeStudents,
    activePersonals,
    totalAmount,
    isFirstPayment,
  };
}

async function loadGymBootstrapSection(
  gymId: string,
  section: GymDataSection,
): Promise<Partial<GymUnifiedData>> {
  switch (section) {
    case "profile":
      return { profile: await GymInventoryService.getProfile(gymId) };
    case "stats":
      return { stats: await GymInventoryService.getStats(gymId) };
    case "students":
      return {
        students: transformMembersToStudents(
          (await GymDomainService.getMembers(gymId, {
            status: "all",
          })) as unknown as MemberWithStudent[],
        ),
      };
    case "equipment":
      return {
        equipment: await db.equipment.findMany({
          where: { gymId },
          orderBy: { createdAt: "desc" },
        }),
      };
    case "financialSummary":
      return {
        financialSummary: await GymFinancialService.getFinancialSummary(gymId),
      };
    case "recentCheckIns":
      return {
        recentCheckIns: await GymMemberService.getRecentCheckIns(gymId),
      };
    case "membershipPlans":
      return {
        membershipPlans: await GymDomainService.getPlans(gymId, {
          includeInactive: true,
        }),
      };
    case "payments":
      return {
        payments: await GymDomainService.getPayments(gymId, { limit: 50 }),
      };
    case "expenses":
      return {
        expenses: await GymDomainService.getExpenses(gymId, { limit: 50 }),
      };
    case "coupons": {
      const now = new Date();
      await db.gymCoupon.updateMany({
        where: {
          gymId,
          isActive: true,
          expiresAt: { lt: now },
        },
        data: { isActive: false },
      });
      const coupons = await db.gymCoupon.findMany({
        where: { gymId },
        orderBy: { createdAt: "desc" },
      });
      return {
        coupons: coupons.map((coupon) => ({
          id: coupon.id,
          code: coupon.code,
          type: coupon.discountType as "percentage" | "fixed",
          value: coupon.discountValue,
          maxUses: coupon.maxUses === -1 ? 999999 : coupon.maxUses,
          currentUses: coupon.currentUses,
          expiryDate: coupon.expiresAt ?? new Date(9999, 11, 31),
          isActive: coupon.isActive,
        })) as GymUnifiedData["coupons"],
      };
    }
    case "campaigns":
      return {
        campaigns: await db.boostCampaign.findMany({
          where: { gymId },
          orderBy: { createdAt: "desc" },
        }),
      };
    case "balanceWithdraws":
      return {
        balanceWithdraws: await GymFinancialService.getBalanceAndWithdraws(gymId),
      };
    case "subscription":
      return {
        subscription: await getGymSubscriptionSnapshot(gymId),
      };
    default:
      return {};
  }
}

export async function buildGymBootstrap(options: {
  gymId: string;
  sections?: GymDataSection[];
}) {
  const sections = options.sections ?? DEFAULT_GYM_BOOTSTRAP_SECTIONS;
  const sectionTimings: Record<string, number> = {};
  const mergedData: Partial<GymUnifiedData> = {};

  await Promise.all(
    sections.map(async (section) => {
      const sectionPayload = await measureBootstrapSection(
        section,
        sectionTimings,
        () => loadGymBootstrapSection(options.gymId, section),
      );
      Object.assign(mergedData, sectionPayload);
    }),
  );

  return createBootstrapResponse({
    data: mergedData,
    sectionTimings,
    cache: {
      hit: false,
      strategy: "gym-bootstrap",
    },
  });
}
