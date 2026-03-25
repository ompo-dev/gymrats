"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook que lê o search param `ref` da URL e salva em cookie gymrats_referral.
 * Deve ser usado nas páginas que recebem links de indicação.
 */
export function useReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    // A lógica de indicação agora ocorre no checkout via parâmetros da URL.
    // O cookie foi removido pois usaremos searchParams.
  }, [searchParams]);
}
