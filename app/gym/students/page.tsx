import { getGymStudents } from "../actions";
import { GymStudentsPage } from "@/components/organisms/gym/gym-students";

export default async function StudentsPage() {
	const students = await getGymStudents();

	return <GymStudentsPage students={students} />;
}
