import {
  getPersonalAffiliations,
  getPersonalStudents,
} from "../actions";
import { PersonalStudentsRouteWrapper } from "./personal-students-route-wrapper";

export default async function PersonalStudentsPage() {
  const [students, affiliations] = await Promise.all([
    getPersonalStudents(),
    getPersonalAffiliations(),
  ]);

  return (
    <PersonalStudentsRouteWrapper
      students={students}
      affiliations={affiliations}
    />
  );
}
