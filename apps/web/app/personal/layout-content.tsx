"use client";

import {
  Building2,
  DollarSign,
  LayoutDashboard,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  AppLayout,
  type TabConfig,
} from "@/components/templates/layouts/app-layout";
import { usePersonal } from "@/hooks/use-personal";
import { useUserSession } from "@/hooks/use-user-session";
import type { PersonalUnifiedData } from "@/lib/types/personal-unified";

interface PersonalLayoutContentProps {
  children: React.ReactNode;
  initialBootstrap?: Partial<PersonalUnifiedData> | null;
  initialStats: {
    streak: number;
    xp: number;
    level: number;
    ranking?: number;
  };
}

export function PersonalLayoutContent({
  children,
  initialBootstrap,
  initialStats,
}: PersonalLayoutContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrateInitial } = usePersonal("actions");
  const lastHydratedBootstrapRef =
    useRef<Partial<PersonalUnifiedData> | null>(null);
  const isOnboarding =
    typeof pathname === "string" && pathname.includes("/onboarding");
  const { isAdmin, role, isLoading: sessionLoading } = useUserSession();
  const canAccessPersonal = role === "PERSONAL" || role === "ADMIN" || isAdmin;

  useEffect(() => {
    if (
      !initialBootstrap ||
      lastHydratedBootstrapRef.current === initialBootstrap
    ) {
      return;
    }

    lastHydratedBootstrapRef.current = initialBootstrap;
    hydrateInitial(initialBootstrap);
  }, [hydrateInitial, initialBootstrap]);

  useEffect(() => {
    if (sessionLoading) return;

    if (role === "PENDING" && !isOnboarding) {
      router.push("/auth/register/user-type");
      return;
    }

    if (!canAccessPersonal && role && !isOnboarding) {
      router.push(role === "GYM" ? "/gym" : "/student");
    }
  }, [canAccessPersonal, role, sessionLoading, router, isOnboarding]);

  if (!sessionLoading && !canAccessPersonal && role && role !== "PENDING") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-duo-bg">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-duo-fg">Acesso Negado</h1>
          <p className="text-duo-fg-muted">
            Esta area esta disponivel apenas para personais.
          </p>
        </div>
      </div>
    );
  }

  if (isOnboarding) {
    return <>{children}</>;
  }

  const personalTabs: TabConfig[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Inicio" },
    { id: "students", icon: Users, label: "Alunos" },
    { id: "gyms", icon: Building2, label: "Academias" },
    { id: "financial", icon: DollarSign, label: "Financas" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  return (
    <AppLayout.Simple
      userType="personal"
      tabs={personalTabs}
      defaultTab="dashboard"
      basePath="/personal"
      stats={initialStats}
      showLogo={true}
      className="bg-duo-bg"
    >
      {children}
    </AppLayout.Simple>
  );
}
