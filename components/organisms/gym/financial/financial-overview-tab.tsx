"use client";

import {
	AlertCircle,
	CreditCard,
	DollarSign,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import {
	DuoAlert,
	DuoCard,
	DuoStatCard,
	DuoStatsGrid,
} from "@/components/duo";
import type { FinancialSummary, Payment } from "@/lib/types";

interface FinancialOverviewTabProps {
	financialSummary: FinancialSummary;
	payments: Payment[];
	subscription?: {
		id: string;
		plan: string;
		status: string;
		currentPeriodEnd: Date;
	} | null;
}

export function FinancialOverviewTab({
	financialSummary,
	payments,
	subscription,
}: FinancialOverviewTabProps) {
	const formatCurrency = (value: number | undefined | null) => {
		if (value == null || Number.isNaN(value)) return "R$ 0,00";
		return `R$ ${value.toLocaleString("pt-BR")}`;
	};

	return (
		<div className="space-y-6">
			{/* Alertas de Assinatura da Academia */}
			{subscription?.status === "past_due" && (
				<DuoAlert variant="danger" title="Assinatura Atrasada">
					A assinatura da Nutrifit para esta academia está atrasada. Regularize
					para evitar a suspensão do acesso.
				</DuoAlert>
			)}

			{subscription?.status === "canceled" && (
				<DuoAlert variant="warning" title="Assinatura Cancelada">
					A assinatura desta academia foi cancelada. O acesso está limitado ao
					plano Free.
				</DuoAlert>
			)}

			{/* Alertas de Pagamentos de Alunos */}
			{(financialSummary.overduePayments ?? 0) > 0 && (
				<DuoAlert variant="danger" title="Mensalidades Atrasadas">
					{payments.filter((p) => p.status === "overdue").length} pagamento(s)
					atrasado(s) de alunos, totalizando{" "}
					{formatCurrency(financialSummary.overduePayments)}.
				</DuoAlert>
			)}

			<DuoStatsGrid.Root columns={2} className="gap-3">
				<DuoStatCard.Simple
					icon={TrendingUp}
					value={formatCurrency(financialSummary.totalRevenue)}
					label="Receita Total"
					badge={`+${financialSummary.revenueGrowth}%`}
					iconColor="var(--duo-primary)"
				/>
				<DuoStatCard.Simple
					icon={TrendingDown}
					value={formatCurrency(financialSummary.totalExpenses)}
					label="Despesas"
					badge="Mensal"
					iconColor="var(--duo-danger)"
				/>
				<DuoStatCard.Simple
					icon={DollarSign}
					value={formatCurrency(financialSummary.netProfit)}
					label="Lucro Líquido"
					iconColor="var(--duo-secondary)"
				/>
				<DuoStatCard.Simple
					icon={CreditCard}
					value={formatCurrency(financialSummary.monthlyRecurring)}
					label="Recorrente Mensal"
					badge="MRR"
					iconColor="#A560E8"
				/>
			</DuoStatsGrid.Root>

			<DuoCard.Root variant="default" padding="md">
				<DuoCard.Header>
					<div className="flex items-center gap-2">
						<DollarSign className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
						<h2 className="font-bold text-[var(--duo-fg)]">Métricas do Mês</h2>
					</div>
				</DuoCard.Header>
				<div className="space-y-3">
					<DuoCard.Root variant="default" size="sm">
						<div className="flex items-center justify-between">
							<span className="text-sm text-duo-gray-dark">Ticket Médio</span>
							<span className="text-sm font-bold text-duo-text">
								{formatCurrency(financialSummary.averageTicket)}
							</span>
						</div>
					</DuoCard.Root>
					<DuoCard.Root variant="default" size="sm">
						<div className="flex items-center justify-between">
							<span className="text-sm text-duo-gray-dark">Taxa de Churn</span>
							<span className="text-sm font-bold text-duo-red">
								{(financialSummary.churnRate ?? 0)}%
							</span>
						</div>
					</DuoCard.Root>
					<DuoCard.Root variant="default" size="sm">
						<div className="flex items-center justify-between">
							<span className="text-sm text-duo-gray-dark">
								Pagamentos Pendentes
							</span>
							<span className="text-sm font-bold text-duo-yellow">
								{formatCurrency(financialSummary.pendingPayments)}
							</span>
						</div>
					</DuoCard.Root>
				</div>
			</DuoCard.Root>
		</div>
	);
}
