import {
  getGymBalanceWithdraws,
  getGymCoupons,
  getGymExpenses,
  getGymFinancialSummary,
  getGymPayments,
  getGymSubscription,
  startGymTrial,
  getGymBoostCampaigns,
  getGymMembershipPlans,
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
    campaigns,
    plans,
  ] = await Promise.all([
    getGymFinancialSummary(),
    getGymPayments(),
    getGymCoupons(),
    getGymExpenses(),
    getGymSubscription(),
    getGymBalanceWithdraws(),
    getGymBoostCampaigns(),
    getGymMembershipPlans(),
  ]);

  if (!financialSummary) return null;

  return (
    <FinancialPage
      financialSummary={financialSummary}
      payments={payments}
      coupons={coupons}
      balanceReais={balanceWithdraws.balanceReais}
      balanceCents={balanceWithdraws.balanceCents}
      withdraws={balanceWithdraws.withdraws as any}
      fakeWithdraw={FAKE_WITHDRAW}
      expenses={expenses}
      subscription={subscription as any}
      startTrial={startGymTrial}
      campaigns={campaigns}
      plans={plans as any}
    />
  );
}
