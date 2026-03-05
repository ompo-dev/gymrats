import { Suspense } from "react";
import { LoadingScreenFallback } from "@/components/organisms/loading-screen-fallback";
import { PersonalLayoutContent } from "./layout-content";

export const dynamic = "force-dynamic";

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingScreenFallback variant="personal" />}>
      <PersonalLayoutContent>{children}</PersonalLayoutContent>
    </Suspense>
  );
}
