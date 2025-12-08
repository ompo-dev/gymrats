import { Suspense } from "react";
import GymStudentsPage from "./page-content";
import { getGymStudents } from "../actions";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await getGymStudents();

  return <GymStudentsPage students={students} />;
}
