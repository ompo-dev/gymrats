"use client";

import { AppLayout, TabConfig } from "@/components/templates/layouts/app-layout";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStudent } from "@/hooks/use-student";

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
  
  // Verificar se é admin (versão beta: apenas admin pode acessar /gym)
  const { isAdmin, role } = useStudent("isAdmin", "role");
  const userIsAdmin = isAdmin || role === "ADMIN";
  
  // Bloquear acesso se não for admin
  useEffect(() => {
    if (!userIsAdmin) {
      console.warn("[GymLayoutContent] Acesso negado a /gym. Apenas admin pode acessar na versão beta.");
      router.push("/student");
    }
  }, [userIsAdmin, router]);

  // Usar valores padrão para evitar problemas de hidratação
  // O nuqs vai atualizar os valores no cliente após a hidratação
  const [studentId] = useQueryState("studentId", parseAsString.withDefault(""));
  const [equipmentId] = useQueryState(
    "equipmentId",
    parseAsString.withDefault("")
  );
  const isInDetailPage = !!studentId || !!equipmentId;

  const isOnboarding =
    typeof pathname === "string" && pathname.includes("/onboarding");
  
  // Não renderizar nada se não for admin
  if (!userIsAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Esta área está disponível apenas para administradores durante a versão beta.</p>
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
