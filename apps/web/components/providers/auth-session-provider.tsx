"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuthStore } from "@/stores";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const ensureSession = useAuthStore((state) => state.ensureSession);

  useEffect(() => {
    void ensureSession();
  }, [ensureSession]);

  return children;
}
