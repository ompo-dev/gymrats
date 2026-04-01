import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { DEFAULT_STUDENT_BOOTSTRAP_SECTIONS } from "@/lib/api/bootstrap-sections";
import { getStudentBootstrapServerRequest } from "@/lib/api/bootstrap-server";
import { createAppQueryClient } from "@/lib/query/create-query-client";
import { queryKeys } from "@/lib/query/query-keys";
import { StudentLayoutContent } from "./layout-content";

async function StudentLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = createAppQueryClient();
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
    const bootstrap = await queryClient.fetchQuery({
      queryKey: queryKeys.studentBootstrap(DEFAULT_STUDENT_BOOTSTRAP_SECTIONS),
      queryFn: () =>
        getStudentBootstrapServerRequest(DEFAULT_STUDENT_BOOTSTRAP_SECTIONS),
    });

    profileData = {
      hasProfile: Boolean(bootstrap.data.profile),
      profile:
        (bootstrap.data.profile as Record<string, unknown> | null) ?? null,
    };
    profileResolved = true;
    progressData = {
      currentStreak:
        (bootstrap.data.progress as { currentStreak?: number } | undefined)
          ?.currentStreak ?? 0,
      totalXP:
        (bootstrap.data.progress as { totalXP?: number } | undefined)
          ?.totalXP ?? 0,
    };
  } catch {
    // Mantemos o layout utilizável mesmo se o prefetch falhar.
    // A hidratação client-side continua responsável por reconciliar os dados.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StudentLayoutContent
        hasProfile={profileData.hasProfile}
        profileResolved={profileResolved}
        initialProgress={{
          streak: progressData.currentStreak,
          xp: progressData.totalXP,
        }}
      >
        {children}
      </StudentLayoutContent>
    </HydrationBoundary>
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
