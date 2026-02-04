"use client";

import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { SectionCard } from "@/components/molecules/cards/section-card";
import type { Expense } from "@/lib/types";

interface FinancialExpensesTabProps {
	expenses: Expense[];
}

export function FinancialExpensesTab({ expenses }: FinancialExpensesTabProps) {
	const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

	return (
		<SectionCard
			title="Despesas do Mês"
			icon={Receipt}
			headerAction={
				<Button size="sm" variant="destructive">
					<Plus className="h-4 w-4" />
				</Button>
			}
		>
			<div className="space-y-3">
				{expenses.map((expense) => (
					<DuoCard key={expense.id} variant="default" size="default">
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
									{expense.date.toLocaleDateString("pt-BR")}
								</div>
							</div>
						</div>
					</DuoCard>
				))}
			</div>

			<DuoCard
				variant="default"
				size="default"
				className="mt-4 border-duo-red bg-duo-red/10"
			>
				<div className="flex items-center justify-between">
					<span className="text-sm font-bold text-duo-gray-dark">
						Total de Despesas
					</span>
					<span className="text-xl font-bold text-duo-red">
						R$ {totalExpenses.toLocaleString()}
					</span>
				</div>
			</DuoCard>
		</SectionCard>
	);
}
