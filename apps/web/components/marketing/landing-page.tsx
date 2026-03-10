"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { GymLandingPage } from "@/components/marketing/gym-landing-page";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { StudentLandingPage } from "@/components/marketing/student-landing-page";

/**
 * Layout da landing: navbar (com toggle Aluno/Academia), conteúdo alternado e footer.
 * Controla qual página é exibida (StudentLandingPage ou GymLandingPage).
 */
export function LandingPage() {
  const [viewMode, setViewMode] = useState<"student" | "gym">("student");

  return (
    <div className="min-h-screen bg-[var(--duo-bg)] text-[var(--duo-fg)] selection:bg-[var(--duo-primary)]/30 selection:text-[var(--duo-primary-dark)]">
      <LandingNavbar viewMode={viewMode} onViewModeChange={setViewMode} />

      <AnimatePresence mode="wait">
        {viewMode === "student" ? (
          <StudentLandingPage key="student" />
        ) : (
          <GymLandingPage key="gym" />
        )}
      </AnimatePresence>

      <LandingFooter />
    </div>
  );
}
