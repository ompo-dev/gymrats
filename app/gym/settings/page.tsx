import { getCurrentUserInfo, getGymProfile } from "../actions";
import { GymSettingsPage } from "../components/gym-settings";

export default async function SettingsPage() {
	const profile = await getGymProfile();
	const userInfo = await getCurrentUserInfo();

	return <GymSettingsPage profile={profile} userInfo={userInfo} />;
}
