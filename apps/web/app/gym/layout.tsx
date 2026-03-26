import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { DEFAULT_GYM_BOOTSTRAP_SECTIONS } from "@/lib/api/bootstrap-sections";
import { getGymBootstrapServerRequest } from "@/lib/api/bootstrap-server";
import { createAppQueryClient } from "@/lib/query/create-query-client";
import { queryKeys } from "@/lib/query/query-keys";
import { GymLayoutContent } from "./layout-content";

export const dynamic = "force-dynamic";

type GymLayoutProfile = {
  gamification?: {
    currentStreak?: number;
    xp?: number;
    level?: number;
    ranking?: number;
  } | null;
};

async function GymLayoutWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createAppQueryClient();

  let profile: GymLayoutProfile | null = null;

  try {
    const bootstrap = await queryClient.fetchQuery({
      queryKey: queryKeys.gymBootstrap(DEFAULT_GYM_BOOTSTRAP_SECTIONS),
      queryFn: () =>
        getGymBootstrapServerRequest(DEFAULT_GYM_BOOTSTRAP_SECTIONS),
    });

    profile = (bootstrap.data.profile as GymLayoutProfile | null) ?? null;
  } catch {
    // Mantemos o layout utilizável mesmo se o prefetch falhar.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GymLayoutContent
        initialStats={{
          streak: profile?.gamification?.currentStreak ?? 0,
          xp: profile?.gamification?.xp ?? 0,
          level: profile?.gamification?.level ?? 1,
          ranking: profile?.gamification?.ranking ?? 0,
        }}
      >
        {children}
      </GymLayoutContent>
    </HydrationBoundary>
  );
}

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreenFallback variant="gym" />}>
      <GymLayoutWrapper>{children}</GymLayoutWrapper>
    </Suspense>
  );
}
