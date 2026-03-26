"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginRedirectScreen } from "@/components/screens/public";

/**
 * Página de redirecionamento para /auth/login
 * Esta página foi mantida apenas para evitar erros 404
 * quando o Next.js Router tenta pré-carregar esta rota.
 * Redireciona automaticamente para /welcome
 */
export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/welcome");
  }, [router]);

  return <LoginRedirectScreen />;
}
