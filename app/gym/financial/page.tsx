import {
	getGymCoupons,
	getGymExpenses,
	getGymFinancialSummary,
	getGymPayments,
	getGymReferrals,
	getGymSubscription,
	startGymTrial,
} from "../actions";
import FinancialPage from "./page-content";

export default async function FinancialPageWrapper() {
	const [
		financialSummary,
		payments,
		coupons,
		referrals,
		expenses,
		subscription,
	] = await Promise.all([
		getGymFinancialSummary(),
		getGymPayments(),
		getGymCoupons(),
		getGymReferrals(),
		getGymExpenses(),
		getGymSubscription(),
	]);

	if (!financialSummary) return null;

	return (
		<FinancialPage
			financialSummary={financialSummary}
			payments={payments}
			coupons={coupons}
			referrals={referrals}
			expenses={expenses}
			subscription={subscription}
			startTrial={startGymTrial}
		/>
	);
}
