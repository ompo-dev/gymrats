"use client";

import {
	AlertCircle,
	CreditCard,
	DollarSign,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { DuoCard } from "@/components/duo";
import {
	DuoStatCard,
	DuoStatsGrid,
} from "@/components/duo";
import type { FinancialSummary, Payment } from "@/lib/types";

interface FinancialOverviewTabProps {
	financialSummary: FinancialSummary;
	payments: Payment[];
}

export function FinancialOverviewTab({
	financialSummary,
	payments,
}: FinancialOverviewTabProps) {
	const formatCurrency = (value: number | undefined | null) => {
		if (value == null || Number.isNaN(value)) return "R$ 0,00";
		return `R$ ${value.toLocaleString("pt-BR")}`;
	};

	return (
		<div className="space-y-6">
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

			{(financialSummary.overduePayments ?? 0) > 0 && (
				<DuoCard.Root
					variant="default"
					size="default"
					className="border-duo-red bg-duo-red/10"
				>
					<div className="flex items-start gap-3">
						<AlertCircle className="h-5 w-5 shrink-0 text-duo-red" />
						<div className="flex-1">
							<div className="text-sm font-bold text-duo-red">
								Pagamentos Atrasados
							</div>
							<div className="text-xs text-duo-red">
								{payments.filter((p) => p.status === "overdue").length}{" "}
								pagamento(s) atrasado(s) - {formatCurrency(financialSummary.overduePayments)}
							</div>
						</div>
					</div>
				</DuoCard.Root>
			)}

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
