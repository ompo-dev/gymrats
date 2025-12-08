import { GymSettingsPage } from "../components/gym-settings";
import { getGymProfile } from "../actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getGymProfile();

  return <GymSettingsPage profile={profile} />;
}
