import { abacatePay } from "@gymrats/api/abacatepay";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { PIX_EXPIRES_IN_SECONDS } from "@/lib/utils/subscription";

export interface MembershipPaymentPixResult {
  brCode: string;
  brCodeBase64: string;
  amount: number; // centavos
  paymentId: string;
  expiresAt: string; // ISO date-time
}

/**
 * Cria apenas o registro de pagamento pendente (sem PIX).
 * Usado quando a academia adiciona um aluno com plano: o aluno vê o pagamento em
 * student?tab=payments&subTab=payments e gera o PIX por "Pagar agora".
 */
export async function createPendingMembershipPayment(
  gymId: string,
  studentId: string,
  planId: string,
  amount: number,
  membershipId: string,
): Promise<{ paymentId: string }> {
  const [gym, student, plan] = await Promise.all([
    db.gym.findUnique({ where: { id: gymId } }),
    db.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    }),
    db.membershipPlan.findUnique({ where: { id: planId, gymId } }),
  ]);
  if (!gym) throw new Error("Academia não encontrada");
  if (!student) throw new Error("Aluno não encontrado");
  if (!plan) throw new Error("Plano não encontrado");
  if (!plan.isActive) throw new Error("Plano não está ativo");
  if (amount <= 0) throw new Error("Valor deve ser maior que zero");

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + plan.duration);

  const payment = await db.payment.create({
    data: {
      gymId,
      studentId,
      studentName: student.user?.name ?? "Aluno",
      planId,
      amount,
      dueDate,
      status: "pending",
      paymentMethod: "pix",
      reference: `membership:${membershipId}`,
    },
  });
  return { paymentId: payment.id };
}

/**
 * Cria PIX para pagamento de plano de matrícula (membership).
 * Usado quando o aluno contrata uma academia nova ou troca de plano.
 */
export async function createMembershipPaymentPix(
  gymId: string,
  studentId: string,
  planId: string,
  amount: number,
  options?: { membershipId?: string },
): Promise<MembershipPaymentPixResult> {
  const [gym, student, plan] = await Promise.all([
    db.gym.findUnique({
      where: { id: gymId },
      include: { user: true },
    }),
    db.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    }),
    db.membershipPlan.findUnique({
      where: { id: planId, gymId },
    }),
  ]);

  if (!gym) throw new Error("Academia não encontrada");
  if (!student) throw new Error("Aluno não encontrado");
  if (!plan) throw new Error("Plano não encontrado");
  if (!plan.isActive) throw new Error("Plano não está ativo");

  const amountCentavos = Math.round(amount * 100);
  if (amountCentavos < 100) throw new Error("Valor mínimo deve ser R$ 1,00");

  const description = `${plan.name} - ${gym.name}`.slice(0, 37);

  const pixResponse = await abacatePay.createPixQrCode({
    amount: amountCentavos,
    expiresIn: PIX_EXPIRES_IN_SECONDS, // 4 minutos
    description,
    metadata: {
      gymId,
      studentId,
      planId,
      membershipId: options?.membershipId ?? null,
      kind: "membership-payment",
    },
    customer: student.user?.email
      ? {
          name: student.user.name ?? "Aluno",
          email: student.user.email,
          cellphone: student.phone ?? "",
          taxId: "",
        }
      : undefined,
  });

  if (pixResponse.error || !pixResponse.data) {
    log.error("[createMembershipPaymentPix] Erro", {
      error: pixResponse.error,
    });
    throw new Error(pixResponse.error || "Erro ao criar PIX na AbacatePay");
  }

  const pix = pixResponse.data;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + plan.duration);
  const pixExpiresAt = pix.expiresAt ? new Date(pix.expiresAt) : null;

  const payment = await db.payment.create({
    data: {
      gymId,
      studentId,
      studentName: student.user?.name ?? "Aluno",
      planId,
      amount,
      dueDate,
      status: "pending",
      paymentMethod: "pix",
      abacatePayBillingId: pix.id,
      pixBrCode: pix.brCode,
      pixBrCodeBase64: pix.brCodeBase64,
      pixExpiresAt,
      reference: options?.membershipId
        ? `membership:${options.membershipId}`
        : null,
    },
  });

  return {
    brCode: pix.brCode,
    brCodeBase64: pix.brCodeBase64,
    amount: pix.amount,
    paymentId: payment.id,
    expiresAt: pix.expiresAt,
  };
}

export interface ChangePlanPaymentPixResult {
  brCode: string;
  brCodeBase64: string;
  amount: number;
  paymentId: string;
  expiresAt: string;
}

/**
 * Cria PIX para troca de plano em membership existente.
 */
export async function createChangePlanPaymentPix(
  membershipId: string,
  planId: string,
): Promise<ChangePlanPaymentPixResult> {
  const [membership, newPlan] = await Promise.all([
    db.gymMembership.findUnique({
      where: { id: membershipId },
      include: {
        student: { include: { user: true } },
        gym: true,
      },
    }),
    db.membershipPlan.findUnique({
      where: { id: planId },
    }),
  ]);

  if (!membership) throw new Error("Matrícula não encontrada");
  if (!newPlan) throw new Error("Plano não encontrado");
  if (!newPlan.isActive) throw new Error("Plano não está ativo");
  if (newPlan.gymId !== membership.gymId) {
    throw new Error("Plano não pertence à mesma academia");
  }

  const amount = newPlan.price;
  const amountCentavos = Math.round(amount * 100);
  if (amountCentavos < 100) throw new Error("Valor mínimo deve ser R$ 1,00");

  const description = `${newPlan.name} - ${membership.gym.name}`.slice(0, 37);

  const pixResponse = await abacatePay.createPixQrCode({
    amount: amountCentavos,
    expiresIn: PIX_EXPIRES_IN_SECONDS,
    description,
    metadata: {
      gymId: membership.gymId,
      studentId: membership.studentId,
      planId,
      membershipId,
      kind: "membership-change-plan",
    },
    customer: membership.student?.user?.email
      ? {
          name: membership.student.user.name ?? "Aluno",
          email: membership.student.user.email,
          cellphone: membership.student.phone ?? "",
          taxId: "",
        }
      : undefined,
  });

  if (pixResponse.error || !pixResponse.data) {
    log.error("[createChangePlanPaymentPix] Erro", {
      error: pixResponse.error,
    });
    throw new Error(pixResponse.error || "Erro ao criar PIX na AbacatePay");
  }

  const pix = pixResponse.data;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newPlan.duration);
  const pixExpiresAt = pix.expiresAt ? new Date(pix.expiresAt) : null;

  const payment = await db.payment.create({
    data: {
      gymId: membership.gymId,
      studentId: membership.studentId,
      studentName: membership.student?.user?.name ?? "Aluno",
      planId,
      amount,
      dueDate,
      status: "pending",
      paymentMethod: "pix",
      abacatePayBillingId: pix.id,
      pixBrCode: pix.brCode,
      pixBrCodeBase64: pix.brCodeBase64,
      pixExpiresAt,
      reference: `membership:${membershipId}`,
    },
  });

  return {
    brCode: pix.brCode,
    brCodeBase64: pix.brCodeBase64,
    amount: pix.amount,
    paymentId: payment.id,
    expiresAt: pix.expiresAt,
  };
}

/** Mínimo de segundos restantes para considerar o PIX ainda utilizável */
const PIX_MIN_SECONDS_REMAINING = 60;

/**
 * Gera ou reutiliza PIX para um pagamento pendente.
 * Se já existe PIX válido (não expirado), retorna ele para que o countdown mostre o tempo real.
 */
export async function createPixForPendingPayment(
  paymentId: string,
  studentId: string,
): Promise<MembershipPaymentPixResult> {
  const [payment, student] = await Promise.all([
    db.payment.findFirst({
      where: { id: paymentId, studentId },
      include: {
        gym: true,
        plan: true,
      },
    }),
    db.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    }),
  ]);

  if (!payment) throw new Error("Pagamento não encontrado");
  if (payment.status !== "pending" && payment.status !== "overdue") {
    throw new Error(
      "Apenas pagamentos pendentes ou atrasados podem gerar novo PIX",
    );
  }
  if (!payment.plan) throw new Error("Plano não encontrado");

  // Reutilizar PIX em cache se ainda válido (countdown correto)
  const cached = payment as typeof payment & {
    pixBrCode?: string | null;
    pixBrCodeBase64?: string | null;
    pixExpiresAt?: Date | null;
  };
  if (cached.pixBrCode && cached.pixBrCodeBase64 && cached.pixExpiresAt) {
    const now = Date.now();
    const expiresAtMs = cached.pixExpiresAt.getTime();
    const secondsRemaining = Math.floor((expiresAtMs - now) / 1000);
    if (secondsRemaining >= PIX_MIN_SECONDS_REMAINING) {
      return {
        brCode: cached.pixBrCode,
        brCodeBase64: cached.pixBrCodeBase64,
        amount: Math.round((payment.amount as number) * 100),
        paymentId: payment.id,
        expiresAt: cached.pixExpiresAt.toISOString(),
      };
    }
  }

  const membershipId = payment.reference?.startsWith("membership:")
    ? payment.reference.slice("membership:".length)
    : undefined;
  let kind: "membership-payment" | "membership-change-plan" =
    "membership-payment";
  if (membershipId) {
    const membership = await db.gymMembership.findFirst({
      where: { id: membershipId },
      select: { status: true },
    });
    if (membership?.status === "active") kind = "membership-change-plan";
  }

  const amountCentavos = Math.round(payment.amount * 100);
  const description = `${payment.plan.name} - ${payment.gym.name}`.slice(0, 37);

  const pixResponse = await abacatePay.createPixQrCode({
    amount: amountCentavos,
    expiresIn: PIX_EXPIRES_IN_SECONDS,
    description,
    metadata: {
      gymId: payment.gymId,
      studentId: payment.studentId,
      planId: payment.planId!,
      membershipId: membershipId ?? null,
      kind,
    },
    customer: student?.user?.email
      ? {
          name: student.user.name ?? "Aluno",
          email: student.user.email,
          cellphone: student.phone ?? "",
          taxId: "",
        }
      : undefined,
  });

  if (pixResponse.error || !pixResponse.data) {
    throw new Error(pixResponse.error || "Erro ao criar PIX na AbacatePay");
  }

  const pix = pixResponse.data;
  const pixExpiresAt = pix.expiresAt ? new Date(pix.expiresAt) : null;

  await db.payment.update({
    where: { id: paymentId },
    data: {
      abacatePayBillingId: pix.id,
      pixBrCode: pix.brCode,
      pixBrCodeBase64: pix.brCodeBase64,
      pixExpiresAt,
    },
  });

  return {
    brCode: pix.brCode,
    brCodeBase64: pix.brCodeBase64,
    amount: pix.amount,
    paymentId: payment.id,
    expiresAt: pix.expiresAt,
  };
}
