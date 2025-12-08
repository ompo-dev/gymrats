import { GymSettingsPage } from "../components/gym-settings";
import { getGymProfile } from "../actions";

export default async function SettingsPage() {
  const profile = await getGymProfile();

  return <GymSettingsPage profile={profile} />;
}
