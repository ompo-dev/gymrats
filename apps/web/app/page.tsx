"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LandingPage } from "@/components/marketing/landing-page";
import { LoadingScreen } from "@/components/organisms/loading-screen";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function validateAndRedirect() {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const response = await apiClient.get<{
          user:
            | { role: "PENDING" | "STUDENT" | "GYM" | "PERSONAL" | "ADMIN" }
            | null;
        }>("/api/auth/session");

        if (response.data.user) {
          const role = response.data.user.role;

          // Redirecionar baseado no role validado no servidor
          if (role === "PENDING") {
            router.push("/auth/register/user-type");
            return;
          }

          if (role === "STUDENT" || role === "ADMIN") {
            router.push("/student");
            return;
          } else if (role === "GYM") {
            router.push("/gym");
            return;
          } else if (role === "PERSONAL") {
            router.push("/personal");
            return;
          }
        }
      } catch (error) {
        // Se falhar, usuário não está autenticado, renderiza a Landing Page
        console.error("[Home] Erro ao validar sessão:", error);
      } finally {
        setIsValidating(false);
      }
    }

    validateAndRedirect();
  }, [router, mounted]);

  if (!mounted || isValidating) {
    return (
      <LoadingScreen.Simple variant="student" message="Iniciando GymRats..." />
    );
  }

  // Se não houver sessão ou falhar a validação, renderiza a Landing Page
  return <LandingPage />;
}
