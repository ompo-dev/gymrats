import { featureFlags } from "@gymrats/config";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { getGymBootstrapServerRequest } from "@/lib/api/bootstrap-server";
import { DEFAULT_GYM_BOOTSTRAP_SECTIONS } from "@/lib/api/bootstrap-sections";
import { createAppQueryClient } from "@/lib/query/create-query-client";
import { queryKeys } from "@/lib/query/query-keys";
import { getGymProfile } from "./actions";
import { GymLayoutContent } from "./layout-content";

export const dynamic = "force-dynamic";

async function GymLayoutWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createAppQueryClient();

  let profile = null as Awaited<ReturnType<typeof getGymProfile>>;

  if (featureFlags.perfGymBootstrapV2) {
    try {
      const bootstrap = await queryClient.fetchQuery({
        queryKey: queryKeys.gymBootstrap(DEFAULT_GYM_BOOTSTRAP_SECTIONS),
        queryFn: () =>
          getGymBootstrapServerRequest(DEFAULT_GYM_BOOTSTRAP_SECTIONS),
      });

      profile =
        (bootstrap.data.profile as Awaited<ReturnType<typeof getGymProfile>>) ??
        null;
    } catch {
      profile = await getGymProfile();
    }
  } else {
    profile = await getGymProfile();
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
