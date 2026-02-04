"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import type {
	Coupon,
	Expense,
	FinancialSummary,
	Payment,
	Referral,
} from "@/lib/types";
import { FinancialCouponsTab } from "../components/financial/financial-coupons-tab";
import { FinancialExpensesTab } from "../components/financial/financial-expenses-tab";
import { FinancialOverviewTab } from "../components/financial/financial-overview-tab";
import { FinancialPaymentsTab } from "../components/financial/financial-payments-tab";
import { FinancialReferralsTab } from "../components/financial/financial-referrals-tab";
import { FinancialSubscriptionTab } from "../components/financial/financial-subscription-tab";
import { FinancialTabsNavigation } from "../components/financial/financial-tabs-navigation";

interface FinancialPageProps {
	financialSummary: FinancialSummary;
	payments: Payment[];
	coupons: Coupon[];
	referrals: Referral[];
	expenses: Expense[];
	subscription?: {
		id: string;
		plan: string;
		status: string;
		basePrice: number;
		pricePerStudent: number;
		currentPeriodStart: Date;
		currentPeriodEnd: Date;
		cancelAtPeriodEnd: boolean;
		canceledAt: Date | null;
		trialStart: Date | null;
		trialEnd: Date | null;
		isTrial: boolean;
		daysRemaining: number | null;
		activeStudents: number;
		totalAmount: number;
	} | null;
	startTrial?: () => Promise<{ error?: string; success?: boolean }>;
}

export default function FinancialPage({
	financialSummary,
	payments,
	coupons,
	referrals,
	expenses,
	subscription: initialSubscription,
}: FinancialPageProps) {
	const [view, setView] = useQueryState(
		"view",
		parseAsString.withDefault("overview"),
	);
	const [subTab, setSubTab] = useQueryState(
		"subTab",
		parseAsString.withDefault("overview"),
	);
	type ViewMode =
		| "overview"
		| "payments"
		| "coupons"
		| "referrals"
		| "expenses"
		| "subscription";
	const [viewMode, setViewMode] = useState<ViewMode>(
		(subTab || view || "overview") as ViewMode,
	);

	useEffect(() => {
		if (subTab) {
			setViewMode(
				subTab as
					| "overview"
					| "payments"
					| "coupons"
					| "referrals"
					| "expenses"
					| "subscription",
			);
		} else if (view) {
			setViewMode(
				view as
					| "overview"
					| "payments"
					| "coupons"
					| "referrals"
					| "expenses"
					| "subscription",
			);
		}
	}, [subTab, view]);

	const handleTabChange = (tab: string) => {
		const newViewMode = tab as
			| "overview"
			| "payments"
			| "coupons"
			| "referrals"
			| "expenses"
			| "subscription";
		setViewMode(newViewMode);
		setView(newViewMode);
		setSubTab(newViewMode);
	};

	return (
		<div className="container px-4 py-6">
			<div className="mb-6">
				<h1 className="mb-2 text-2xl font-black text-duo-gray-darkest">
					Gestão Financeira
				</h1>
				<p className="text-sm text-duo-gray-dark">
					Controle completo de receitas e despesas
				</p>
			</div>

			<FinancialTabsNavigation
				activeTab={viewMode}
				onTabChange={handleTabChange}
			/>

			{viewMode === "overview" && (
				<FinancialOverviewTab
					financialSummary={financialSummary}
					payments={payments}
				/>
			)}

			{viewMode === "payments" && <FinancialPaymentsTab payments={payments} />}

			{viewMode === "coupons" && <FinancialCouponsTab coupons={coupons} />}

			{viewMode === "referrals" && (
				<FinancialReferralsTab referrals={referrals} />
			)}

			{viewMode === "expenses" && <FinancialExpensesTab expenses={expenses} />}

			{viewMode === "subscription" && (
				<FinancialSubscriptionTab
					subscription={initialSubscription || undefined}
				/>
			)}
		</div>
	);
}
