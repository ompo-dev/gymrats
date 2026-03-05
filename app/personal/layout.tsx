import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { PersonalLayoutContent } from "./layout-content";

export const dynamic = "force-dynamic";

async function PersonalLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
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
