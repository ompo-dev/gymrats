"use client";

import {
	CreditCard,
	Crown,
	DollarSign,
	Gift,
	type LucideIcon,
	Receipt,
	UsersIcon,
} from "lucide-react";

interface Tab {
	id: string;
	label: string;
	icon: LucideIcon;
}

interface FinancialTabsNavigationProps {
	activeTab: string;
	onTabChange: (tab: string) => void;
}

const tabs: Tab[] = [
	{ id: "overview", label: "Resumo", icon: DollarSign },
	{ id: "payments", label: "Pagamentos", icon: CreditCard },
	{ id: "coupons", label: "Cupons", icon: Gift },
	{ id: "referrals", label: "Indicações", icon: UsersIcon },
	{ id: "expenses", label: "Despesas", icon: Receipt },
	{ id: "subscription", label: "Assinatura", icon: Crown },
];

export function FinancialTabsNavigation({
	activeTab,
	onTabChange,
}: FinancialTabsNavigationProps) {
	return (
		<div className="mb-6 grid grid-cols-5 gap-2">
			{tabs.map((tab) => {
				const Icon = tab.icon;
				const isActive = activeTab === tab.id;
				return (
					<button
						type="button"
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-bold transition-all ${
							isActive
								? "bg-[#FF9600] text-white shadow-md"
								: "bg-white text-duo-gray-dark hover:bg-gray-50"
						}`}
					>
						<Icon className="h-4 w-4 shrink-0" />
						{isActive && (
							<span className="text-center leading-tight">{tab.label}</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
