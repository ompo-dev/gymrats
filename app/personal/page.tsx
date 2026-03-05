import {
  getPersonalAffiliations,
  getPersonalProfile,
  getPersonalStudents,
  getPersonalSubscription,
} from "./actions";
import PersonalHome from "./page-content";

export default async function PersonalPage() {
  const [profile, affiliations, students, subscription] = await Promise.all([
    getPersonalProfile(),
    getPersonalAffiliations(),
    getPersonalStudents(),
    getPersonalSubscription(),
  ]);

  return (
    <PersonalHome
      initialProfile={profile}
      initialAffiliations={affiliations}
      initialStudents={students}
      initialSubscription={subscription}
    />
  );
}
