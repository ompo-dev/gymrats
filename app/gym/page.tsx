import { Suspense } from "react";
import {
	getGymBalanceWithdraws,
	getGymCoupons,
	getGymEquipment,
	getGymExpenses,
	getGymFinancialSummary,
	getGymMembershipPlans,
	getGymPayments,
	getGymProfile,
	getGymRecentCheckIns,
	getGymStats,
	getGymStudents,
	getGymSubscription,
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
		coupons,
		subscription,
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
		getGymCoupons(),
		getGymSubscription(),
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
				initialCoupons={coupons}
				initialSubscription={subscription}
			/>
		</Suspense>
	);
}
