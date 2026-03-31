import {
  getPersonalAffiliations,
  getPersonalBoostCampaigns,
  getPersonalCoupons,
  getPersonalExpenses,
  getPersonalFinancialSummary,
  getPersonalMembershipPlans,
  getPersonalPayments,
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
    campaigns,
    plans,
  ] = await Promise.all([
    getPersonalSubscription(),
    getPersonalStudentAssignments(),
    getPersonalAffiliations(),
    getPersonalFinancialSummary(),
    getPersonalPayments(),
    getPersonalCoupons(),
    getPersonalExpenses(),
    getPersonalBoostCampaigns(),
    getPersonalMembershipPlans(),
  ]);

  if (!financialSummary) return null;

  return (
    <PersonalFinancialRouteWrapper
      subscription={subscription}
      students={students}
      affiliations={affiliations}
      payments={payments}
      coupons={coupons}
      campaigns={campaigns}
      plans={plans}
      expenses={expenses}
      financialSummary={financialSummary}
    />
  );
}
