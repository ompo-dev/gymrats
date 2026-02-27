"use client";

import { Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";
import type { Expense } from "@/lib/types";
import { formatDatePtBr } from "@/lib/utils/date-safe";
import { AddExpenseModal } from "./add-expense-modal";

interface FinancialExpensesTabProps {
	expenses: Expense[];
}

export function FinancialExpensesTab({ expenses }: FinancialExpensesTabProps) {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount ?? 0), 0);

	return (
		<>
			<DuoCard.Root variant="default" padding="md">
				<DuoCard.Header>
					<div className="flex items-center gap-2">
						<Receipt className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
						<h2 className="font-bold text-[var(--duo-fg)]">Despesas do Mês</h2>
					</div>
					<DuoButton
						size="sm"
						variant="danger"
						onClick={() => setIsAddModalOpen(true)}
					>
						<Plus className="h-4 w-4" />
					</DuoButton>
				</DuoCard.Header>
				<div className="space-y-3">
				{expenses.length === 0 && (
					<p className="py-8 text-center text-sm text-duo-gray-dark">
						Nenhuma despesa registrada.
					</p>
				)}
				{expenses.map((expense) => (
					<DuoCard.Root key={expense.id} variant="default" size="default">
						<div className="mb-3 flex items-start justify-between">
							<div>
								<div className="mb-1 text-xs font-bold uppercase text-duo-gray-dark">
									{expense.type}
								</div>
								<div className="text-sm font-bold text-duo-text">
									{expense.description}
								</div>
								<div className="text-xs text-duo-gray-dark">
									{expense.category}
								</div>
							</div>
							<div className="text-right">
								<div className="text-lg font-bold text-duo-red">
									-R$ {expense.amount}
								</div>
								<div className="text-xs text-duo-gray-dark">
									{formatDatePtBr(expense.date) || "N/A"}
								</div>
							</div>
						</div>
					</DuoCard.Root>
				))}
			</div>

			<DuoCard.Root
				variant="default"
				size="default"
				className="mt-4 border-duo-red bg-duo-red/10"
			>
				<div className="flex items-center justify-between">
					<span className="text-sm font-bold text-duo-gray-dark">
						Total de Despesas
					</span>
					<span className="text-xl font-bold text-duo-red">
						R$ {(totalExpenses ?? 0).toLocaleString("pt-BR")}
					</span>
				</div>
			</DuoCard.Root>
		</DuoCard.Root>

			<AddExpenseModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSuccess={() => setIsAddModalOpen(false)}
			/>
		</>
	);
}
