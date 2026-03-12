"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { createAppQueryClient } from "@/lib/query/create-query-client";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => createAppQueryClient() as QueryClient,
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
