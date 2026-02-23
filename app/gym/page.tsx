import { Suspense } from "react";
import {
	getGymEquipment,
	getGymExpenses, // Added import
	getGymFinancialSummary,
	getGymMembershipPlans,
	getGymPayments, // Added import
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
		payments, // Added payments
		expenses, // Added expenses
	] = await Promise.all([
		getGymProfile(),
		getGymStats(),
		getGymStudents(),
		getGymEquipment(),
		getGymFinancialSummary(),
		getGymRecentCheckIns(),
		getGymMembershipPlans(),
		getGymPayments(), // Added fetch
		getGymExpenses(), // Added fetch
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
				initialPayments={payments} // Added prop
				initialExpenses={expenses} // Added prop
			/>
		</Suspense>
	);
}
