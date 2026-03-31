"use client";

import { motion } from "motion/react";
import { DuoCard } from "@/components/duo";
import type { PersonalStepProps } from "./types";

export function Step2({ formData, setFormData }: PersonalStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <DuoCard.Root
        variant="outlined"
        padding="lg"
        className="border-2 border-duo-border bg-duo-bg-card shadow-2xl backdrop-blur-md"
      >
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-duo-fg">
            Atuação e especialidade
          </h2>
          <p className="text-sm text-duo-fg-muted">
            Conte como você atende seus alunos.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="personal-onboarding-bio"
              className="text-sm font-bold uppercase tracking-wider text-duo-fg-muted"
            >
              Bio
            </label>
            <textarea
              id="personal-onboarding-bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className="min-h-24 w-full rounded-xl border-2 border-duo-border bg-duo-bg-card px-4 py-3 text-base text-duo-fg outline-none focus:border-duo-primary"
              placeholder="Especialidades, experiência e metodologia."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-duo-border p-3">
              <input
                type="checkbox"
                checked={formData.atendimentoPresencial}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    atendimentoPresencial: e.target.checked,
                  })
                }
              />
              <span className="text-sm text-duo-fg">
                Atendimento presencial
              </span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-duo-border p-3">
              <input
                type="checkbox"
                checked={formData.atendimentoRemoto}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    atendimentoRemoto: e.target.checked,
                  })
                }
              />
              <span className="text-sm text-duo-fg">Atendimento remoto</span>
            </label>
          </div>
        </div>
      </DuoCard.Root>
    </motion.div>
  );
}
