import {
  getPersonalAffiliations,
  getPersonalStudents,
  getPersonalSubscription,
} from "../actions";
import { PersonalFinancialRouteWrapper } from "./personal-financial-route-wrapper";

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
    />
  );
}
