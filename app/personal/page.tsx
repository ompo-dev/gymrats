import {
  getPersonalAffiliations,
  getPersonalProfile,
  getPersonalStudentAssignments,
  getPersonalSubscription,
} from "./actions";
import PersonalHome from "./page-content";

export default async function PersonalPage() {
  const [profile, affiliations, students, subscription] = await Promise.all([
    getPersonalProfile(),
    getPersonalAffiliations(),
    getPersonalStudentAssignments(),
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
