import StatsPage from "./page-content";
import { getGymStats, getGymEquipment } from "../actions";

export const dynamic = "force-dynamic";

export default async function StatsPageWrapper() {
  const [stats, equipment] = await Promise.all([
    getGymStats(),
    getGymEquipment(),
  ]);

  return <StatsPage stats={stats} equipment={equipment} />;
}
