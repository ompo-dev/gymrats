import { Suspense } from "react";
import { SwipeDirectionProvider } from "@/contexts/swipe-direction";
import { GymLayoutContent } from "./layout-content";
import { getGymProfile } from "./actions";
import { LoadingScreen } from "@/components/organisms/loading-screen";

export const dynamic = "force-dynamic";

async function GymLayoutWrapper({ children }: { children: React.ReactNode }) {
  const profile = await getGymProfile();

  return (
    <GymLayoutContent
      initialStats={{
        streak: profile.gamification.currentStreak,
        xp: profile.gamification.xp,
        level: profile.gamification.level,
        ranking: profile.gamification.ranking,
      }}
    >
      {children}
    </GymLayoutContent>
  );
}

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return (
    <SwipeDirectionProvider>
      <Suspense fallback={<LoadingScreen variant="gym" />}>
        <GymLayoutWrapper>{children}</GymLayoutWrapper>
      </Suspense>
    </SwipeDirectionProvider>
  );
}
