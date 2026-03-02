import { GymGamificationPage } from "@/components/organisms/gym/gym-gamification";
import { getGymProfile } from "../actions";

export default async function GamificationPage() {
  const profile = await getGymProfile();

  if (!profile) return null;

  return <GymGamificationPage profile={profile} />;
}
