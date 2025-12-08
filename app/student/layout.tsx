import { Suspense } from "react";
import { SwipeDirectionProvider } from "@/contexts/swipe-direction";
import { StudentLayoutContent } from "./layout-content";
import { getStudentProfile, getStudentProgress } from "./actions";

export const dynamic = "force-dynamic";

async function StudentLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profileData, progressData] = await Promise.all([
    getStudentProfile(),
    getStudentProgress(),
  ]);

  return (
    <StudentLayoutContent
      hasProfile={profileData.hasProfile}
      initialProgress={{
        streak: progressData.currentStreak,
        xp: progressData.totalXP,
      }}
    >
      {children}
    </StudentLayoutContent>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SwipeDirectionProvider>
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-4xl">💪</div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          </div>
        }
      >
        <StudentLayoutWrapper>{children}</StudentLayoutWrapper>
      </Suspense>
    </SwipeDirectionProvider>
  );
}
