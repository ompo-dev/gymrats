"use client";

import { motion } from "motion/react";
import { StepCard } from "@/components/molecules/cards/step-card";
import { FormInput } from "@/components/molecules/forms/form-input";
import type { StepProps } from "./types";

export function Step3({ formData, setFormData }: StepProps) {
  return (
    <StepCard
      title="CNPJ"
      description="Informe o CNPJ da sua academia (opcional)"
    >
      <div className="space-y-5">
        <FormInput
          label="CNPJ"
          type="text"
          placeholder="00.000.000/0000-00"
          value={formData.cnpj}
          onChange={(value) =>
            setFormData({ ...formData, cnpj: value as string })
          }
          required={false}
          delay={0.3}
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border-2 border-duo-orange/30 bg-duo-orange/5 p-4"
        >
          <p className="text-sm text-gray-700">
            <strong>Nota:</strong> O CNPJ é opcional, mas recomendado para
            academias que precisam emitir notas fiscais e gerenciar
            financeiramente.
          </p>
        </motion.div>
      </div>
    </StepCard>
  );
}
