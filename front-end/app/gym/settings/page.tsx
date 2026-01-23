import { GymSettingsPage } from "../components/gym-settings";
import { getGymProfile, getCurrentUserInfo } from "../actions";

export default async function SettingsPage() {
  const profile = await getGymProfile();
  const userInfo = await getCurrentUserInfo();

  return <GymSettingsPage profile={profile} userInfo={userInfo} />;
}
