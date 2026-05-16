import {
	getGymEquipment,
	getGymProfile,
	getGymRecentCheckIns,
	getGymStats,
	getGymStudents,
} from "../actions";
import GymDashboardPage from "./page-content";

export default async function DashboardPage() {
	const [profile, stats, students, equipment, recentCheckIns] =
		await Promise.all([
			getGymProfile(),
			getGymStats(),
			getGymStudents(),
			getGymEquipment(),
			getGymRecentCheckIns(),
		]);

	return (
		<GymDashboardPage
			profile={profile}
			stats={stats}
			students={students}
			equipment={equipment}
			recentCheckIns={recentCheckIns}
		/>
	);
}
