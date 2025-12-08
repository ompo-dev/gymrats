import GymGamificationPage from "./page-content";
import { getGymProfile } from "../actions";

export default async function GamificationPage() {
  const profile = await getGymProfile();

  return <GymGamificationPage profile={profile} />;
}
