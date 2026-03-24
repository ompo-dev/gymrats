import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { NativeLoadingScreen } from "../../src/components/native-loading-screen";
import {
  fetchStudentProfileStatus,
  generateStudentWorkouts,
  submitStudentOnboarding,
} from "../../src/features/student/api";
import { hasCompletedStudentProfile } from "../../src/features/student/profile-completion";
import {
  createDefaultStudentOnboardingData,
  type StudentOnboardingFormData,
  StudentOnboardingScreen,
} from "../../src/features/student/student-onboarding-screen";
import { refreshAuthSession } from "../../src/lib/auth";
import { useAppStore } from "../../src/store/app-store";

function buildInitialData(
  profileStatus:
    | Awaited<ReturnType<typeof fetchStudentProfileStatus>>
    | null,
): Partial<StudentOnboardingFormData> | null {
  if (!profileStatus) {
    return null;
  }

  return {
    ...createDefaultStudentOnboardingData(),
    age: profileStatus.student?.age ?? "",
    gender:
      (profileStatus.student?.gender as StudentOnboardingFormData["gender"]) ??
      "",
    isTrans: Boolean(profileStatus.student?.isTrans),
    usesHormones: Boolean(profileStatus.student?.usesHormones),
    hormoneType:
      (profileStatus.student?.hormoneType as StudentOnboardingFormData["hormoneType"]) ??
      "",
    height: profileStatus.profile?.height ?? "",
    weight: profileStatus.profile?.weight ?? "",
    fitnessLevel:
      (profileStatus.profile?.fitnessLevel as StudentOnboardingFormData["fitnessLevel"]) ??
      "",
    weeklyWorkoutFrequency: profileStatus.profile?.weeklyWorkoutFrequency ?? 3,
    workoutDuration: profileStatus.profile?.workoutDuration ?? 60,
    goals: Array.isArray(profileStatus.profile?.goals)
      ? (profileStatus.profile?.goals as StudentOnboardingFormData["goals"])
      : [],
    gymType:
      (profileStatus.profile?.gymType as StudentOnboardingFormData["gymType"]) ??
      "",
    preferredSets: profileStatus.profile?.preferredSets ?? 3,
    preferredRepRange:
      (profileStatus.profile?.preferredRepRange as StudentOnboardingFormData["preferredRepRange"]) ??
      "hipertrofia",
    restTime:
      (profileStatus.profile?.restTime as StudentOnboardingFormData["restTime"]) ??
      "medio",
    bmr: profileStatus.profile?.bmr ?? undefined,
    tdee: profileStatus.profile?.tdee ?? undefined,
    targetCalories: profileStatus.profile?.targetCalories ?? undefined,
    targetProtein: profileStatus.profile?.targetProtein ?? undefined,
    targetCarbs: profileStatus.profile?.targetCarbs ?? undefined,
    targetFats: profileStatus.profile?.targetFats ?? undefined,
    activityLevel: profileStatus.profile?.activityLevel ?? 4,
    hormoneTreatmentDuration:
      profileStatus.profile?.hormoneTreatmentDuration ?? undefined,
    physicalLimitations: Array.isArray(profileStatus.profile?.physicalLimitations)
      ? profileStatus.profile!.physicalLimitations
      : [],
    motorLimitations: Array.isArray(profileStatus.profile?.motorLimitations)
      ? profileStatus.profile!.motorLimitations
      : [],
    medicalConditions: Array.isArray(profileStatus.profile?.medicalConditions)
      ? profileStatus.profile!.medicalConditions
      : [],
    limitationDetails: profileStatus.profile?.limitationDetails ?? {},
  };
}

export default function StudentOnboardingRoute() {
  const config = useAppStore((state) => state.config);
  const hydrated = useAppStore((state) => state.hydrated);
  const session = useAppStore((state) => state.session);
  const upsertSession = useAppStore((state) => state.upsertSession);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<Partial<StudentOnboardingFormData> | null>(
    null,
  );

  const supportedRole = useMemo(
    () =>
      session.user?.role === "PENDING" || session.user?.role === "STUDENT",
    [session.user?.role],
  );

  useEffect(() => {
    if (!hydrated || !session.token) {
      return;
    }

    if (session.user?.role !== "STUDENT") {
      setCheckingProfile(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const profileStatus = await fetchStudentProfileStatus({
          apiUrl: config.apiUrl,
          token: session.token!,
        });

        if (cancelled) {
          return;
        }

        if (
          profileStatus.hasProfile &&
          hasCompletedStudentProfile({
            height: profileStatus.profile?.height ?? undefined,
            weight: profileStatus.profile?.weight ?? undefined,
            fitnessLevel: profileStatus.profile?.fitnessLevel ?? undefined,
          })
        ) {
          router.replace("/student");
          return;
        }

        setInitialData(buildInitialData(profileStatus));
      } catch {
        if (!cancelled) {
          setInitialData(createDefaultStudentOnboardingData());
        }
      } finally {
        if (!cancelled) {
          setCheckingProfile(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [config.apiUrl, hydrated, session.token, session.user?.role]);

  if (!hydrated) {
    return <NativeLoadingScreen message="Preparando onboarding..." />;
  }

  if (!session.token || !supportedRole) {
    return <Redirect href="/web" />;
  }

  if (checkingProfile) {
    return <NativeLoadingScreen message="Carregando perfil do aluno..." />;
  }

  return (
    <StudentOnboardingScreen
      initialData={initialData}
      loadingExisting={checkingProfile}
      onBack={() => {
        if (session.user?.role === "PENDING") {
          router.replace({
            pathname: "/web",
            params: {
              path: "/auth/register/user-type",
            },
          });
          return;
        }

        router.replace("/student");
      }}
      onSubmit={async (data) => {
        setSubmitting(true);

        try {
          await submitStudentOnboarding({
            apiUrl: config.apiUrl,
            token: session.token!,
            data,
          });

          const freshSession = await refreshAuthSession(
            config.apiUrl,
            session.token!,
          );
          await upsertSession(freshSession);

          try {
            await generateStudentWorkouts({
              apiUrl: config.apiUrl,
              token: freshSession.session.token,
            });
          } catch {
            // Workout generation can be retried from the learn screen.
          }

          router.replace("/student");
        } catch (error) {
          Alert.alert(
            "Erro",
            error instanceof Error
              ? error.message
              : "Nao foi possivel concluir o onboarding.",
          );
        } finally {
          setSubmitting(false);
        }
      }}
      role={session.user?.role === "PENDING" ? "PENDING" : "STUDENT"}
      submitting={submitting}
    />
  );
}
