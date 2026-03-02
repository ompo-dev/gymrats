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
import { useUserSession } from "@/hooks/use-user-session";

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
  const router = useRouter();
  const isOnboarding =
    typeof pathname === "string" && pathname.includes("/onboarding");

  // ✅ SEGURO: Verificar role no servidor
  // ⚠️ IMPORTANTE: Esta validação no cliente é apenas para UX
  // A proteção real deve estar no middleware/proxy.ts
  const { isAdmin, role, isLoading: sessionLoading } = useUserSession();
  const canAccessGym = role === "GYM" || role === "ADMIN" || isAdmin;

  // Redirecionar conforme role (PENDING pode acessar onboarding para explorar)
  useEffect(() => {
    if (sessionLoading) return;

    if (role === "PENDING" && !isOnboarding) {
      router.push("/auth/register/user-type");
      return;
    }
    if (!canAccessGym && role && !isOnboarding) {
      router.push("/student");
    }
  }, [canAccessGym, role, sessionLoading, router, isOnboarding]);

  // Não renderizar nada se não pode acessar
  if (!sessionLoading && !canAccessGym && role && role !== "PENDING") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-duo-bg">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-duo-fg">Acesso Negado</h1>
          <p className="text-duo-fg-muted">
            Esta área está disponível apenas para academias.
          </p>
        </div>
      </div>
    );
  }

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
