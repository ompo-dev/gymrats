import { featureFlags } from "@gymrats/config";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { getPersonalBootstrapServerRequest } from "@/lib/api/bootstrap-server";
import { createAppQueryClient } from "@/lib/query/create-query-client";
import { queryKeys } from "@/lib/query/query-keys";
import { PersonalLayoutContent } from "./layout-content";

export const dynamic = "force-dynamic";

async function PersonalLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = createAppQueryClient();

  if (featureFlags.perfPersonalBootstrapV2) {
    try {
      await queryClient.fetchQuery({
        queryKey: queryKeys.personalBootstrap(),
        queryFn: () => getPersonalBootstrapServerRequest(),
      });
    } catch {
      // Fallback silencioso para manter o layout utilizavel mesmo sem bootstrap.
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PersonalLayoutContent
        initialStats={{
          streak: 0,
          xp: 0,
          level: 1,
          ranking: 0,
        }}
      >
        {children}
      </PersonalLayoutContent>
    </HydrationBoundary>
  );
}

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingScreenFallback variant="personal" />}>
      <PersonalLayoutWrapper>{children}</PersonalLayoutWrapper>
    </Suspense>
  );
}
