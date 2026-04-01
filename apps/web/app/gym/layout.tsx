import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { DEFAULT_GYM_BOOTSTRAP_SECTIONS } from "@/lib/api/bootstrap-sections";
import { readGymBootstrap } from "@/lib/actions/bootstrap-readers";
import type { GymUnifiedData } from "@/lib/types/gym-unified";
import { GymLayoutContent } from "./layout-content";

type GymLayoutProfile = {
  gamification?: {
    currentStreak?: number;
    xp?: number;
    level?: number;
    ranking?: number;
  } | null;
};

async function GymLayoutWrapper({ children }: { children: React.ReactNode }) {
  let initialBootstrap: Partial<GymUnifiedData> | null = null;
  let profile: GymLayoutProfile | null = null;

  try {
    const bootstrap = await readGymBootstrap(DEFAULT_GYM_BOOTSTRAP_SECTIONS);
    initialBootstrap = bootstrap.data ?? null;
    profile = (initialBootstrap?.profile as GymLayoutProfile | null) ?? null;
  } catch {
    // Mantemos o layout utilizável mesmo se o bootstrap falhar.
  }

  return (
    <GymLayoutContent
      initialBootstrap={initialBootstrap}
      initialStats={{
        streak: profile?.gamification?.currentStreak ?? 0,
        xp: profile?.gamification?.xp ?? 0,
        level: profile?.gamification?.level ?? 1,
        ranking: profile?.gamification?.ranking ?? 0,
      }}
    >
      {children}
    </GymLayoutContent>
  );
}

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreenFallback variant="gym" />}>
      <GymLayoutWrapper>{children}</GymLayoutWrapper>
    </Suspense>
  );
}
