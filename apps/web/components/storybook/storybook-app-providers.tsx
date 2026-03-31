"use client";

import type { ReactNode } from "react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { DuoThemeProvider } from "@/components/duo";
import { QueryProvider } from "@/components/providers/query-provider";

export function StorybookAppProviders({
  children,
  searchParams,
}: {
  children: ReactNode;
  searchParams?: string | Record<string, string> | URLSearchParams;
}) {
  return (
    <DuoThemeProvider>
      <NuqsTestingAdapter hasMemory searchParams={searchParams}>
        <QueryProvider>
          <div className="min-h-screen bg-[var(--duo-bg)] text-[var(--duo-fg)]">
            {children}
          </div>
        </QueryProvider>
      </NuqsTestingAdapter>
    </DuoThemeProvider>
  );
}
