import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

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
    console.log(
      `[ReferralService] Tentando converter: ${referredType} | ID: ${referredId} | Payment: ${paymentId}`,
    );

    const referral = await db.referral.findFirst({
      where: {
        referredType,
        referredId,
        status: "PENDING",
      },
    });

    if (!referral) {
      console.warn(
        `[ReferralService] Registro PENDING NÃO ENCONTRADO para ${referredType} ID ${referredId}`,
      );
      return null;
    }

    console.log(
      `[ReferralService] ✅ Registro PENDING encontrado! ID: ${referral.id}. Calculando comissão...`,
    );

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
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { pixKey: true, pixKeyType: true },
    });
    if (!student?.pixKey || !student.pixKeyType) {
      return { ok: false, error: "Cadastre sua chave PIX para sacar." };
    }
    const amountReais = data.amountCents / 100;
    if (data.amountCents < 350) {
      return { ok: false, error: "Valor mínimo para saque é R$ 3,50." };
    }

    const { balanceCents } =
      await ReferralService.getBalanceAndWithdraws(studentId);
    if (data.amountCents > balanceCents) {
      return { ok: false, error: "Saldo insuficiente." };
    }

    const externalId = `student-withdraw-${studentId}-${Date.now()}`;
    const pixType = student.pixKeyType.toUpperCase() as
      | "CPF"
      | "CNPJ"
      | "PHONE"
      | "EMAIL"
      | "RANDOM"
      | "BR_CODE";

    // Test mode: apenas persists DB e conclui
    if (data.fake) {
      const w = await db.studentWithdraw.create({
        data: {
          studentId,
          amount: amountReais,
          pixKey: student.pixKey,
          pixKeyType: student.pixKeyType,
          externalId,
          status: "complete",
          completedAt: new Date(),
        },
      });

      return {
        ok: true,
        withdraw: {
          id: w.id,
          amount: w.amount,
          status: w.status,
          createdAt: w.createdAt,
        },
      };
    }

    const { abacatePay } = await import("@/lib/api/abacatepay");
    const res = await abacatePay.createWithdraw({
      externalId,
      amount: data.amountCents,
      pix: { type: pixType, key: student.pixKey },
      description: `Saque comissão referências - Aluno ${studentId}`,
    });

    if (res.error || !res.data) {
      return { ok: false, error: res.error ?? "Falha ao criar saque." };
    }

    const w = await db.studentWithdraw.create({
      data: {
        studentId,
        amount: amountReais,
        pixKey: student.pixKey,
        pixKeyType: student.pixKeyType,
        externalId,
        abacateId: res.data.id,
        status: res.data.status === "COMPLETE" ? "complete" : "pending",
        completedAt: res.data.status === "COMPLETE" ? new Date() : null,
      },
    });

    return {
      ok: true,
      withdraw: {
        id: w.id,
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt,
      },
    };
  }
}
