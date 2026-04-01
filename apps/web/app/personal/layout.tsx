import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS } from "@/lib/api/bootstrap-sections";
import { readPersonalBootstrap } from "@/lib/actions/bootstrap-readers";
import type { PersonalUnifiedData } from "@/lib/types/personal-unified";
import { PersonalLayoutContent } from "./layout-content";

async function PersonalLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialBootstrap: Partial<PersonalUnifiedData> | null = null;

  try {
    const bootstrap = await readPersonalBootstrap(DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS);
    initialBootstrap = bootstrap.data ?? null;
  } catch {
    // Mantemos o layout utilizável mesmo se o bootstrap falhar.
  }

  return (
    <PersonalLayoutContent
      initialBootstrap={initialBootstrap}
      initialStats={{
        streak: 0,
        xp: 0,
        level: 1,
        ranking: 0,
      }}
    >
      {children}
    </PersonalLayoutContent>
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
