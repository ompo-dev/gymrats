import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { featureFlags } from "@gymrats/config";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { getStudentBootstrapServerRequest } from "@/lib/api/bootstrap-server";
import { createAppQueryClient } from "@/lib/query/create-query-client";
import { queryKeys } from "@/lib/query/query-keys";
import { getStudentProfile, getStudentProgress } from "./actions";
import { StudentLayoutContent } from "./layout-content";

export const dynamic = "force-dynamic";

async function StudentLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = createAppQueryClient();

  let profileData = { hasProfile: false, profile: null as Record<string, unknown> | null };
  let progressData = {
    currentStreak: 0,
    totalXP: 0,
  };

  if (featureFlags.perfStudentBootstrapV2) {
    try {
      const bootstrap = await queryClient.fetchQuery({
        queryKey: queryKeys.studentBootstrap(),
        queryFn: () => getStudentBootstrapServerRequest(),
      });

      profileData = {
        hasProfile: Boolean(bootstrap.data.profile),
        profile: (bootstrap.data.profile as Record<string, unknown> | null) ?? null,
      };
      progressData = {
        currentStreak:
          (bootstrap.data.progress as { currentStreak?: number } | undefined)
            ?.currentStreak ?? 0,
        totalXP:
          (bootstrap.data.progress as { totalXP?: number } | undefined)
            ?.totalXP ?? 0,
      };
    } catch {
      const [fallbackProfile, fallbackProgress] = await Promise.all([
        getStudentProfile(),
        getStudentProgress(),
      ]);
      profileData = fallbackProfile;
      progressData = {
        currentStreak: fallbackProgress.currentStreak,
        totalXP: fallbackProgress.totalXP,
      };
    }
  } else {
    const [fallbackProfile, fallbackProgress] = await Promise.all([
      getStudentProfile(),
      getStudentProgress(),
    ]);
    profileData = fallbackProfile;
    progressData = {
      currentStreak: fallbackProgress.currentStreak,
      totalXP: fallbackProgress.totalXP,
    };
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StudentLayoutContent
        hasProfile={profileData.hasProfile}
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
