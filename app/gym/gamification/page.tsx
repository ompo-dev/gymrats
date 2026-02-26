import { getGymProfile } from "../actions";
import { GymGamificationPage } from "../components/gym-gamification";

export default async function GamificationPage() {
	const profile = await getGymProfile();

	if (!profile) return null;

	return <GymGamificationPage profile={profile} />;
}
