import type { Context } from "elysia";
import { addPaymentMethodSchema, paymentsQuerySchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import {
	badRequestResponse,
	internalErrorResponse,
	successResponse,
} from "../utils/response";
import { validateBody, validateQuery } from "../utils/validation";

type PaymentsContext = {
	set: Context["set"];
	query?: Record<string, unknown>;
	body?: unknown;
	studentId?: string;
	userId?: string;
};

export async function getPaymentsHandler({
	set,
	query,
	studentId,
}: PaymentsContext) {
	try {
		if (!studentId) {
			return internalErrorResponse(set, "Student ID não encontrado");
		}

		const queryValidation = validateQuery(
			(query || {}) as Record<string, unknown>,
			paymentsQuerySchema,
		);
		if (!queryValidation.success) {
			return badRequestResponse(
				set,
				`Erros de validação: ${queryValidation.errors.join("; ")}`,
				{ errors: queryValidation.errors },
			);
		}

		const limit = queryValidation.data.limit || 20;
		const offset = queryValidation.data.offset || 0;

		const payments = await db.payment.findMany({
			where: { studentId },
			include: {
				gym: { select: { id: true, name: true } },
				plan: { select: { id: true, name: true } },
			},
			orderBy: { date: "desc" },
			take: limit,
			skip: offset,
		});

		const formattedPayments = payments.map((payment) => ({
			id: payment.id,
			gymId: payment.gymId,
			gymName: payment.gym.name,
			planName: payment.plan?.name || undefined,
			amount: payment.amount,
			date: payment.date,
			dueDate: payment.dueDate,
			status: payment.status as "paid" | "pending" | "overdue" | "canceled",
			paymentMethod: payment.paymentMethod as
				| "credit-card"
				| "debit-card"
				| "pix"
				| "cash"
				| undefined,
			reference: payment.reference || undefined,
		}));

		const total = await db.payment.count({ where: { studentId } });

		return successResponse(set, {
			payments: formattedPayments,
			total,
			limit,
			offset,
		});
	} catch (error) {
		console.error("[getPaymentsHandler] Erro:", error);
		return internalErrorResponse(set, "Erro ao buscar pagamentos", error);
	}
}

export async function getPaymentMethodsHandler({
	set,
	userId,
}: PaymentsContext) {
	try {
		if (!userId) {
			return internalErrorResponse(set, "User ID não encontrado");
		}

		const paymentMethods = await db.paymentMethod.findMany({
			where: { userId },
			orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
		});

		const formattedMethods = paymentMethods.map((method) => ({
			id: method.id,
			type: method.type as "credit-card" | "debit-card" | "pix",
			isDefault: method.isDefault,
			cardBrand: method.cardBrand || undefined,
			last4: method.last4 || undefined,
			expiryMonth: method.expiryMonth || undefined,
			expiryYear: method.expiryYear || undefined,
			holderName: method.holderName || undefined,
			pixKey: method.pixKey || undefined,
		}));

		return successResponse(set, { paymentMethods: formattedMethods });
	} catch (error) {
		console.error("[getPaymentMethodsHandler] Erro:", error);
		return internalErrorResponse(
			set,
			"Erro ao buscar métodos de pagamento",
			error,
		);
	}
}

export async function addPaymentMethodHandler({
	set,
	body,
	userId,
}: PaymentsContext) {
	try {
		if (!userId) {
			return internalErrorResponse(set, "User ID não encontrado");
		}

		const validation = validateBody(body, addPaymentMethodSchema);
		if (!validation.success) {
			return badRequestResponse(
				set,
				`Erros de validação: ${validation.errors.join("; ")}`,
				{ errors: validation.errors },
			);
		}

		const {
			type,
			isDefault,
			cardBrand,
			last4,
			expiryMonth,
			expiryYear,
			holderName,
			pixKey,
			pixKeyType,
		} = validation.data as any;

		if (isDefault) {
			await db.paymentMethod.updateMany({
				where: { userId, isDefault: true },
				data: { isDefault: false },
			});
		}

		const paymentMethod = await db.paymentMethod.create({
			data: {
				userId,
				type,
				isDefault: isDefault || false,
				cardBrand: cardBrand || null,
				last4: last4 || null,
				expiryMonth: expiryMonth || null,
				expiryYear: expiryYear || null,
				holderName: holderName || null,
				pixKey: pixKey || null,
				pixKeyType: pixKeyType || null,
			},
		});

		return successResponse(set, {
			paymentMethod: {
				id: paymentMethod.id,
				type: paymentMethod.type,
				isDefault: paymentMethod.isDefault,
				cardBrand: paymentMethod.cardBrand || undefined,
				last4: paymentMethod.last4 || undefined,
				expiryMonth: paymentMethod.expiryMonth || undefined,
				expiryYear: paymentMethod.expiryYear || undefined,
				holderName: paymentMethod.holderName || undefined,
				pixKey: paymentMethod.pixKey || undefined,
			},
		});
	} catch (error) {
		console.error("[addPaymentMethodHandler] Erro:", error);
		return internalErrorResponse(
			set,
			"Erro ao criar método de pagamento",
			error,
		);
	}
}

export async function getMembershipsHandler({
	set,
	studentId,
}: PaymentsContext) {
	try {
		if (!studentId) {
			return internalErrorResponse(set, "Student ID não encontrado");
		}

		const memberships = await db.gymMembership.findMany({
			where: { studentId },
			include: {
				gym: {
					select: {
						id: true,
						name: true,
						address: true,
						logo: true,
					},
				},
				plan: {
					select: {
						id: true,
						name: true,
						price: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		const formattedMemberships = memberships.map((membership) => ({
			id: membership.id,
			gymId: membership.gymId,
			gymName: membership.gym.name,
			planName: membership.plan?.name || undefined,
			startDate: membership.startDate,
			endDate: membership.nextBillingDate || undefined,
			status: membership.status as
				| "active"
				| "expired"
				| "canceled"
				| "suspended"
				| "pending",
			autoRenew: membership.autoRenew,
			amount: membership.amount,
		}));

		return successResponse(set, { memberships: formattedMemberships });
	} catch (error) {
		console.error("[getMembershipsHandler] Erro:", error);
		return internalErrorResponse(set, "Erro ao buscar memberships", error);
	}
}
