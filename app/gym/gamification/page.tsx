import { getGymProfile } from "../actions";
import GymGamificationPage from "./page-content";

export default async function GamificationPage() {
	const profile = await getGymProfile();

	return <GymGamificationPage profile={profile} />;
}
