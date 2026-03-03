"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Hook que lê o search param `ref` da URL e salva em cookie gymrats_referral.
 * Deve ser usado nas páginas que recebem links de indicação.
 */
export function useReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    // Salva como cookie por 30 dias para capturar mesmo após login
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `gymrats_referral=${encodeURIComponent(ref)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }, [searchParams]);
}
