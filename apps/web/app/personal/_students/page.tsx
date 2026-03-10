import {
  getPersonalAffiliations,
  getPersonalStudents,
} from "../actions";
import { GymStudentsPage } from "@/components/organisms/gym/gym-students";

export default async function PersonalStudentsPage() {
  const [students, affiliations] = await Promise.all([
    getPersonalStudents(),
    getPersonalAffiliations(),
  ]);

  return (
    <GymStudentsPage
      students={students}
      variant="personal"
      personalAffiliations={affiliations}
    />
  );
}
