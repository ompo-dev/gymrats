import {
  getPersonalAffiliations,
  getPersonalCoupons,
  getPersonalExpenses,
  getPersonalFinancialSummary,
  getPersonalStudentAssignments,
  getPersonalSubscription,
} from "../actions";
import { PersonalFinancialRouteWrapper } from "./personal-financial-route-wrapper";

export default async function PersonalFinancialPage() {
  const [
    subscription,
    students,
    affiliations,
    financialSummary,
    payments,
    coupons,
    expenses,
  ] = await Promise.all([
    getPersonalSubscription(),
    getPersonalStudentAssignments(),
    getPersonalAffiliations(),
    getPersonalFinancialSummary(),
    Promise.resolve([]),
    getPersonalCoupons(),
    getPersonalExpenses(),
  ]);

  if (!financialSummary) return null;

  return (
    <PersonalFinancialRouteWrapper
      subscription={subscription}
      students={students}
      affiliations={affiliations}
      payments={payments}
      coupons={coupons}
      campaigns={[]}
      plans={[]}
      expenses={expenses}
      financialSummary={financialSummary}
      balanceReais={0}
      balanceCents={0}
      withdraws={[]}
    />
  );
}
