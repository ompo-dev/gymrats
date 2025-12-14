"use client";

import { AppLayout, TabConfig } from "@/components/app-layout";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { usePathname } from "next/navigation";

interface GymLayoutContentProps {
  children: React.ReactNode;
  initialStats: {
    streak: number;
    xp: number;
    level: number;
    ranking?: number;
  };
}

export function GymLayoutContent({
  children,
  initialStats,
}: GymLayoutContentProps) {
  const pathname = usePathname();

  // Usar valores padrão para evitar problemas de hidratação
  // O nuqs vai atualizar os valores no cliente após a hidratação
  const [studentId] = useQueryState(
    "studentId",
    parseAsString.withDefault(null)
  );
  const [equipmentId] = useQueryState(
    "equipmentId",
    parseAsString.withDefault(null)
  );
  const isInDetailPage = !!studentId || !!equipmentId;

  const isOnboarding =
    typeof pathname === "string" && pathname.includes("/onboarding");

  const gymTabs: TabConfig[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Início" },
    { id: "students", icon: Users, label: "Alunos" },
    { id: "equipment", icon: Dumbbell, label: "Equip." },
    { id: "financial", icon: DollarSign, label: "Finanças" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <AppLayout
      userType="gym"
      tabs={gymTabs}
      defaultTab="dashboard"
      basePath="/gym"
      stats={initialStats}
      showLogo={true}
      shouldDisableSwipe={() => isInDetailPage}
      className="bg-gray-50"
    >
      {children}
    </AppLayout>
  );
}
