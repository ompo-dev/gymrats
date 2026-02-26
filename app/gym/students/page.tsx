import { getGymStudents } from "../actions";
import { GymStudentsPage } from "../components/gym-students";

export default async function StudentsPage() {
	const students = await getGymStudents();

	return <GymStudentsPage students={students} />;
}
