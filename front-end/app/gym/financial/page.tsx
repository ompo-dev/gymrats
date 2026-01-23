import { Suspense } from "react";
import FinancialPage from "./page-content";
import {
  getGymFinancialSummary,
  getGymPayments,
  getGymCoupons,
  getGymReferrals,
  getGymExpenses,
  getGymSubscription,
  startGymTrial,
} from "../actions";

export default async function FinancialPageWrapper() {
  const [financialSummary, payments, coupons, referrals, expenses, subscription] =
    await Promise.all([
      getGymFinancialSummary(),
      getGymPayments(),
      getGymCoupons(),
      getGymReferrals(),
      getGymExpenses(),
      getGymSubscription(),
    ]);

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
