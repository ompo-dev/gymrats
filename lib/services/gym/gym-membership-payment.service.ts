import { abacatePay } from "@/lib/api/abacatepay";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";

export interface MembershipPaymentPixResult {
	brCode: string;
	brCodeBase64: string;
	amount: number; // centavos
	paymentId: string;
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
		expiresIn: 3600, // 1 hora
		description,
		metadata: {
			gymId,
			studentId,
			planId,
			membershipId: options?.membershipId ?? undefined,
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
		log.error("[createMembershipPaymentPix] Erro", { error: pixResponse.error });
		throw new Error(
			pixResponse.error || "Erro ao criar PIX na AbacatePay",
		);
	}

	const pix = pixResponse.data;
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
			abacatePayBillingId: pix.id,
			reference: options?.membershipId ? `membership:${options.membershipId}` : null,
		},
	});

	return {
		brCode: pix.brCode,
		brCodeBase64: pix.brCodeBase64,
		amount: pix.amount,
		paymentId: payment.id,
	};
}

export interface ChangePlanPaymentPixResult {
	brCode: string;
	brCodeBase64: string;
	amount: number;
	paymentId: string;
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
		expiresIn: 3600,
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
		log.error("[createChangePlanPaymentPix] Erro", { error: pixResponse.error });
		throw new Error(
			pixResponse.error || "Erro ao criar PIX na AbacatePay",
		);
	}

	const pix = pixResponse.data;
	const dueDate = new Date();
	dueDate.setDate(dueDate.getDate() + newPlan.duration);

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
			reference: `membership:${membershipId}`,
		},
	});

	return {
		brCode: pix.brCode,
		brCodeBase64: pix.brCodeBase64,
		amount: pix.amount,
		paymentId: payment.id,
	};
}

/**
 * Gera novo PIX para um pagamento pendente existente (PIX anterior pode ter expirado).
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
		throw new Error("Apenas pagamentos pendentes ou atrasados podem gerar novo PIX");
	}
	if (!payment.plan) throw new Error("Plano não encontrado");

	const membershipId = payment.reference?.startsWith("membership:")
		? payment.reference.slice("membership:".length)
		: undefined;
	let kind: "membership-payment" | "membership-change-plan" = "membership-payment";
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
		expiresIn: 3600,
		description,
		metadata: {
			gymId: payment.gymId,
			studentId: payment.studentId,
			planId: payment.planId!,
			membershipId,
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
		throw new Error(
			pixResponse.error || "Erro ao criar PIX na AbacatePay",
		);
	}

	const pix = pixResponse.data;

	await db.payment.update({
		where: { id: paymentId },
		data: { abacatePayBillingId: pix.id },
	});

	return {
		brCode: pix.brCode,
		brCodeBase64: pix.brCodeBase64,
		amount: pix.amount,
		paymentId: payment.id,
	};
}
