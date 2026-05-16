import { Suspense } from "react";
import {
	getGymEquipment,
	getGymFinancialSummary,
	getGymProfile,
	getGymRecentCheckIns,
	getGymStats,
	getGymStudents,
} from "./actions";
import GymHome from "./page-content";

export default async function GymPage() {
	const [
		profile,
		stats,
		students,
		equipment,
		financialSummary,
		recentCheckIns,
	] = await Promise.all([
		getGymProfile(),
		getGymStats(),
		getGymStudents(),
		getGymEquipment(),
		getGymFinancialSummary(),
		getGymRecentCheckIns(),
	]);

	return (
		<Suspense fallback={<div className="p-4">Carregando...</div>}>
			<GymHome
				initialProfile={profile}
				initialStats={stats}
				initialStudents={students}
				initialEquipment={equipment}
				initialFinancialSummary={financialSummary}
				initialRecentCheckIns={recentCheckIns}
			/>
		</Suspense>
	);
}
