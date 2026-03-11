import { GymStudentsPage } from "@/components/organisms/gym/gym-students";
import { getGymStudents } from "../actions";

export default async function StudentsPage() {
  const students = await getGymStudents();

  return <GymStudentsPage students={students} />;
}
