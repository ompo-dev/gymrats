import { Suspense } from "react";
import FinancialPage from "./page-content";
import {
  getGymFinancialSummary,
  getGymPayments,
  getGymCoupons,
  getGymReferrals,
  getGymExpenses,
} from "../actions";

export default async function FinancialPageWrapper() {
  const [financialSummary, payments, coupons, referrals, expenses] =
    await Promise.all([
      getGymFinancialSummary(),
      getGymPayments(),
      getGymCoupons(),
      getGymReferrals(),
      getGymExpenses(),
    ]);

  return (
    <FinancialPage
      financialSummary={financialSummary}
      payments={payments}
      coupons={coupons}
      referrals={referrals}
      expenses={expenses}
    />
  );
}
