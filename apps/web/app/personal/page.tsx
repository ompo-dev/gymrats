import {
  getPersonalAffiliations,
  getPersonalProfile,
  getPersonalStudentAssignments,
  getPersonalSubscription,
  getPersonalFinancialSummary,
  getPersonalPayments,
  getPersonalCoupons,
  getPersonalExpenses,
  getPersonalBoostCampaigns,
  getPersonalMembershipPlans,
} from "./actions";
import PersonalHome from "./page-content";

export default async function PersonalPage() {
  const [
    profile,
    affiliations,
    students,
    subscription,
    financialSummary,
    payments,
    coupons,
    expenses,
    campaigns,
    plans,
  ] = await Promise.all([
    getPersonalProfile(),
    getPersonalAffiliations(),
    getPersonalStudentAssignments(),
    getPersonalSubscription(),
    getPersonalFinancialSummary(),
    getPersonalPayments(),
    getPersonalCoupons(),
    getPersonalExpenses(),
    getPersonalBoostCampaigns(),
    getPersonalMembershipPlans(),
  ]);

  return (
    <PersonalHome
      initialProfile={profile}
      initialAffiliations={affiliations}
      initialStudents={students}
      initialSubscription={subscription}
      initialFinancialSummary={financialSummary}
      initialPayments={payments}
      initialCoupons={coupons}
      initialExpenses={expenses}
      initialCampaigns={campaigns}
      initialPlans={plans}
    />
  );
}
