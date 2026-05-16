import { getGymEquipment, getGymStats } from "../actions";
import StatsPage from "./page-content";

export default async function StatsPageWrapper() {
	const [stats, equipment] = await Promise.all([
		getGymStats(),
		getGymEquipment(),
	]);

	return <StatsPage stats={stats} equipment={equipment} />;
}
