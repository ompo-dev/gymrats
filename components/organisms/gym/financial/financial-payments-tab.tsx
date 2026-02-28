"use client";

import { ChevronDown, ChevronRight, CreditCard } from "lucide-react";
import { useMemo, useState } from "react";
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

function formatAmount(value: number) {
	return `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinancialPaymentsTab({ payments }: FinancialPaymentsTabProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const byStudent = useMemo(() => {
		const map = new Map<string, { studentName: string; studentId: string; payments: Payment[] }>();
		for (const p of payments) {
			const key = p.studentId;
			if (!map.has(key)) {
				map.set(key, { studentName: p.studentName, studentId: p.studentId, payments: [] });
			}
			map.get(key)!.payments.push(p);
		}
		const list = Array.from(map.values()).map((g) => ({
			...g,
			payments: [...g.payments].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			),
		}));
		list.sort((a, b) => {
			const dateA = Math.max(...a.payments.map((x) => new Date(x.date).getTime()));
			const dateB = Math.max(...b.payments.map((x) => new Date(x.date).getTime()));
			return dateB - dateA;
		});
		return list;
	}, [payments]);

	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<CreditCard className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
					<h2 className="font-bold text-[var(--duo-fg)]">Pagamentos por aluno</h2>
				</div>
			</DuoCard.Header>
			<div className="space-y-2">
				{byStudent.length === 0 && (
					<p className="py-8 text-center text-sm text-duo-gray-dark">
						Nenhum pagamento registrado.
					</p>
				)}
				{byStudent.map(({ studentId, studentName, payments: studentPayments }) => {
					const isExpanded = expandedId === studentId;
					const total = studentPayments.reduce((s, p) => s + (p.status === "paid" || p.status === "withdrawn" ? p.amount : 0), 0);
					const lastPayment = studentPayments[0];
					return (
						<DuoCard.Root key={studentId} variant="default" size="default">
							<button
								type="button"
								className="flex w-full items-center gap-2 text-left"
								onClick={() => setExpandedId(isExpanded ? null : studentId)}
							>
								{isExpanded ? (
									<ChevronDown className="h-4 w-4 shrink-0 text-duo-gray-dark" />
								) : (
									<ChevronRight className="h-4 w-4 shrink-0 text-duo-gray-dark" />
								)}
								<div className="min-w-0 flex-1">
									<div className="font-bold text-duo-text truncate">{studentName}</div>
									<div className="text-xs text-duo-gray-dark">
										{studentPayments.length} pagamento(s) • Total recebido: {formatAmount(total)}
									</div>
								</div>
								{lastPayment && (
									<div
										className={cn(
											"rounded-lg border px-2 py-1 text-xs font-medium shrink-0",
											getStatusColor(lastPayment.status),
										)}
									>
										{getStatusLabel(lastPayment.status)}
									</div>
								)}
							</button>
							{isExpanded && (
								<div className="mt-3 space-y-2 border-t border-duo-border pt-3">
									{studentPayments.map((payment) => (
										<div
											key={payment.id}
											className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-duo-border bg-duo-gray-lighter/30 p-3"
										>
											<div>
												<div className="text-sm font-medium text-duo-text">{payment.planName}</div>
												<div className="text-xs text-duo-gray-dark">
													Venc.: {formatDatePtBr(payment.dueDate) || "—"} • Pago: {payment.date ? formatDatePtBr(payment.date) : "—"}
												</div>
											</div>
											<div className="flex items-center gap-2">
												<span className="font-bold text-duo-green">{formatAmount(payment.amount)}</span>
												<span
													className={cn(
														"rounded border px-2 py-0.5 text-xs font-medium",
														getStatusColor(payment.status),
													)}
												>
													{getStatusLabel(payment.status)}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</DuoCard.Root>
					);
				})}
			</div>
		</DuoCard.Root>
	);
}
