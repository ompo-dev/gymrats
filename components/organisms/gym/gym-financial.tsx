"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import type { Coupon, Expense, FinancialSummary, Payment } from "@/lib/types";
import { FinancialCouponsTab } from "./financial/financial-coupons-tab";
import { FinancialExpensesTab } from "./financial/financial-expenses-tab";
import { FinancialOverviewTab } from "./financial/financial-overview-tab";
import { FinancialPaymentsTab } from "./financial/financial-payments-tab";
import { FinancialSubscriptionTab } from "./financial/financial-subscription-tab";
import { FinancialTabsNavigation } from "./financial/financial-tabs-navigation";

interface GymFinancialPageProps {
	financialSummary: FinancialSummary | null;
	payments?: Payment[];
	coupons?: Coupon[];
	expenses?: Expense[];
	balanceReais?: number;
	balanceCents?: number;
	withdraws?: {
		id: string;
		amount: number;
		pixKey: string;
		pixKeyType: string;
		externalId: string;
		status: string;
		createdAt: Date;
		completedAt: Date | null;
	}[];
	subscription?: {
		id: string;
		plan: string;
		status: string;
		basePrice?: number;
		pricePerStudent?: number;
		currentPeriodStart?: Date;
		currentPeriodEnd: Date;
		cancelAtPeriodEnd?: boolean;
		canceledAt?: Date | null;
		trialStart?: Date | null;
		trialEnd?: Date | null;
		isTrial?: boolean;
		daysRemaining?: number | null;
		activeStudents?: number;
		totalAmount?: number;
	} | null;
}

type FinancialViewMode =
	| "overview"
	| "payments"
	| "coupons"
	| "expenses"
	| "subscription";

export function GymFinancialPage({
	financialSummary,
	payments = [],
	coupons = [],
	expenses = [],
	balanceReais = 0,
	balanceCents = 0,
	withdraws = [],
	subscription,
}: GymFinancialPageProps) {
	const [subTab, setSubTab] = useQueryState(
		"subTab",
		parseAsString.withDefault("overview"),
	);
	const [viewMode, setViewMode] = useState<FinancialViewMode>("overview");

	useEffect(() => {
		if (subTab && subTab !== "referrals") {
			setViewMode(subTab as FinancialViewMode);
		}
	}, [subTab]);

	const handleTabChange = (tab: string) => {
		const mode = (tab === "referrals" ? "overview" : tab) as FinancialViewMode;
		setViewMode(mode);
		setSubTab(mode);
	};

	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
			<FadeIn>
				<div className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-duo-text">
						Gestão Financeira
					</h1>
					<p className="text-sm text-duo-gray-dark">
						Controle completo de receitas e despesas
					</p>
				</div>
			</FadeIn>

			<SlideIn delay={0.1}>
				<FinancialTabsNavigation
					activeTab={viewMode}
					onTabChange={handleTabChange}
				/>
			</SlideIn>

			{viewMode === "overview" && financialSummary && (
				<FinancialOverviewTab
					financialSummary={financialSummary}
					payments={payments}
					subscription={subscription}
					balanceReais={balanceReais}
					balanceCents={balanceCents}
					withdraws={withdraws}
				/>
			)}

			{viewMode === "payments" && (
				<FinancialPaymentsTab payments={payments} />
			)}

			{viewMode === "coupons" && (
				<FinancialCouponsTab coupons={coupons} />
			)}

			{viewMode === "expenses" && (
				<FinancialExpensesTab expenses={expenses} />
			)}

			{viewMode === "subscription" && (
				<FinancialSubscriptionTab
					subscription={
						subscription
							? {
									id: subscription.id,
									plan: subscription.plan,
									status: subscription.status,
									basePrice: subscription.basePrice ?? 0,
									pricePerStudent: subscription.pricePerStudent ?? 0,
									currentPeriodStart: subscription.currentPeriodStart ?? subscription.currentPeriodEnd,
									currentPeriodEnd: subscription.currentPeriodEnd,
									cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
									canceledAt: subscription.canceledAt ?? null,
									trialStart: subscription.trialStart ?? null,
									trialEnd: subscription.trialEnd ?? null,
									isTrial: subscription.isTrial ?? false,
									daysRemaining: subscription.daysRemaining ?? null,
									activeStudents: subscription.activeStudents ?? 0,
									totalAmount: subscription.totalAmount ?? 0,
								}
							: undefined
					}
				/>
			)}
		</div>
	);
}
