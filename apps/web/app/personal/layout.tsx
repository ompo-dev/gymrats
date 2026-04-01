import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS } from "@/lib/api/bootstrap-sections";
import { getPersonalBootstrapServerRequest } from "@/lib/api/bootstrap-server";
import { createAppQueryClient } from "@/lib/query/create-query-client";
import { queryKeys } from "@/lib/query/query-keys";
import { PersonalLayoutContent } from "./layout-content";

async function PersonalLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = createAppQueryClient();

  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.personalBootstrap(
        DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS,
      ),
      queryFn: () =>
        getPersonalBootstrapServerRequest(DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS),
    });
  } catch {
    // Mantemos o layout utilizavel mesmo se o prefetch falhar.
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
