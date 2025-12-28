"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Aguardar montagem do componente e rehydrate do Zustand
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Não fazer nada até montar (garantir que Zustand restaurou)
    if (!mounted) return;

    // Verificar token diretamente no localStorage como fonte da verdade
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      const storedUserRole = localStorage.getItem("userRole") as
        | "STUDENT"
        | "GYM"
        | "ADMIN"
        | null;

      // Se há token, está autenticado (independente do estado do Zustand)
      if (token && storedUserRole) {
        if (storedUserRole === "STUDENT" || storedUserRole === "ADMIN") {
          router.push("/student");
          return;
        } else if (storedUserRole === "GYM") {
          router.push("/gym");
          return;
        }
      }
    }

    // Se chegou aqui, não está autenticado ou não tem role válido
    router.push("/welcome");
  }, [router, mounted, isAuthenticated, userRole]);

  return (
    <div className="min-h-screen bg-linear-to-b from-[#58CC02] to-[#47A302] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-xl font-bold">Carregando...</p>
      </div>
    </div>
  );
}
