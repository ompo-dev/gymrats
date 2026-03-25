import { db } from "@gymrats/db";
import type { Prisma } from "@prisma/client";

/**
 * Service to centralize gym domain operations and stat updates
 */
export class BaseGymDomainService {
  /**
   * Increments equipment count for a gym
   */
  static async incrementEquipmentCount(gymId: string) {
    return db.gymProfile.update({
      where: { gymId },
      data: { equipmentCount: { increment: 1 } },
    });
  }

  /**
   * Adds XP to a gym profile
   */
  static async addGymXP(gymId: string, amount: number) {
    return db.gymProfile.updateMany({
      where: { gymId },
      data: { xp: { increment: amount } },
    });
  }

  /**
   * Updates student counters when a new membership is created (active)
   */
  static async incrementStudentCounters(gymId: string) {
    return db.gymProfile.updateMany({
      where: { gymId },
      data: {
        totalStudents: { increment: 1 },
        activeStudents: { increment: 1 },
      },
    });
  }

  /**
   * Incrementa só totalStudents (ex.: matrícula pendente de pagamento)
   */
  static async incrementTotalStudentsOnly(gymId: string) {
    return db.gymProfile.updateMany({
      where: { gymId },
      data: { totalStudents: { increment: 1 } },
    });
  }

  /**
   * Incrementa activeStudents (ex.: webhook ativou matrícula após PIX pago)
   */
  static async incrementActiveStudentsOnly(gymId: string) {
    return db.gymProfile.updateMany({
      where: { gymId },
      data: { activeStudents: { increment: 1 } },
    });
  }

  /**
   * Updates gym profile (address, phone, cnpj, openingHours, latitude, longitude)
   */
  static async updateGymProfile(
    gymId: string,
    data: {
      name?: string;
      address?: string;
      phone?: string;
      cnpj?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      pixKey?: string | null;
      pixKeyType?: string | null;
      openingHours?: {
        open?: string;
        close?: string;
        days?: string[];
        byDay?: Record<string, { open: string; close: string }>;
      } | null;
    },
  ) {
    const updateData: Record<string, string | number | boolean | null> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.cnpj !== undefined) updateData.cnpj = data.cnpj;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.pixKey !== undefined) updateData.pixKey = data.pixKey;
    if (data.pixKeyType !== undefined) updateData.pixKeyType = data.pixKeyType;
    if (data.openingHours !== undefined) {
      updateData.openingHours = data.openingHours
        ? JSON.stringify(data.openingHours)
        : null;
    }
    return db.gym.update({
      where: { id: gymId },
      data: updateData,
    });
  }

  /**
   * Lists gym members with optional status and search filters
   */
  static async getMembers(
    gymId: string,
    filters: { status?: string; search?: string },
  ) {
    const { status, search } = filters;
    // Listagem padrão: só alunos vinculados (active/pending). Cancelados/suspended não aparecem.
    const statusFilter =
      status && status !== "all"
        ? { status }
        : { status: { in: ["active", "pending"] } };
    return db.gymMembership.findMany({
      where: {
        gymId,
        ...statusFilter,
        ...(search
          ? {
              student: {
                user: { name: { contains: search, mode: "insensitive" } },
              },
            }
          : {}),
      },
      include: {
        student: {
          include: { user: true, profile: true, progress: true },
        },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
      ...(search ? { take: 10 } : {}),
    });
  }

  /**
   * Enrolls a student in a gym plan.
   * - Com planId: cria membership "pending" + pagamento pendente; o aluno paga a mensalidade
   *   em student?tab=payments e a membership ativa no webhook. Em nenhuma hipótese o aluno
   *   deixa de pagar a academia; enterprise só concede Premium do app quando ativo.
   * - Sem planId (cortesia manual): cria membership "active" direto, sem pagamento.
   */
  static async enrollStudent(
    gymId: string,
    data: {
      studentId: string;
      planId?: string | null;
      amount: number;
      autoRenew?: boolean;
    },
  ) {
    const { studentId, planId, amount, autoRenew = true } = data;

    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error("Aluno não encontrado");

    const existing = await db.gymMembership.findFirst({
      where: { gymId, studentId, status: { in: ["active", "pending"] } },
    });
    if (existing) throw new Error("Aluno já está matriculado");

    let nextBillingDate: Date | null = null;
    let resolvedAmount = amount;
    if (planId) {
      const plan = await db.membershipPlan.findUnique({
        where: { id: planId, gymId },
      });
      if (plan) {
        nextBillingDate = new Date();
        nextBillingDate.setDate(nextBillingDate.getDate() + plan.duration);
        if (resolvedAmount <= 0) resolvedAmount = plan.price;
      }
    }

    const withPlan = !!planId && resolvedAmount > 0;
    const membershipActive = !withPlan;

    const membership = await db.gymMembership.create({
      data: {
        gymId,
        studentId,
        planId: planId || null,
        amount: resolvedAmount,
        status: membershipActive ? "active" : "pending",
        autoRenew,
        nextBillingDate,
      },
      include: { student: { include: { user: true } }, plan: true },
    });

    if (withPlan && planId) {
      const { createPendingMembershipPayment } = await import(
        "./gym-membership-payment.service"
      );
      await createPendingMembershipPayment(
        gymId,
        studentId,
        planId,
        resolvedAmount,
        membership.id,
      );
      await BaseGymDomainService.incrementTotalStudentsOnly(gymId);
    } else {
      await BaseGymDomainService.incrementStudentCounters(gymId);
      const gymSub = await db.gymSubscription.findUnique({
        where: { gymId },
        select: { plan: true, status: true },
      });
      const isEnterprise =
        gymSub?.status === "active" &&
        gymSub?.plan?.toLowerCase().includes("enterprise");
      if (isEnterprise) {
        const { GymSubscriptionService } = await import(
          "./gym-subscription.service"
        );
        await GymSubscriptionService.syncStudentEnterpriseBenefit(studentId);
      }
    }

    return membership;
  }

  /**
   * Lists gym expenses with filters
   */
  static async getExpenses(
    gymId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      type?: string;
      limit?: number;
    },
  ) {
    const { startDate, endDate, type, limit } = filters;
    const whereClause: Prisma.ExpenseWhereInput = { gymId };

    if (type && type !== "all") {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate)
        (whereClause.date as { gte?: Date }).gte = new Date(startDate);
      if (endDate) (whereClause.date as { lte?: Date }).lte = new Date(endDate);
    }

    return db.expense.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: limit,
    });
  }

  /**
   * Creates a new expense for the gym
   */
  static async createExpense(
    gymId: string,
    data: {
      type: string;
      description?: string | null;
      amount: number;
      date?: string | null;
      category?: string | null;
    },
  ) {
    return db.expense.create({
      data: {
        gymId,
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        category: data.category ?? "",
      },
    });
  }

  /**
   * Lists gym payments with filters
   */
  static async getPayments(
    gymId: string,
    filters: {
      status?: string;
      studentId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    },
  ) {
    const { status, studentId, startDate, endDate, limit } = filters;
    const whereClause: Prisma.PaymentWhereInput = { gymId };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate)
        (whereClause.date as { gte?: Date }).gte = new Date(startDate);
      if (endDate) (whereClause.date as { lte?: Date }).lte = new Date(endDate);
    }

    return db.payment.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: limit,
      include: {
        plan: { select: { name: true } },
      },
    });
  }

  /**
   * Creates a new payment for the gym
   */
  static async createPayment(
    gymId: string,
    data: {
      studentId: string;
      studentName?: string;
      planId?: string | null;
      amount: number;
      dueDate: string;
      paymentMethod?: string;
      reference?: string | null;
    },
  ) {
    return db.payment.create({
      data: {
        gymId,
        studentId: data.studentId,
        studentName: data.studentName ?? "Aluno",
        planId: data.planId ?? null,
        amount: data.amount,
        date: new Date(),
        dueDate: new Date(data.dueDate),
        status: "pending",
        paymentMethod: data.paymentMethod ?? "pix",
        reference: data.reference ?? null,
      },
    });
  }

  /**
   * Lists gym membership plans
   */
  static async getPlans(gymId: string, filters: { includeInactive?: boolean }) {
    const plans = await db.membershipPlan.findMany({
      where: {
        gymId,
        ...(filters.includeInactive ? {} : { isActive: true }),
      },
      orderBy: { price: "asc" },
    });

    return plans.map((p) => ({
      ...p,
      benefits: p.benefits
        ? (() => {
            try {
              return JSON.parse(p.benefits!);
            } catch {
              return [];
            }
          })()
        : [],
    }));
  }

  /**
   * Creates a new membership plan
   */
  static async createPlan(
    gymId: string,
    data: {
      name: string;
      type: string;
      price: number;
      duration: number;
      benefits: string[];
    },
  ) {
    const plan = await db.membershipPlan.create({
      data: {
        gymId,
        name: data.name,
        type: data.type,
        price: data.price,
        duration: data.duration,
        benefits: data.benefits ? JSON.stringify(data.benefits) : null,
      },
    });

    return {
      ...plan,
      benefits: data.benefits,
    };
  }

  static async updateMember(
    gymId: string,
    membershipId: string,
    data: {
      status?: "active" | "suspended" | "canceled";
      planId?: string | null;
      amount?: number;
    },
  ) {
    const current = await db.gymMembership.findFirst({
      where: { id: membershipId, gymId },
      select: { status: true },
    });

    if (!current) {
      throw new Error("Matrícula não encontrada");
    }

    const membership = await db.gymMembership.update({
      where: { id: membershipId, gymId },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.planId !== undefined ? { planId: data.planId } : {}),
        ...(data.amount !== undefined ? { amount: Number(data.amount) } : {}),
      },
      include: { student: { include: { user: true } }, plan: true },
    });

    if (data.status && data.status !== current.status) {
      const wasActive = current.status === "active";
      const isNowActive = data.status === "active";
      if (wasActive && !isNowActive) {
        await db.gymProfile.updateMany({
          where: { gymId },
          data: { activeStudents: { decrement: 1 } },
        });
        const { GymSubscriptionService } = await import(
          "./gym-subscription.service"
        );
        await GymSubscriptionService.syncStudentEnterpriseBenefit(
          membership.studentId,
        );
      } else if (!wasActive && isNowActive) {
        await db.gymProfile.updateMany({
          where: { gymId },
          data: { activeStudents: { increment: 1 } },
        });
      }
    }

    return membership;
  }

  static async cancelMember(gymId: string, membershipId: string) {
    const current = await db.gymMembership.findFirst({
      where: { id: membershipId, gymId },
      select: { status: true, studentId: true },
    });

    if (!current) {
      throw new Error("Matrícula não encontrada");
    }

    await db.gymMembership.update({
      where: { id: membershipId },
      data: { status: "canceled" },
    });

    if (current.status === "active") {
      await db.gymProfile.updateMany({
        where: { gymId },
        data: {
          activeStudents: { decrement: 1 },
          totalStudents: { decrement: 1 },
        },
      });
      const { GymSubscriptionService } = await import(
        "./gym-subscription.service"
      );
      await GymSubscriptionService.syncStudentEnterpriseBenefit(
        current.studentId,
      );
    }
  }

  static async updatePaymentStatus(
    gymId: string,
    paymentId: string,
    status: "paid" | "pending" | "overdue" | "canceled",
  ) {
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.gymId !== gymId) {
      throw new Error("Pagamento não encontrado");
    }

    return db.payment.update({
      where: { id: paymentId },
      data: { status },
    });
  }

  static async updateEquipment(
    gymId: string,
    equipId: string,
    data: {
      name?: string;
      status?: "available" | "in-use" | "maintenance" | "broken";
      brand?: string | null;
      model?: string | null;
      serialNumber?: string | null;
      nextMaintenance?: string;
    },
  ) {
    const existing = await db.equipment.findUnique({ where: { id: equipId } });
    if (!existing || existing.gymId !== gymId) {
      throw new Error("Equipamento não encontrado");
    }

    return db.equipment.update({
      where: { id: equipId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.brand !== undefined ? { brand: data.brand } : {}),
        ...(data.model !== undefined ? { model: data.model } : {}),
        ...(data.serialNumber !== undefined
          ? { serialNumber: data.serialNumber }
          : {}),
        ...(data.nextMaintenance
          ? { nextMaintenance: new Date(data.nextMaintenance) }
          : {}),
      },
    });
  }

  static async deleteEquipment(gymId: string, equipId: string) {
    const existing = await db.equipment.findUnique({ where: { id: equipId } });
    if (!existing || existing.gymId !== gymId) {
      throw new Error("Equipamento não encontrado");
    }

    await db.equipment.delete({ where: { id: equipId } });
    await db.gymProfile.update({
      where: { gymId },
      data: { equipmentCount: { decrement: 1 } },
    });
  }

  static async createEquipmentMaintenance(
    gymId: string,
    equipId: string,
    data: {
      type: "preventive" | "corrective" | "inspection";
      description: string;
      performedBy: string;
      cost?: number | null;
      nextScheduled?: string | null;
    },
  ) {
    const equipment = await db.equipment.findFirst({
      where: { id: equipId, gymId },
    });
    if (!equipment) {
      throw new Error("Equipamento não encontrado");
    }

    const record = await db.maintenanceRecord.create({
      data: {
        equipmentId: equipId,
        date: new Date(),
        type: data.type,
        description: data.description,
        performedBy: data.performedBy,
        cost: data.cost ? Number(data.cost) : null,
        nextScheduled: data.nextScheduled ? new Date(data.nextScheduled) : null,
      },
    });

    await db.equipment.update({
      where: { id: equipId },
      data: {
        lastMaintenance: new Date(),
        ...(data.nextScheduled
          ? { nextMaintenance: new Date(data.nextScheduled) }
          : {}),
        status: "available",
      },
    });

    return record;
  }

  static async updatePlan(
    gymId: string,
    planId: string,
    data: {
      name?: string;
      type?: string;
      price?: number;
      duration?: number;
      benefits?: string[];
      isActive?: boolean;
    },
  ) {
    const plan = await db.membershipPlan.findFirst({
      where: { id: planId, gymId },
    });
    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    return db.membershipPlan.update({
      where: { id: planId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.price !== undefined ? { price: Number(data.price) } : {}),
        ...(data.duration !== undefined
          ? { duration: Number(data.duration) }
          : {}),
        ...(data.benefits !== undefined
          ? { benefits: JSON.stringify(data.benefits) }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  static async deactivatePlan(gymId: string, planId: string) {
    const plan = await db.membershipPlan.findFirst({
      where: { id: planId, gymId },
    });
    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    await db.membershipPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });
  }

  static async searchStudentByEmail(gymId: string, email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedIdentifier = normalizedEmail.startsWith("@")
      ? normalizedEmail.slice(1)
      : normalizedEmail;
    const isFullEmail = normalizedIdentifier.includes("@");

    const emailWhere = isFullEmail
      ? { contains: normalizedIdentifier, mode: "insensitive" as const }
      : {
          startsWith: `${normalizedIdentifier}@`,
          mode: "insensitive" as const,
        };

    const user = await db.user.findFirst({
      where: {
        email: emailWhere,
        role: { in: ["STUDENT", "ADMIN"] },
      },
      include: {
        student: {
          include: {
            profile: true,
            progress: true,
            memberships: {
              where: {
                gymId,
                status: { in: ["active", "pending"] },
              },
            },
          },
        },
      },
    });

    if (!user?.student) {
      return { found: false };
    }

    const existingMembership = user.student.memberships[0];
    return {
      found: true,
      isAlreadyMember: !!existingMembership,
      existingStatus: existingMembership?.status ?? null,
      student: {
        id: user.student.id,
        name: user.name,
        email: user.email,
        avatar: user.student.avatar,
        age: user.student.age,
        gender: user.student.gender,
        phone: user.student.phone,
        fitnessLevel: user.student.profile?.fitnessLevel,
        goals: user.student.profile?.goals
          ? (() => {
              const rawGoals = user.student.profile?.goals;
              if (!rawGoals) return [];
              try {
                return JSON.parse(rawGoals);
              } catch {
                return [];
              }
            })()
          : [],
        currentLevel: user.student.progress?.currentLevel ?? 1,
        currentStreak: user.student.progress?.currentStreak ?? 0,
      },
    };
  }
}
