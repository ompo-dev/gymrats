import StudentHome from "./page-content";
import {
  getStudentUnits,
  getGymLocations,
  getStudentProgress,
  getStudentSubscription,
} from "./actions";
import { getStudentProfileData } from "./profile/actions";

export default async function StudentPage() {
  const [units, gymLocations, progress, profileData, subscription] =
    await Promise.all([
      getStudentUnits(),
      getGymLocations(),
      getStudentProgress(),
      getStudentProfileData(),
      getStudentSubscription(),
    ]);

  return (
    <StudentHome
      units={units}
      gymLocations={gymLocations}
      initialProgress={{
        currentStreak: progress.currentStreak,
        longestStreak: progress.longestStreak,
        totalXP: progress.totalXP,
        todayXP: progress.todayXP,
      }}
      profileData={profileData}
      subscription={subscription}
    />
  );
}
