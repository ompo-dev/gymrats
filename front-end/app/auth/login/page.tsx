"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Página de redirecionamento para /auth/login
 * Esta página foi mantida apenas para evitar erros 404
 * quando o Next.js Router tenta pré-carregar esta rota.
 * Redireciona automaticamente para /welcome
 */
export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar imediatamente para /welcome
    router.replace("/welcome");
  }, [router]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}
