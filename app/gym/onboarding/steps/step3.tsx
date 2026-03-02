"use client";

import { motion } from "motion/react";
import { DuoCard, DuoInput } from "@/components/duo";
import type { StepProps } from "./types";

export function Step3({ formData, setFormData }: StepProps) {
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
          <h2 className="mb-2 text-2xl font-bold text-duo-fg">CNPJ</h2>
          <p className="text-sm text-duo-fg-muted">
            Informe o CNPJ da sua academia (opcional)
          </p>
        </div>
        <div className="space-y-5">
          <DuoInput.Simple
            label="CNPJ"
            type="text"
            placeholder="00.000.000/0000-00"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border-2 border-duo-orange/30 bg-duo-orange/5 p-4"
          >
            <p className="text-sm text-duo-fg-muted">
              <strong>Nota:</strong> O CNPJ é opcional, mas recomendado para
              academias que precisam emitir notas fiscais e gerenciar
              financeiramente.
            </p>
          </motion.div>
        </div>
      </DuoCard.Root>
    </motion.div>
  );
}
