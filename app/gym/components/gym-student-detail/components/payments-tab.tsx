"use client";

import { AlertCircle, CheckCircle, DollarSign, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { DuoButton, DuoCard } from "@/components/duo";
import { formatDatePtBr } from "@/lib/utils/date-safe";
import type { Payment } from "@/lib/types";

export interface PaymentsTabProps {
	payments: Payment[];
	onTogglePaymentStatus: (paymentId: string) => void;
}

export function PaymentsTab({
	payments,
	onTogglePaymentStatus,
}: PaymentsTabProps) {
	const paidCount = payments.filter((p) => p.status === "paid").length;
	const pendingCount = payments.filter(
		(p) => p.status === "pending" || p.status === "overdue",
	).length;
	const totalPaid = payments
		.filter((p) => p.status === "paid")
		.reduce((sum, p) => sum + p.amount, 0);
	const totalPending = payments
		.filter((p) => p.status === "pending" || p.status === "overdue")
		.reduce((sum, p) => sum + p.amount, 0);

	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<DollarSign
						className="h-5 w-5 shrink-0"
						style={{ color: "var(--duo-secondary)" }}
						aria-hidden
					/>
					<h2 className="font-bold text-[var(--duo-fg)]">Histórico de Pagamentos</h2>
				</div>
			</DuoCard.Header>
			<div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
				<DuoCard.Root variant="highlighted" size="sm">
					<div className="flex items-center gap-3">
						<CheckCircle className="h-6 w-6 text-duo-green" />
						<div>
							<p className="text-sm font-bold text-duo-gray-dark">Pagos</p>
							<p className="text-2xl font-bold text-duo-green">{paidCount}</p>
						</div>
					</div>
				</DuoCard.Root>

				<DuoCard.Root variant="orange" size="sm">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-6 w-6 text-duo-orange" />
						<div>
							<p className="text-sm font-bold text-duo-gray-dark">Pendentes</p>
							<p className="text-2xl font-bold text-duo-orange">{pendingCount}</p>
						</div>
					</div>
				</DuoCard.Root>

				<DuoCard.Root variant="blue" size="sm">
					<div className="flex items-center gap-3">
						<DollarSign className="h-6 w-6 text-duo-blue" />
						<div>
							<p className="text-sm font-bold text-duo-gray-dark">Total Pago</p>
							<p className="text-xl font-bold text-duo-blue">
								R$ {totalPaid.toFixed(2)}
							</p>
						</div>
					</div>
				</DuoCard.Root>

				<DuoCard.Root variant="default" size="sm">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-6 w-6 text-duo-orange" />
						<div>
							<p className="text-sm font-bold text-duo-gray-dark">Total Pendente</p>
							<p className="text-xl font-bold text-duo-orange">
								R$ {totalPending.toFixed(2)}
							</p>
						</div>
					</div>
				</DuoCard.Root>
			</div>

			<div className="space-y-3">
				{payments.map((payment, index) => (
					<motion.div
						key={payment.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05, duration: 0.4 }}
					>
						<DuoCard.Root variant="default" size="default">
							<div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
								<div className="flex-1 min-w-0">
									<h3 className="font-bold text-duo-text text-sm sm:text-base wrap-break-words">
										{payment.planName}
									</h3>
									<p className="text-xs sm:text-sm text-duo-gray-dark mt-1">
										Vencimento: {formatDatePtBr(payment.dueDate) || "N/A"}
									</p>
									{payment.status === "paid" && (
										<p className="text-xs sm:text-sm text-duo-gray-dark">
											Pago em: {formatDatePtBr(payment.date) || "N/A"}
										</p>
									)}
									<p className="text-xs sm:text-sm text-duo-gray-dark capitalize">
										Método: {payment.paymentMethod.replace("-", " ")}
									</p>
								</div>

								<div className="w-full sm:w-auto text-left sm:text-right">
									<p className="text-xl sm:text-2xl font-bold text-duo-blue mb-2">
										R$ {payment.amount.toFixed(2)}
									</p>

									<DuoButton
										onClick={() => onTogglePaymentStatus(payment.id)}
										variant={payment.status === "paid" ? "primary" : "outline"}
										size="sm"
										className="w-full sm:w-auto"
									>
										{payment.status === "paid" ? (
											<>
												<CheckCircle className="h-4 w-4" />
												Pago
											</>
										) : (
											<>
												<XCircle className="h-4 w-4" />
												<span className="hidden sm:inline">Marcar como Pago</span>
												<span className="sm:hidden">Marcar Pago</span>
											</>
										)}
									</DuoButton>
								</div>
							</div>
						</DuoCard.Root>
					</motion.div>
				))}
			</div>
		</DuoCard.Root>
	);
}
