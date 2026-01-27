"use client";

import { motion } from "motion/react";
import { StepCard } from "@/components/molecules/cards/step-card";
import { FormInput } from "@/components/molecules/forms/form-input";
import type { StepProps } from "./types";

export function Step1({ formData, setFormData }: StepProps) {
  return (
    <StepCard
      title="Informações da Academia"
      description="Vamos começar com os dados básicos"
    >
      <div className="space-y-5">
        <FormInput
          label="Nome da Academia"
          type="text"
          placeholder="Ex: Academia Fitness Center"
          value={formData.name}
          onChange={(value) =>
            setFormData({ ...formData, name: value as string })
          }
          required
          delay={0.3}
        />
        <FormInput
          label="Telefone"
          type="tel"
          placeholder="(11) 99999-9999"
          value={formData.phone}
          onChange={(value) =>
            setFormData({ ...formData, phone: value as string })
          }
          required
          delay={0.4}
        />
        <FormInput
          label="E-mail"
          type="email"
          placeholder="contato@academia.com"
          value={formData.email}
          onChange={(value) =>
            setFormData({ ...formData, email: value as string })
          }
          required
          delay={0.5}
        />
      </div>
    </StepCard>
  );
}
