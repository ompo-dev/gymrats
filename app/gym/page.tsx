import { Suspense } from "react";
import {
	getGymBalanceWithdraws,
	getGymEquipment,
	getGymExpenses,
	getGymFinancialSummary,
	getGymMembershipPlans,
	getGymPayments,
	getGymProfile,
	getGymRecentCheckIns,
	getGymStats,
	getGymStudents,
} from "./actions";
import GymHome from "./page-content";

export default async function GymPage() {
	const [
		profile,
		stats,
		students,
		equipment,
		financialSummary,
		recentCheckIns,
		plans,
		payments,
		expenses,
		balanceWithdraws,
	] = await Promise.all([
		getGymProfile(),
		getGymStats(),
		getGymStudents(),
		getGymEquipment(),
		getGymFinancialSummary(),
		getGymRecentCheckIns(),
		getGymMembershipPlans(),
		getGymPayments(),
		getGymExpenses(),
		getGymBalanceWithdraws(),
	]);

	return (
		<Suspense fallback={<div className="p-4">Carregando...</div>}>
			<GymHome
				initialProfile={profile}
				initialStats={stats}
				initialStudents={students}
				initialEquipment={equipment}
				initialFinancialSummary={financialSummary}
				initialRecentCheckIns={recentCheckIns}
				initialPlans={plans}
				initialPayments={payments}
				initialExpenses={expenses}
				initialBalanceWithdraws={balanceWithdraws}
			/>
		</Suspense>
	);
}
