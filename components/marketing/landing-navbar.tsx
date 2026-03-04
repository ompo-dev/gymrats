"use client";

import { Building2, Dumbbell, Users } from "lucide-react";
import Link from "next/link";
import { DuoButton, DuoColorPicker } from "@/components/duo";
import { cn } from "@/lib/utils";

export interface LandingNavbarProps {
  viewMode: "student" | "gym";
  onViewModeChange: (mode: "student" | "gym") => void;
}

export function LandingNavbar({
  viewMode,
  onViewModeChange,
}: LandingNavbarProps) {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-[var(--duo-border)]/50 bg-[var(--duo-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--duo-primary)] shadow-lg shadow-[var(--duo-primary)]/20">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-[var(--duo-primary)] uppercase">
            GymRats
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex rounded-2xl bg-[var(--duo-bg-card)] p-1 border-2 border-[var(--duo-border)] shadow-sm scale-90 sm:scale-100">
            <DuoButton
              variant={viewMode === "student" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("student")}
              className="flex items-center gap-2 px-3 sm:px-4 text-[10px] sm:text-xs rounded-xl"
            >
              <Users className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              <span className="hidden xs:inline">ALUNO</span>
            </DuoButton>
            <DuoButton
              variant={viewMode === "gym" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("gym")}
              className="flex items-center gap-2 px-3 sm:px-4 text-[10px] sm:text-xs rounded-xl"
            >
              <Building2 className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              <span className="hidden xs:inline">ACADEMIA</span>
            </DuoButton>
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <DuoColorPicker.Simple compact className="flex items-center" />
          </div>

          <Link href="/welcome">
            <DuoButton variant="primary" size="sm">
              Entrar
            </DuoButton>
          </Link>
        </div>
      </div>
    </nav>
  );
}
