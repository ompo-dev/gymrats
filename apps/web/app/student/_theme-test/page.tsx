"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserSession } from "@/hooks/use-user-session";
import {
  AchievementCardsSection,
  CardsSection,
  ColorPickerSection,
  StatCardsSection,
  StatsGridSection,
  TabsSection,
  ThemeTestSection,
} from "./components";

export default function StudentThemeTestPage() {
  const router = useRouter();
  const { isAdmin, role, hasResolvedSession } = useUserSession();
  const userIsAdmin = isAdmin || role === "ADMIN";

  useEffect(() => {
    if (hasResolvedSession && !userIsAdmin) {
      router.replace("/student");
    }
  }, [hasResolvedSession, userIsAdmin, router]);

  if (!hasResolvedSession || !userIsAdmin) {
    return null;
  }

  return (
    <div className="space-y-8 p-4 pb-24">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-[var(--duo-fg)]">
          Teste de Tema
        </h1>
        <Link
          href="/student"
          className="text-sm font-bold text-[var(--duo-primary)] hover:underline"
        >
          ← Voltar
        </Link>
      </div>

      <ColorPickerSection />

      <ThemeTestSection title="Tabs">
        <TabsSection />
      </ThemeTestSection>

      <ThemeTestSection title="Cards">
        <CardsSection />
      </ThemeTestSection>

      <ThemeTestSection title="Stat Cards">
        <StatCardsSection />
      </ThemeTestSection>

      <ThemeTestSection title="Achievement Cards">
        <AchievementCardsSection />
      </ThemeTestSection>

      <ThemeTestSection title="Stats Grid (3 colunas)">
        <StatsGridSection />
      </ThemeTestSection>
    </div>
  );
}
