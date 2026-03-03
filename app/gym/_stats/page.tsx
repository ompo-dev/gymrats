import { GymStatsPage } from "@/components/organisms/gym/gym-stats";
import { getGymEquipment, getGymStats } from "../actions";

export default async function StatsPageWrapper() {
  const [stats, equipment] = await Promise.all([
    getGymStats(),
    getGymEquipment(),
  ]);

  if (!stats) return null;

  return <GymStatsPage stats={stats} equipment={equipment} />;
}
