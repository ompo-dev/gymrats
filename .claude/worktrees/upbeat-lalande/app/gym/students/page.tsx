import { getGymStudents } from "../actions";
import GymStudentsPage from "./page-content";

export default async function StudentsPage() {
	const students = await getGymStudents();

	return <GymStudentsPage students={students} />;
}
