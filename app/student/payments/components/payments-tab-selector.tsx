"use client";

import { Wallet } from "lucide-react";
import { DuoCard, DuoSelect } from "@/components/duo";
import type { PaymentsTab } from "../hooks/use-payments-page";

const TAB_OPTIONS = [
	{ value: "memberships", label: "Academias", emoji: "🏢" },
	{ value: "payments", label: "Histórico", emoji: "📅" },
	{ value: "subscription", label: "Assinatura", emoji: "👑" },
];

export interface PaymentsTabSelectorProps {
	activeTab: PaymentsTab;
	onTabChange: (tab: PaymentsTab) => void;
}

export function PaymentsTabSelector({
	activeTab,
	onTabChange,
}: PaymentsTabSelectorProps) {
	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<Wallet
						className="h-5 w-5 shrink-0"
						style={{ color: "var(--duo-secondary)" }}
						aria-hidden
					/>
					<h2 className="font-bold text-[var(--duo-fg)]">Selecione a Categoria</h2>
				</div>
			</DuoCard.Header>
			<DuoSelect.Simple
				options={TAB_OPTIONS}
				value={activeTab}
				onChange={(value) => onTabChange(value as PaymentsTab)}
				placeholder="Selecione a categoria"
			/>
		</DuoCard.Root>
	);
}
