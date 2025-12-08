import GymGamificationPage from "./page-content";
import { getGymProfile } from "../actions";

export const dynamic = "force-dynamic";

export default async function GamificationPage() {
  const profile = await getGymProfile();

  return <GymGamificationPage profile={profile} />;
}
