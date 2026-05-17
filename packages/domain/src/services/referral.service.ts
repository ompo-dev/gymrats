import { db } from "@gymrats/db";
import type { Prisma } from "@prisma/client";
import { log } from "../log";

type Referral = Prisma.ReferralGetPayload<Record<string, never>>;

export class ReferralService {
  /**
   * Retrieves or generates a unique referral code based on student's email
   * Example: user@gmail.com -> @user
   */
  static async getOrGenerateCode(studentId: string): Promise<string> {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) throw new Error("Student not found");

    if (student.referralCode) {
      return student.referralCode;
    }

    // Default generation rules based on user email prefix
    const emailPrefix = student.user.email.split("@")[0] || "user";
    const baseCode = `@${emailPrefix}`;
    let code = baseCode;
    let attempt = 1;

    // Collision fallback
    while (true) {
      const existing = await db.student.findUnique({
        where: { referralCode: code },
      });
      if (!existing) break;
      code = `${baseCode}${attempt}`;
      attempt++;
    }

    // Save and return
    await db.student.update({
      where: { id: studentId },
      data: { referralCode: code },
    });

    return code;
  }

  /**
   * Connects a new entity (Student, Gym, Personal) to the referrer
   */
  static async resolveReferral(
    referralCode: string,
    referredType: "STUDENT" | "GYM" | "PERSONAL",
    referredId: string,
  ): Promise<Referral | null> {
    if (!referralCode) return null;

    // Normalize format
    const normalizedCode = referralCode.startsWith("@")
      ? referralCode
      : `@${referralCode}`;

    const referrer = await db.student.findUnique({
      where: { referralCode: normalizedCode },
    });

    if (!referrer) {
      return null; // Referral invalido
    }

    // Prevent self-referral anomalies
    if (referredType === "STUDENT" && referrer.id === referredId) {
      return null;
    }

    // Prevent multiple referral objects for the same indicated person/entity
    const existingReferral = await db.referral.findFirst({
      where: {
        referredType,
        referredId,
      },
    });

    if (existingReferral) {
      return null;
    }

    return await db.referral.create({
      data: {
        referrerStudentId: referrer.id,
        referralCode: normalizedCode,
        referredType,
        referredId,
        status: "PENDING",
      },
    });
  }

  /**
   * Called automatically processing Webhook events to apply 50% commission
   * on the first recurring payment.
   */
  static async onFirstPaymentConfirmed(
    referredType: "STUDENT" | "GYM" | "PERSONAL",
    referredId: string,
    amountCents: number,
    paymentId: string,
  ): Promise<Referral | null> {
    log.info("Attempting to convert referral after first payment", {
      referredType,
      referredId,
      paymentId,
    });

    const referral = await db.referral.findFirst({
      where: {
        referredType,
        referredId,
        status: "PENDING",
      },
    });

    if (!referral) {
      log.warn("Pending referral not found for first payment conversion", {
        referredType,
        referredId,
        paymentId,
      });
      return null;
    }

    log.info("Pending referral found for first payment conversion", {
      referralId: referral.id,
      referredType,
      referredId,
      paymentId,
    });

    // 50% commission mapped in cents
    const commissionCents = Math.floor(amountCents * 0.5);

    const updatedReferral = await db.referral.update({
      where: { id: referral.id },
      data: {
        status: "CONVERTED",
        firstPaymentAmountCents: amountCents,
        commissionAmountCents: commissionCents,
        abacatePayPaymentId: paymentId,
      },
    });

    // Comissão fica como saldo disponível para saque manual (não auto-withdraw)
    return updatedReferral;
  }

  /**
   * Allows student to update their PIX key.
   */
  static async updatePixKey(
    studentId: string,
    pixKey: string,
    pixKeyType: string,
  ) {
    return await db.student.update({
      where: { id: studentId },
      data: { pixKey, pixKeyType },
    });
  }

  /**
   * Returns student's referral balance and withdraws
   */
  static async getBalanceAndWithdraws(studentId: string) {
    const [referralsAggr, withdrawsList] = await Promise.all([
      db.referral.aggregate({
        where: { referrerStudentId: studentId, status: "CONVERTED" },
        _sum: { commissionAmountCents: true },
      }),
      db.studentWithdraw.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // O status do Withdraw que subtrai é 'complete' ou 'pending' (como na Gym)?
    // Usaremos complete ou pending como redutores, falhas retornam ao saldo.
    const activeWithdraws = withdrawsList.filter((w) => w.status !== "failed");

    // taxa AbacatePay é cobrada do withdraw? Pro aluno talvez assumiremos R$0.80 tbm
    const ABACATEPAY_FEE_CENTS = 80;

    const totalEarnedCents = referralsAggr._sum.commissionAmountCents || 0;

    // Withdraws subtraem o saldo (inclui taxa)
    const withdrawalsSum = activeWithdraws.reduce(
      (acc, w) => acc + Math.floor(w.amount * 100) + ABACATEPAY_FEE_CENTS,
      0,
    );

    const balanceCents = Math.max(0, totalEarnedCents - withdrawalsSum);
    const balanceReais = balanceCents / 100;

    return {
      balanceReais,
      balanceCents,
      totalEarnedCents,
      withdraws: withdrawsList.map((w) => ({
        id: w.id,
        amount: w.amount,
        pixKey: w.pixKey,
        pixKeyType: w.pixKeyType,
        status: w.status,
        createdAt: w.createdAt,
        completedAt: w.completedAt,
      })),
    };
  }

  /**
   * Creates a withdrawal for the student
   * Se fake=true (ex.: test mode), apenas persiste no DB com status complete
   */
  static async createWithdraw(
    studentId: string,
    data: { amountCents: number; fake?: boolean },
  ) {
    if (data.amountCents < 350) {
      return { ok: false, error: "Valor minimo para saque e R$ 3,50." };
    }

    const amountReais = data.amountCents / 100;
    const reservation = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM students WHERE id = ${studentId} FOR UPDATE`;

      const student = await tx.student.findUnique({
        where: { id: studentId },
        select: { pixKey: true, pixKeyType: true },
      });
      if (!student?.pixKey || !student.pixKeyType) {
        return { ok: false as const, error: "Cadastre sua chave PIX para sacar." };
      }
      const studentPixKey = student.pixKey;
      const studentPixKeyType = student.pixKeyType;

      const [referralsAgg, withdraws] = await Promise.all([
        tx.referral.aggregate({
          where: { referrerStudentId: studentId, status: "CONVERTED" },
          _sum: { commissionAmountCents: true },
        }),
        tx.studentWithdraw.findMany({
          where: { studentId },
        }),
      ]);

      const ABACATEPAY_FEE_CENTS = 80;
      const grossCents = referralsAgg._sum.commissionAmountCents ?? 0;
      const activeWithdraws = withdraws.filter(
        (withdraw) => withdraw.status !== "failed",
      );
      const withdrawnCents = activeWithdraws.reduce(
        (sum, withdraw) =>
          sum + Math.floor(withdraw.amount * 100) + ABACATEPAY_FEE_CENTS,
        0,
      );
      const balanceCents = Math.max(0, grossCents - withdrawnCents);

      if (data.amountCents > balanceCents) {
        return { ok: false as const, error: "Saldo insuficiente." };
      }

      const externalId = `student-withdraw-${studentId}-${Date.now()}`;
      const withdraw = await tx.studentWithdraw.create({
        data: {
          studentId,
          amount: amountReais,
          pixKey: studentPixKey,
          pixKeyType: studentPixKeyType,
          externalId,
          status: data.fake ? "complete" : "pending",
          completedAt: data.fake ? new Date() : null,
        },
      });

      return {
        ok: true as const,
        studentPixKey,
        studentPixKeyType,
        withdraw,
      };
    });

    if (!reservation.ok) {
      return reservation;
    }

    if (data.fake) {
      return {
        ok: true,
        withdraw: {
          id: reservation.withdraw.id,
          amount: reservation.withdraw.amount,
          status: reservation.withdraw.status,
          createdAt: reservation.withdraw.createdAt,
        },
      };
    }

    const pixType = reservation.studentPixKeyType.toUpperCase() as
      | "CPF"
      | "CNPJ"
      | "PHONE"
      | "EMAIL"
      | "RANDOM"
      | "BR_CODE";

    const { abacatePay } = await import("@gymrats/api/abacatepay");
    const res = await abacatePay.createWithdraw({
      externalId: reservation.withdraw.externalId,
      amount: data.amountCents,
      pix: { type: pixType, key: reservation.studentPixKey },
      description: `Saque comissao referencias - Aluno ${studentId}`,
    });

    if (res.error || !res.data) {
      await db.studentWithdraw.update({
        where: { id: reservation.withdraw.id },
        data: { status: "failed", completedAt: null },
      });
      return { ok: false, error: res.error ?? "Falha ao criar saque." };
    }

    const finalized = await db.studentWithdraw.update({
      where: { id: reservation.withdraw.id },
      data: {
        abacateId: res.data.id,
        status: res.data.status === "COMPLETE" ? "complete" : "pending",
        completedAt: res.data.status === "COMPLETE" ? new Date() : null,
      },
    });

    return {
      ok: true,
      withdraw: {
        id: finalized.id,
        amount: finalized.amount,
        status: finalized.status,
        createdAt: finalized.createdAt,
      },
    };
  }
}
