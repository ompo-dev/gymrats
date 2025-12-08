"use client";

import { AppLayout, TabConfig } from "@/components/app-layout";
import { SwipeDirectionProvider } from "@/contexts/swipe-direction";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import { mockGymProfile } from "@/lib/gym-mock-data";
import { Suspense } from "react";
import { parseAsString, useQueryState } from "nuqs";

function GymLayoutContent({ children }: { children: React.ReactNode }) {
  const [studentId] = useQueryState("studentId", parseAsString);
  const [equipmentId] = useQueryState("equipmentId", parseAsString);
  const isInDetailPage = !!studentId || !!equipmentId;

  const gymTabs: TabConfig[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Início" },
    { id: "students", icon: Users, label: "Alunos" },
    { id: "equipment", icon: Dumbbell, label: "Equip." },
    { id: "financial", icon: DollarSign, label: "Finanças" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  return (
    <AppLayout
      userType="gym"
      tabs={gymTabs}
      defaultTab="dashboard"
      basePath="/gym"
      stats={{
        streak: mockGymProfile.gamification.currentStreak,
        xp: mockGymProfile.gamification.xp,
        level: mockGymProfile.gamification.level,
        ranking: mockGymProfile.gamification.ranking,
      }}
      showLogo={true}
      shouldDisableSwipe={() => isInDetailPage}
      className="bg-gray-50"
    >
      {children}
    </AppLayout>
  );
}

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return (
    <SwipeDirectionProvider>
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            Carregando...
          </div>
        }
      >
        <GymLayoutContent>{children}</GymLayoutContent>
      </Suspense>
    </SwipeDirectionProvider>
  );
}
