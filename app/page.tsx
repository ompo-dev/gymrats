"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, userMode } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (userMode === "student") {
        router.push("/student");
      } else if (userMode === "gym") {
        router.push("/gym");
      } else {
        // Se autenticado mas sem userMode, redirecionar para welcome
        router.push("/welcome");
      }
    } else {
      router.push("/welcome");
    }
  }, [router, isAuthenticated, userMode]);

  return (
    <div className="min-h-screen bg-linear-to-b from-[#58CC02] to-[#47A302] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-xl font-bold">Carregando...</p>
      </div>
    </div>
  );
}
