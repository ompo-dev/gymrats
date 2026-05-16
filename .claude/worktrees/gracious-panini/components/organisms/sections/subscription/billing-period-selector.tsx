"use client";

import { DuoCard } from "@/components/molecules/cards/duo-card";
import { cn } from "@/lib/utils";

interface BillingPeriodSelectorProps {
	selectedPeriod: "monthly" | "annual";
	onSelect: (period: "monthly" | "annual") => void;
	monthlyLabel: string;
	annualLabel: string;
	perMonth: string;
	perYear: string;
	annualDiscount: number;
}

export function BillingPeriodSelector({
	selectedPeriod,
	onSelect,
	monthlyLabel,
	annualLabel,
	perMonth,
	perYear,
	annualDiscount,
}: BillingPeriodSelectorProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			<DuoCard
				variant={selectedPeriod === "monthly" ? "highlighted" : "default"}
				size="md"
				className={cn(
					"cursor-pointer transition-all",
					selectedPeriod === "monthly"
						? "border-duo-green bg-duo-green/10"
						: "hover:border-duo-green/50",
				)}
				onClick={() => onSelect("monthly")}
			>
				<div className="mb-2 text-lg font-bold text-duo-text">
					{monthlyLabel}
				</div>
				<div className="text-xs text-duo-gray-dark">{perMonth}</div>
			</DuoCard>

			<DuoCard
				variant={selectedPeriod === "annual" ? "highlighted" : "default"}
				size="md"
				className={cn(
					"cursor-pointer transition-all relative",
					selectedPeriod === "annual"
						? "border-duo-green bg-duo-green/10"
						: "hover:border-duo-green/50",
				)}
				onClick={() => onSelect("annual")}
			>
				<span className="absolute -top-2 right-2 rounded-full bg-duo-yellow px-2 py-0.5 text-xs font-bold">
					Economize {annualDiscount}%
				</span>
				<div className="mb-2 text-lg font-bold text-duo-text">
					{annualLabel}
				</div>
				<div className="text-xs text-duo-gray-dark">{perYear}</div>
			</DuoCard>
		</div>
	);
}
