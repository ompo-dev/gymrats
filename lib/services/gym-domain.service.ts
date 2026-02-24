import { db } from "@/lib/db";

/**
 * Service to centralize gym domain operations and stat updates
 */
export class GymDomainService {
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
   * Updates student counters when a new membership is created
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
   * Lists gym members with optional status and search filters
   */
  static async getMembers(gymId: string, filters: { status?: string; search?: string }) {
    const { status, search } = filters;
    return db.gymMembership.findMany({
      where: {
        gymId,
        ...(status && status !== "all" ? { status } : {}),
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
   * Enrolls a student in a gym plan
   */
  static async enrollStudent(gymId: string, data: {
    studentId: string;
    planId?: string | null;
    amount: number;
    autoRenew?: boolean;
  }) {
    const { studentId, planId, amount, autoRenew = true } = data;

    // 1. Check if student exists
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error("Aluno não encontrado");

    // 2. Check for existing active membership
    const existing = await db.gymMembership.findFirst({
      where: {
        gymId,
        studentId,
        status: { in: ["active", "pending"] },
      },
    });
    if (existing) throw new Error("Aluno já está matriculado");

    // 3. Calculate next billing date
    let nextBillingDate: Date | null = null;
    if (planId) {
      const plan = await db.membershipPlan.findUnique({ where: { id: planId } });
      if (plan) {
        nextBillingDate = new Date();
        nextBillingDate.setDate(nextBillingDate.getDate() + plan.duration);
      }
    }

    // 4. Create membership
    const membership = await db.gymMembership.create({
      data: {
        gymId,
        studentId,
        planId: planId || null,
        amount,
        status: "active",
        autoRenew,
        nextBillingDate,
      },
      include: { student: { include: { user: true } }, plan: true },
    });

    // 5. Update gym stats
    await this.incrementStudentCounters(gymId);

    return membership;
  }

  /**
   * Lists gym expenses with filters
   */
  static async getExpenses(gymId: string, filters: {
    startDate?: string;
    endDate?: string;
    type?: string;
    limit?: number;
  }) {
    const { startDate, endDate, type, limit } = filters;
    const whereClause: any = { gymId };

    if (type && type !== "all") {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
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
  static async createExpense(gymId: string, data: {
    type: any;
    description?: string | null;
    amount: number;
    date?: string | null;
    category?: string | null;
  }) {
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
  static async getPayments(gymId: string, filters: {
    status?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const { status, studentId, startDate, endDate, limit } = filters;
    const whereClause: any = { gymId };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
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
  static async createPayment(gymId: string, data: {
    studentId: string;
    studentName?: string;
    planId?: string | null;
    amount: number;
    dueDate: string;
    paymentMethod?: string;
    reference?: string | null;
  }) {
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
  static async createPlan(gymId: string, data: {
    name: string;
    type: string;
    price: number;
    duration: number;
    benefits: string[];
  }) {
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
}
