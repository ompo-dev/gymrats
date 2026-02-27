"use client";

import { CreditCard, Plus } from "lucide-react";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";
import type { Payment } from "@/lib/types";
import { formatDatePtBr } from "@/lib/utils/date-safe";
import { cn } from "@/lib/utils";

interface FinancialPaymentsTabProps {
	payments: Payment[];
}

const getStatusColor = (status: string) => {
	switch (status) {
		case "paid":
			return "bg-duo-green/20 text-duo-green border-duo-green";
		case "withdrawn":
			return "bg-duo-blue/20 text-duo-blue border-duo-blue";
		case "pending":
			return "bg-duo-yellow/20 text-duo-yellow border-duo-yellow";
		case "overdue":
			return "bg-duo-red/20 text-duo-red border-duo-red";
		case "canceled":
			return "bg-gray-50 text-duo-gray-dark border-duo-border";
		default:
			return "bg-gray-50 text-duo-gray-dark border-duo-border";
	}
};

const getStatusLabel = (status: string) => {
	switch (status) {
		case "paid":
			return "Pago";
		case "withdrawn":
			return "Sacado";
		case "pending":
			return "Pendente";
		case "overdue":
			return "Atrasado";
		case "canceled":
			return "Cancelado";
		default:
			return status;
	}
};

export function FinancialPaymentsTab({ payments }: FinancialPaymentsTabProps) {
	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<CreditCard className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
					<h2 className="font-bold text-[var(--duo-fg)]">Pagamentos Recentes</h2>
				</div>
				<DuoButton size="sm">
					<Plus className="h-4 w-4" />
				</DuoButton>
			</DuoCard.Header>
			<div className="space-y-3">
				{payments.length === 0 && (
					<p className="py-8 text-center text-sm text-duo-gray-dark">
						Nenhum pagamento registrado.
					</p>
				)}
				{payments.map((payment) => (
					<DuoCard.Root key={payment.id} variant="default" size="default">
						<div className="mb-3 flex items-start justify-between">
							<div>
								<div className="text-sm font-bold text-duo-text">
									{payment.studentName}
								</div>
								<div className="text-xs text-duo-gray-dark">
									{payment.planName}
								</div>
							</div>
							<div
								className={cn(
									"rounded-lg border-2 px-3 py-1 text-xs font-bold",
									getStatusColor(payment.status),
								)}
							>
								{getStatusLabel(payment.status)}
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<div className="text-xs text-duo-gray-dark">Valor</div>
								<div className="text-lg font-bold text-duo-green">
									R$ {payment.amount}
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs text-duo-gray-dark">Vencimento</div>
								<div className="text-sm font-bold text-duo-text">
									{formatDatePtBr(payment.dueDate) || "N/A"}
								</div>
							</div>
						</div>
					</DuoCard.Root>
				))}
			</div>
		</DuoCard.Root>
	);
}
