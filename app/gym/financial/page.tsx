import {
	getGymBalanceWithdraws,
	getGymCoupons,
	getGymExpenses,
	getGymFinancialSummary,
	getGymPayments,
	getGymSubscription,
	startGymTrial,
} from "../actions";
import FinancialPage from "./page-content";

/** Em dev (AbacatePay dev mode) saque só persiste no DB. Remover para produção. */
const FAKE_WITHDRAW = process.env.NEXT_PUBLIC_FAKE_WITHDRAW !== "false";

export default async function FinancialPageWrapper() {
	const [
		financialSummary,
		payments,
		coupons,
		expenses,
		subscription,
		balanceWithdraws,
	] = await Promise.all([
		getGymFinancialSummary(),
		getGymPayments(),
		getGymCoupons(),
		getGymExpenses(),
		getGymSubscription(),
		getGymBalanceWithdraws(),
	]);

	if (!financialSummary) return null;

	return (
		<FinancialPage
			financialSummary={financialSummary}
			payments={payments}
			coupons={coupons}
			balanceReais={balanceWithdraws.balanceReais}
			balanceCents={balanceWithdraws.balanceCents}
			withdraws={balanceWithdraws.withdraws}
			fakeWithdraw={FAKE_WITHDRAW}
			expenses={expenses}
			subscription={subscription}
			startTrial={startGymTrial}
		/>
	);
}
