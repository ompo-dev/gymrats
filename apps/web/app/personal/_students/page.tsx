import { GymStudentsPage } from "@/components/organisms/gym/gym-students";
import { getPersonalAffiliations, getPersonalStudents } from "../actions";

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
