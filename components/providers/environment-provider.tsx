"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";
import type { EnvironmentContext } from "@/lib/access-control/types";

interface EnvironmentContextType {
  environment: EnvironmentContext | undefined;
  setEnvironment: (env: EnvironmentContext | undefined) => void;
}

const EnvContext = createContext<EnvironmentContextType | undefined>(undefined);

export function EnvironmentProvider({
  children,
  initialEnv,
}: {
  children: React.ReactNode;
  initialEnv?: EnvironmentContext;
}) {
  const [environment, setEnvironment] = useState<
    EnvironmentContext | undefined
  >(initialEnv);

  return (
    <EnvContext.Provider value={{ environment, setEnvironment }}>
      {children}
    </EnvContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvContext);
  if (context === undefined) {
    // Retornar um default para não quebrar a aplicação caso usado fora
    return { environment: undefined, setEnvironment: () => {} };
  }
  return context;
}
