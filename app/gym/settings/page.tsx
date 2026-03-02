import { GymSettingsPage } from "@/components/organisms/gym/gym-settings";
import { getCurrentUserInfo, getGymProfile } from "../actions";

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
