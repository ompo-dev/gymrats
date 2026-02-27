/**
 * Utilitários puros de verificação de plano premium.
 *
 * ⚠️ Este arquivo NÃO importa db, Prisma, ou qualquer dependência server-only.
 *    Pode ser importado com segurança em componentes client-side.
 *
 * Para funções que acessam o banco de dados (ex: hasPremiumAccess),
 * use `@/lib/utils/subscription` (server-only).
 */

/**
 * Verifica se o nome do plano corresponde a um plano basic ou superior.
 */
export function isBasicPlan(plan: string): boolean {
	const p = plan.toLowerCase();
	return p.includes("basic") || p.includes("premium") || p.includes("enterprise");
}

/**
 * Verifica se o nome do plano corresponde a um plano premium.
 */
export function isPremiumPlan(plan: string): boolean {
	return plan.toLowerCase().includes("premium") || plan.toLowerCase().includes("enterprise");
}

/**
 * Verifica se o usuário tem status de premium ativo (plano premium + status válido).
 * Função pura — não acessa o banco de dados.
 *
 * IMPORTANTE: status "canceled" NUNCA retorna true — cancelamento revoga acesso imediato.
 */
export function hasActivePremiumStatus(subscription: {
	plan: string;
	status: string;
	trialEnd?: Date | string | null;
}): boolean {
	if (!isPremiumPlan(subscription.plan)) return false;

	// Cancelamento revoga acesso imediatamente, independentemente do trial restante
	if (subscription.status === "canceled" || subscription.status === "expired") {
		return false;
	}

	const now = new Date();
	const isTrialActive =
		subscription.trialEnd && new Date(subscription.trialEnd) > now;

	return (
		subscription.status === "active" ||
		subscription.status === "trialing" ||
		!!isTrialActive
	);
}

/**
 * Extrai o período de cobrança a partir do nome do plano.
 * Retorna "annual" se contém "Anual", senão "monthly".
 */
export function getBillingPeriodFromPlan(plan: string): "monthly" | "annual" {
	return plan.toLowerCase().includes("anual") ? "annual" : "monthly";
}
