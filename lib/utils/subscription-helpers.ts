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
 * Verifica se o nome do plano corresponde a um plano premium.
 * Aceita qualquer variação: "premium", "Premium Mensal", "Premium Anual", etc.
 */
export function isPremiumPlan(plan: string): boolean {
	return plan.toLowerCase().includes("premium");
}

/**
 * Verifica se o usuário tem status de premium ativo (plano premium + status válido).
 * Função pura — não acessa o banco de dados.
 */
export function hasActivePremiumStatus(subscription: {
	plan: string;
	status: string;
	trialEnd?: Date | string | null;
}): boolean {
	if (!isPremiumPlan(subscription.plan)) return false;

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
