"use client";

import {
  DollarSign,
  Dumbbell,
  LayoutDashboard,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  AppLayout,
  type TabConfig,
} from "@/components/templates/layouts/app-layout";
import { useGym } from "@/hooks/use-gym";
import { useUserSession } from "@/hooks/use-user-session";
import type { GymUnifiedData } from "@/lib/types/gym-unified";

interface GymLayoutContentProps {
  children: React.ReactNode;
  initialBootstrap?: Partial<GymUnifiedData> | null;
  initialStats: {
    streak: number;
    xp: number;
    level: number;
    ranking?: number;
  };
}

export function GymLayoutContent({
  children,
  initialBootstrap,
  initialStats,
}: GymLayoutContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrateInitial } = useGym("actions");
  const isOnboarding =
    typeof pathname === "string" && pathname.includes("/onboarding");
  const { isAdmin, role, isLoading: sessionLoading } = useUserSession();
  const canAccessGym = role === "GYM" || role === "ADMIN" || isAdmin;

  useEffect(() => {
    if (!initialBootstrap) {
      return;
    }

    hydrateInitial(initialBootstrap);
  }, [hydrateInitial, initialBootstrap]);

  useEffect(() => {
    if (sessionLoading) return;

    if (role === "PENDING" && !isOnboarding) {
      router.push("/auth/register/user-type");
      return;
    }
    if (!canAccessGym && role && !isOnboarding) {
      router.push(role === "PERSONAL" ? "/personal" : "/student");
    }
  }, [canAccessGym, role, sessionLoading, router, isOnboarding]);

  if (!sessionLoading && !canAccessGym && role && role !== "PENDING") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-duo-bg">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-duo-fg">Acesso Negado</h1>
          <p className="text-duo-fg-muted">
            Esta area esta disponivel apenas para academias.
          </p>
        </div>
      </div>
    );
  }

  const gymTabs: TabConfig[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Inicio" },
    { id: "students", icon: Users, label: "Alunos" },
    { id: "equipment", icon: Dumbbell, label: "Equip." },
    { id: "financial", icon: DollarSign, label: "Financas" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <AppLayout.Simple
      userType="gym"
      tabs={gymTabs}
      defaultTab="dashboard"
      basePath="/gym"
      stats={initialStats}
      showLogo={true}
      className="bg-duo-bg"
    >
      {children}
    </AppLayout.Simple>
  );
}
