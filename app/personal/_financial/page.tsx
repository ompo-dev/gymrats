import {
  getPersonalAffiliations,
  getPersonalStudents,
  getPersonalSubscription,
} from "../actions";
import { PersonalFinancialRouteWrapper } from "./personal-financial-route-wrapper";

const EMPTY_FINANCIAL_SUMMARY = {
  totalRevenue: 0,
  totalExpenses: 0,
  netProfit: 0,
  monthlyRecurring: 0,
  pendingPayments: 0,
  overduePayments: 0,
  averageTicket: 0,
  churnRate: 0,
  revenueGrowth: 0,
};

export default async function PersonalFinancialPage() {
  const [subscription, students, affiliations] = await Promise.all([
    getPersonalSubscription(),
    getPersonalStudents(),
    getPersonalAffiliations(),
  ]);

  return (
    <PersonalFinancialRouteWrapper
      subscription={subscription}
      students={students}
      affiliations={affiliations}
      payments={[]}
      coupons={[]}
      campaigns={[]}
      plans={[]}
      expenses={[]}
      financialSummary={EMPTY_FINANCIAL_SUMMARY}
      balanceReais={0}
      balanceCents={0}
      withdraws={[]}
    />
  );
}
