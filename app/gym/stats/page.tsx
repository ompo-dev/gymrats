import { getGymEquipment, getGymStats } from "../actions";
import { GymStatsPage } from "../components/gym-stats";

export default async function StatsPageWrapper() {
	const [stats, equipment] = await Promise.all([
		getGymStats(),
		getGymEquipment(),
	]);

	if (!stats) return null;

	return <GymStatsPage stats={stats} equipment={equipment} />;
}
