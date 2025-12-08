import StatsPage from "./page-content";
import { getGymStats, getGymEquipment } from "../actions";

export default async function StatsPageWrapper() {
  const [stats, equipment] = await Promise.all([
    getGymStats(),
    getGymEquipment(),
  ]);

  return <StatsPage stats={stats} equipment={equipment} />;
}
