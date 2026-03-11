"use client";

import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { DuoButton } from "@/components/duo";

export function LandingFooter() {
  return (
    <footer className="mt-16 md:mt-24 mb-8 md:mb-12 border-t border-[var(--duo-border)] bg-[var(--duo-bg-card)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--duo-primary)] shadow-lg shadow-[var(--duo-primary)]/20">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[var(--duo-primary)] uppercase">
                GymRats
              </span>
              <p className="text-[var(--duo-fg-muted)] text-sm font-medium mt-0.5">
                Evolua seu corpo. Domine a técnica.
              </p>
            </div>
          </div>
          <Link href="/welcome" className="sm:ml-auto">
            <DuoButton
              variant="primary"
              size="sm"
              className="w-fit font-black uppercase tracking-wider"
            >
              Começar agora
            </DuoButton>
          </Link>
        </div>

        <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-[var(--duo-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-[var(--duo-fg-muted)]">
            © 2026 GymRats. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs font-bold text-[var(--duo-fg-muted)] hover:text-[var(--duo-primary)] transition-colors"
            >
              Termos
            </a>
            <a
              href="#"
              className="text-xs font-bold text-[var(--duo-fg-muted)] hover:text-[var(--duo-primary)] transition-colors"
            >
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
