"use client";

import { parseAsString, useQueryState } from "nuqs";
import { Suspense } from "react";
import { GymMoreMenu } from "@/components/organisms/navigation/gym-more-menu";
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
import { GymDashboardPage } from "./components/gym-dashboard";
import { GymEquipmentPage } from "./components/gym-equipment";
import { GymFinancialPage } from "./components/gym-financial";
import { GymGamificationPage } from "./components/gym-gamification";
import { GymSettingsPage } from "./components/gym-settings";
import { GymStatsPage } from "./components/gym-stats";
import { GymStudentsPage } from "./components/gym-students";

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
	// Usar valor padrão para evitar problemas de SSR
	const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));

	return (
		<div className="px-4 py-6">
			{tab === "dashboard" && initialProfile && initialStats && (
				<GymDashboardPage
					profile={initialProfile}
					stats={initialStats}
					students={initialStudents}
					equipment={initialEquipment}
					recentCheckIns={initialRecentCheckIns}
				/>
			)}
			{tab === "students" && <GymStudentsPage students={initialStudents} />}
			{tab === "equipment" && <GymEquipmentPage equipment={initialEquipment} />}
			{tab === "financial" && (
				<GymFinancialPage
					financialSummary={initialFinancialSummary}
					payments={initialPayments} // Added prop
					expenses={initialExpenses} // Added prop
				/>
			)}
			{tab === "stats" && initialStats && (
				<GymStatsPage stats={initialStats} equipment={initialEquipment} />
			)}
			{tab === "settings" && initialProfile && (
				<GymSettingsPage profile={initialProfile} plans={initialPlans} />
			)}
			{tab === "gamification" && initialProfile && (
				<GymGamificationPage profile={initialProfile} />
			)}
			{tab === "more" && <GymMoreMenu />}
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
