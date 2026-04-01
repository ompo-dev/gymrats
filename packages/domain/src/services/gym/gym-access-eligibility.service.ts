import { db } from "@gymrats/db";
import {
  computeNextBillingDate,
  createUnknownEligibilityDecision,
  deriveOperationalPaymentStatus,
  evaluatePersonalAccessEligibility,
  evaluateStudentAccessEligibility,
} from "../../access-authorization";

type PaymentStatus = "paid" | "pending" | "overdue" | "canceled" | "withdrawn";

function parseMembershipIdFromReference(reference?: string | null) {
  if (!reference?.startsWith("membership:")) {
    return null;
  }

  const segments = reference.split(":");
  return segments[1] || null;
}

function getPaymentMembershipId(payment: {
  membershipId?: string | null;
  reference?: string | null;
}) {
  return payment.membershipId ?? parseMembershipIdFromReference(payment.reference);
}

function toOperationalFields(input: {
  authorizationStatus?: string | null;
  financialStatus?: string | null;
}) {
  return {
    operationalStatus: deriveOperationalPaymentStatus({
      authorizationStatus:
        (input.authorizationStatus as
          | "eligible"
          | "grace"
          | "blocked"
          | "inactive"
          | "unknown"
          | null
          | undefined) ?? null,
      financialStatus:
        (input.financialStatus as
          | "paid"
          | "pending"
          | "overdue"
          | "not_applicable"
          | null
          | undefined) ?? null,
    }),
  };
}

export class GymAccessEligibilityService {
  static async getEligibilitySnapshot(
    gymId: string,
    subjectType: "STUDENT" | "PERSONAL",
    subjectId: string,
  ) {
    const snapshot = await db.accessEligibilitySnapshot.findUnique({
      where: {
        gymId_subjectType_subjectId: {
          gymId,
          subjectType,
          subjectId,
        },
      },
    });

    if (snapshot) {
      return snapshot;
    }

    if (subjectType === "STUDENT") {
      return this.refreshStudentEligibility(gymId, subjectId);
    }

    return this.refreshPersonalEligibility(gymId, subjectId);
  }

  static async refreshStudentEligibility(gymId: string, studentId: string) {
    const memberships = await db.gymMembership.findMany({
      where: { gymId, studentId },
      include: {
        plan: true,
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
    });

    const membership =
      memberships.find((entry) =>
        ["active", "pending", "suspended", "canceled"].includes(entry.status),
      ) ?? memberships[0] ?? null;

    const student =
      membership?.student ??
      (await db.student.findUnique({
        where: { id: studentId },
        include: { user: true },
      }));

    const openPayment = membership
      ? await db.payment.findFirst({
          where: {
            gymId,
            studentId,
            OR: [
              { membershipId: membership.id },
              { reference: { startsWith: `membership:${membership.id}` } },
            ],
            status: { in: ["pending", "overdue"] },
          },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        })
      : null;

    const decision = membership
      ? evaluateStudentAccessEligibility({
          membershipStatus: membership.status,
          paymentStatus: openPayment?.status,
          dueDate: openPayment?.dueDate ?? membership.nextBillingDate,
          graceDays: membership.plan?.graceDays ?? 0,
        })
      : createUnknownEligibilityDecision();

    return db.accessEligibilitySnapshot.upsert({
      where: {
        gymId_subjectType_subjectId: {
          gymId,
          subjectType: "STUDENT",
          subjectId: studentId,
        },
      },
      create: {
        gymId,
        subjectType: "STUDENT",
        subjectId: studentId,
        studentId,
        membershipId: membership?.id ?? null,
        authorizationStatus: membership
          ? decision.authorizationStatus
          : "inactive",
        financialStatus: membership
          ? decision.financialStatus
          : "not_applicable",
        reasonCode: membership ? decision.reasonCode : "membership_not_found",
        graceUntil: decision.graceUntil,
        openPaymentId: openPayment?.id ?? null,
        lastEvaluatedAt: new Date(),
      },
      update: {
        studentId,
        membershipId: membership?.id ?? null,
        authorizationStatus: membership
          ? decision.authorizationStatus
          : "inactive",
        financialStatus: membership
          ? decision.financialStatus
          : "not_applicable",
        reasonCode: membership ? decision.reasonCode : "membership_not_found",
        graceUntil: decision.graceUntil,
        openPaymentId: openPayment?.id ?? null,
        lastEvaluatedAt: new Date(),
      },
      select: {
        id: true,
        gymId: true,
        subjectType: true,
        subjectId: true,
        studentId: true,
        personalId: true,
        membershipId: true,
        personalAffiliationId: true,
        authorizationStatus: true,
        financialStatus: true,
        reasonCode: true,
        graceUntil: true,
        openPaymentId: true,
        lastEvaluatedAt: true,
        createdAt: true,
        updatedAt: true,
        ...(student
          ? {}
          : {}),
      },
    });
  }

  static async refreshPersonalEligibility(gymId: string, personalId: string) {
    const affiliation = await db.gymPersonalAffiliation.findFirst({
      where: { gymId, personalId },
      orderBy: { updatedAt: "desc" },
    });

    const decision = evaluatePersonalAccessEligibility({
      affiliationStatus: affiliation?.status,
    });

    return db.accessEligibilitySnapshot.upsert({
      where: {
        gymId_subjectType_subjectId: {
          gymId,
          subjectType: "PERSONAL",
          subjectId: personalId,
        },
      },
      create: {
        gymId,
        subjectType: "PERSONAL",
        subjectId: personalId,
        personalId,
        personalAffiliationId: affiliation?.id ?? null,
        authorizationStatus: decision.authorizationStatus,
        financialStatus: decision.financialStatus,
        reasonCode: decision.reasonCode,
        graceUntil: decision.graceUntil,
        openPaymentId: null,
        lastEvaluatedAt: new Date(),
      },
      update: {
        personalId,
        personalAffiliationId: affiliation?.id ?? null,
        authorizationStatus: decision.authorizationStatus,
        financialStatus: decision.financialStatus,
        reasonCode: decision.reasonCode,
        graceUntil: decision.graceUntil,
        openPaymentId: null,
        lastEvaluatedAt: new Date(),
      },
    });
  }

  static async refreshEligibilityForGym(gymId: string) {
    const [memberships, affiliations] = await Promise.all([
      db.gymMembership.findMany({
        where: { gymId },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
      db.gymPersonalAffiliation.findMany({
        where: { gymId },
        select: { personalId: true },
        distinct: ["personalId"],
      }),
    ]);

    await Promise.all([
      ...memberships.map((entry) =>
        this.refreshStudentEligibility(gymId, entry.studentId),
      ),
      ...affiliations.map((entry) =>
        this.refreshPersonalEligibility(gymId, entry.personalId),
      ),
    ]);

    return {
      students: memberships.length,
      personals: affiliations.length,
    };
  }

  static async enrichPaymentsWithEligibility<
    T extends {
      studentId: string;
      membershipId?: string | null;
      reference?: string | null;
    },
  >(gymId: string, payments: T[]) {
    if (payments.length === 0) {
      return [];
    }

    const studentIds = [...new Set(payments.map((payment) => payment.studentId))];
    const snapshots = await db.accessEligibilitySnapshot.findMany({
      where: {
        gymId,
        subjectType: "STUDENT",
        studentId: { in: studentIds },
      },
    });
    const snapshotByStudentId = new Map(
      snapshots
        .filter((snapshot) => snapshot.studentId)
        .map((snapshot) => [snapshot.studentId!, snapshot]),
    );

    return payments.map((payment) => {
      const snapshot = snapshotByStudentId.get(payment.studentId);
      return {
        ...payment,
        authorizationStatus: snapshot?.authorizationStatus ?? "unknown",
        financialStatus: snapshot?.financialStatus ?? "not_applicable",
        reasonCode: snapshot?.reasonCode ?? "not_evaluated",
        graceUntil: snapshot?.graceUntil ?? null,
        ...toOperationalFields({
          authorizationStatus: snapshot?.authorizationStatus,
          financialStatus: snapshot?.financialStatus,
        }),
        membershipId:
          payment.membershipId ?? getPaymentMembershipId(payment) ?? null,
      };
    });
  }

  static async updatePaymentStatus(
    gymId: string,
    paymentId: string,
    status: Exclude<PaymentStatus, "withdrawn">,
  ) {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.gymId !== gymId) {
      throw new Error("Pagamento não encontrado");
    }

    const updated = await db.payment.update({
      where: { id: paymentId },
      data: {
        status,
        ...(status === "paid" ? { date: new Date() } : {}),
      },
    });

    await this.refreshStudentEligibility(gymId, payment.studentId);
    return updated;
  }

  static async settlePayment(gymId: string, paymentId: string) {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        plan: true,
      },
    });

    if (!payment || payment.gymId !== gymId) {
      throw new Error("Pagamento não encontrado");
    }

    const membershipId = getPaymentMembershipId(payment);
    const membership = membershipId
      ? await db.gymMembership.findFirst({
          where: { id: membershipId, gymId },
          include: { plan: true },
        })
      : null;

    const now = new Date();
    const previousMembershipStatus = membership?.status ?? null;
    const plan = payment.plan ?? membership?.plan ?? null;

    const updatedPayment = await db.$transaction(async (tx) => {
      const settledPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          date: now,
          kind: payment.kind ?? "manual_regularization",
        },
      });

      if (membership && plan) {
        await tx.gymMembership.update({
          where: { id: membership.id },
          data: {
            status: "active",
            ...(membership.status === "pending" ? { startDate: now } : {}),
            ...(payment.kind === "membership_change_plan" && payment.planId
              ? { planId: payment.planId, amount: payment.amount }
              : {}),
            nextBillingDate: computeNextBillingDate({
              now,
              previousNextBillingDate:
                membership.nextBillingDate ?? payment.dueDate ?? now,
              durationDays: plan.duration,
            }),
          },
        });
      }

      return settledPayment;
    });

    if (membership && previousMembershipStatus !== "active") {
      await db.gymProfile.updateMany({
        where: { gymId },
        data: { activeStudents: { increment: 1 } },
      });
    }

    await this.refreshStudentEligibility(gymId, payment.studentId);

    const snapshot = await db.accessEligibilitySnapshot.findUnique({
      where: {
        gymId_subjectType_subjectId: {
          gymId,
          subjectType: "STUDENT",
          subjectId: payment.studentId,
        },
      },
    });

    return {
      ...updatedPayment,
      authorizationStatus: snapshot?.authorizationStatus ?? "unknown",
      financialStatus: snapshot?.financialStatus ?? "not_applicable",
      reasonCode: snapshot?.reasonCode ?? "not_evaluated",
      graceUntil: snapshot?.graceUntil ?? null,
      ...toOperationalFields({
        authorizationStatus: snapshot?.authorizationStatus,
        financialStatus: snapshot?.financialStatus,
      }),
      membershipId,
    };
  }

  static async runRecurringBilling(now = new Date()) {
    const memberships = await db.gymMembership.findMany({
      where: {
        status: "active",
        autoRenew: true,
        planId: { not: null },
        nextBillingDate: { not: null },
      },
      include: {
        plan: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    let created = 0;
    let overdue = 0;
    let refreshed = 0;

    for (const membership of memberships) {
      if (!membership.plan || !membership.nextBillingDate) {
        continue;
      }

      const periodStart = new Date(membership.nextBillingDate);
      const periodEnd = computeNextBillingDate({
        now: periodStart,
        previousNextBillingDate: periodStart,
        durationDays: membership.plan.duration,
      });

      let cyclePayment = await db.payment.findFirst({
        where: {
          gymId: membership.gymId,
          studentId: membership.studentId,
          membershipId: membership.id,
          kind: "membership_renewal",
          periodStart,
        },
      });

      if (!cyclePayment && periodStart.getTime() <= now.getTime()) {
        cyclePayment = await db.payment.create({
          data: {
            gymId: membership.gymId,
            studentId: membership.studentId,
            studentName: membership.student.user?.name ?? "Aluno",
            planId: membership.planId,
            membershipId: membership.id,
            amount: membership.amount || membership.plan.price,
            date: now,
            dueDate: periodStart,
            status: "pending",
            paymentMethod: "pix",
            reference: `membership:${membership.id}:renewal:${periodStart.toISOString()}`,
            kind: "membership_renewal",
            periodStart,
            periodEnd,
          },
        });
        created += 1;
      }

      if (!cyclePayment) {
        continue;
      }

      const decision = evaluateStudentAccessEligibility({
        membershipStatus: membership.status,
        paymentStatus: cyclePayment.status,
        dueDate: cyclePayment.dueDate,
        graceDays: membership.plan.graceDays,
        now,
      });

      if (
        cyclePayment.status === "pending" &&
        decision.financialStatus === "overdue"
      ) {
        await db.payment.update({
          where: { id: cyclePayment.id },
          data: { status: "overdue" },
        });
        overdue += 1;
      }

      await this.refreshStudentEligibility(membership.gymId, membership.studentId);
      refreshed += 1;
    }

    return {
      createdPayments: created,
      updatedOverduePayments: overdue,
      refreshedSnapshots: refreshed,
    };
  }
}
