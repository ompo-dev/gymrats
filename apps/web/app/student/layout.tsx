import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { STUDENT_LAYOUT_BOOTSTRAP_SECTIONS } from "@/lib/api/bootstrap-sections";
import { readStudentBootstrap } from "@/lib/actions/bootstrap-readers";
import { requireProtectedRouteAccess } from "@/lib/auth/server-route-guard";
import type { StudentData } from "@/lib/types/student-unified";
import { StudentLayoutContent } from "./layout-content";

async function StudentLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProtectedRouteAccess("/student");

  let initialBootstrap: Partial<StudentData> | null = null;
  let profileResolved = false;

  let profileData = {
    hasProfile: false,
    profile: null as Record<string, unknown> | null,
  };
  let progressData = {
    currentStreak: 0,
    totalXP: 0,
  };

  try {
    const bootstrap = await readStudentBootstrap(STUDENT_LAYOUT_BOOTSTRAP_SECTIONS);
    initialBootstrap = bootstrap.data ?? null;

    profileData = {
      hasProfile: Boolean(initialBootstrap?.profile),
      profile: (initialBootstrap?.profile as Record<string, unknown> | null) ?? null,
    };
    profileResolved = true;
    progressData = {
      currentStreak: initialBootstrap?.progress?.currentStreak ?? 0,
      totalXP: initialBootstrap?.progress?.totalXP ?? 0,
    };
  } catch {
    // Mantemos o layout utilizável mesmo se o bootstrap falhar.
  }

  return (
    <StudentLayoutContent
      hasProfile={profileData.hasProfile}
      profileResolved={profileResolved}
      initialBootstrap={initialBootstrap}
      initialProgress={{
        streak: progressData.currentStreak,
        xp: progressData.totalXP,
      }}
    >
      {children}
    </StudentLayoutContent>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingScreenFallback variant="student" />}>
      <StudentLayoutWrapper>{children}</StudentLayoutWrapper>
    </Suspense>
  );
}
