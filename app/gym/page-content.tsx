"use client";

import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect } from "react";
import { GymMoreMenu } from "@/components/organisms/navigation/gym-more-menu";
import { useGymInitializer } from "@/hooks/use-gym-initializer";
import { useGymsList } from "@/hooks/use-gyms-list";
import { useLoadPrioritizedGym } from "@/hooks/use-load-prioritized-gym";
import { useGymUnifiedStore } from "@/stores/gym-unified-store";
import type {
	CheckIn,
	Equipment,
	Expense, // Added
	FinancialSummary,
	GymProfile,
	GymStats,
	MembershipPlan,
	Payment, // Added
	StudentData,
} from "@/lib/types";
import { GymDashboardPage } from "@/components/organisms/gym/gym-dashboard";
import { GymEquipmentPage } from "@/components/organisms/gym/gym-equipment";
import { GymFinancialPage } from "@/components/organisms/gym/gym-financial";
import { GymGamificationPage } from "@/components/organisms/gym/gym-gamification";
import { GymSettingsPage } from "@/components/organisms/gym/gym-settings";
import { GymStatsPage } from "@/components/organisms/gym/gym-stats";
import { GymStudentsPage } from "@/components/organisms/gym/gym-students";

interface GymHomeContentProps {
	initialProfile: GymProfile | null;
	initialStats: GymStats | null;
	initialStudents: StudentData[];
	initialEquipment: Equipment[];
	initialFinancialSummary: FinancialSummary | null;
	initialRecentCheckIns?: CheckIn[];
	initialPlans: MembershipPlan[];
	initialPayments: Payment[]; // Added
	initialExpenses: Expense[]; // Added
}

function GymHomeContent({
	initialProfile,
	initialStats,
	initialStudents,
	initialEquipment,
	initialFinancialSummary,
	initialRecentCheckIns,
	initialPlans,
	initialPayments, // Added
	initialExpenses, // Added
}: GymHomeContentProps) {
	const { activeGymId } = useGymsList();
	const hydrateInitial = useGymUnifiedStore((state) => state.hydrateInitial);
	useGymInitializer();
	useLoadPrioritizedGym({ onlyPriorities: true });

	// Hidratacao inicial vinda do server para evitar tela vazia
	// e permitir transicao para runtime client-driven.
	useEffect(() => {
		if (
			initialProfile ||
			initialStats ||
			initialStudents.length > 0 ||
			initialEquipment.length > 0
		) {
			hydrateInitial({
				profile: initialProfile,
				stats: initialStats,
				students: initialStudents,
				equipment: initialEquipment,
				financialSummary: initialFinancialSummary,
				recentCheckIns: initialRecentCheckIns || [],
				membershipPlans: initialPlans,
				payments: initialPayments,
				expenses: initialExpenses,
			});
		}
	}, [
		hydrateInitial,
		initialProfile,
		initialStats,
		initialStudents,
		initialEquipment,
		initialFinancialSummary,
		initialRecentCheckIns,
		initialPlans,
		initialPayments,
		initialExpenses,
	]);

	const store = useGymUnifiedStore((state) => state.data);

	const profile = store.profile ?? initialProfile;
	const stats = store.stats ?? initialStats;
	const students = store.students.length > 0 ? store.students : initialStudents;
	const equipment = store.equipment.length > 0 ? store.equipment : initialEquipment;
	const financialSummary =
		store.financialSummary ?? initialFinancialSummary;
	const recentCheckIns =
		store.recentCheckIns.length > 0
			? store.recentCheckIns
			: initialRecentCheckIns || [];
	const plans =
		store.membershipPlans.length > 0
			? store.membershipPlans
			: initialPlans;
	const payments = store.payments.length > 0 ? store.payments : initialPayments;
	const expenses = store.expenses.length > 0 ? store.expenses : initialExpenses;

	// Usar valor padrão para evitar problemas de SSR
	const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));

	// key força remount ao trocar academia, evitando estado desatualizado
	return (
		<div key={activeGymId || "gym"} className="px-4 py-6">
			{tab === "dashboard" && profile && stats && (
				<GymDashboardPage
					profile={profile}
					stats={stats}
					students={students}
					equipment={equipment}
					recentCheckIns={recentCheckIns}
				/>
			)}
			{tab === "students" && <GymStudentsPage students={students ?? []} />}
			{tab === "equipment" && <GymEquipmentPage equipment={equipment} />}
			{tab === "financial" && (
				<GymFinancialPage
					financialSummary={financialSummary}
					payments={payments}
					expenses={expenses}
				/>
			)}
			{tab === "stats" && stats && (
				<GymStatsPage stats={stats} equipment={equipment} />
			)}
			{tab === "settings" && profile && (
				<GymSettingsPage profile={profile} plans={plans} />
			)}
			{tab === "gamification" && profile && (
				<GymGamificationPage profile={profile} />
			)}
			{tab === "more" && <GymMoreMenu.Simple />}
		</div>
	);
}

export default function GymHome({
	initialProfile,
	initialStats,
	initialStudents,
	initialEquipment,
	initialFinancialSummary,
	initialRecentCheckIns,
	initialPlans,
	initialPayments, // Added
	initialExpenses, // Added
}: GymHomeContentProps) {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center p-8">
					Carregando...
				</div>
			}
		>
			<GymHomeContent
				initialProfile={initialProfile}
				initialStats={initialStats}
				initialStudents={initialStudents}
				initialEquipment={initialEquipment}
				initialFinancialSummary={initialFinancialSummary}
				initialRecentCheckIns={initialRecentCheckIns}
				initialPlans={initialPlans}
				initialPayments={initialPayments} // Added
				initialExpenses={initialExpenses} // Added
			/>
		</Suspense>
	);
}
