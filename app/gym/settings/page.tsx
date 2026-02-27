import { getCurrentUserInfo, getGymProfile } from "../actions";
import { GymSettingsPage } from "@/components/organisms/gym/gym-settings";

export default async function SettingsPage() {
	const profile = await getGymProfile();
	const userInfo = await getCurrentUserInfo();

	if (!profile) return null;

	return (
		<GymSettingsPage
			profile={profile}
			userInfo={{
				isAdmin: userInfo.isAdmin,
				role: userInfo.role ?? null,
			}}
		/>
	);
}
