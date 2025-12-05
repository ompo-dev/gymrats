"use client";

import { motion } from "motion/react";
import { StepCard } from "@/components/ui/step-card";
import { OptionSelector } from "@/components/ui/option-selector";
import { FormInput } from "@/components/ui/form-input";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import { StepProps, DifficultyLevel } from "./types";

const STEPS = [
  {
    number: 1,
    title: "Informações Pessoais",
    icon: "👤",
    color: "from-blue-400 to-blue-600",
  },
];

export function Step1({ formData, setFormData }: StepProps) {
  return (
    <StepCard title={STEPS[0].title} description="Vamos conhecer você melhor">
      <div className="space-y-5">
        <FormInput
          label="Idade"
          type="number"
          placeholder="25"
          value={formData.age}
          onChange={(value) =>
            setFormData({ ...formData, age: value as number | "" })
          }
          required
          delay={0.3}
        />
        <FormInput
          label="Altura (cm)"
          type="number"
          placeholder="170"
          value={formData.height}
          onChange={(value) =>
            setFormData({ ...formData, height: value as number | "" })
          }
          required
          delay={0.4}
        />
        <FormInput
          label="Peso (kg)"
          type="number"
          placeholder="70"
          value={formData.weight}
          onChange={(value) =>
            setFormData({ ...formData, weight: value as number | "" })
          }
          required
          delay={0.5}
        />

        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-900">
            Gênero
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "male", label: "Masculino" },
              { value: "trans-male", label: "Trans Masculino" },
              { value: "female", label: "Feminino" },
              { value: "trans-female", label: "Trans Feminino" },
            ].map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.7 + index * 0.1,
                  type: "spring",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  const isTrans = option.value.includes("trans");
                  setFormData({
                    ...formData,
                    gender: option.value as any,
                    isTrans,
                    usesHormones: isTrans ? formData.usesHormones : false,
                    hormoneType: isTrans ? formData.hormoneType : "",
                  });
                }}
                className={`rounded-2xl border-2 py-3 font-bold uppercase tracking-wider transition-all active:shadow-none active:translate-y-[4px] ${
                  formData.gender === option.value
                    ? "border-duo-green bg-duo-green text-white shadow-[0_4px_0_#58A700]"
                    : "border-gray-300 bg-white text-gray-900 shadow-[0_4px_0_#D1D5DB] hover:border-duo-green/50 hover:shadow-[0_4px_0_#9CA3AF]"
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
          {(formData.gender === "trans-male" ||
            formData.gender === "trans-female") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 rounded-xl border-2 border-duo-green/30 bg-duo-green/5 p-4"
            >
              <CustomCheckbox
                checked={formData.usesHormones}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    usesHormones: checked,
                    hormoneType: checked ? formData.hormoneType : "",
                  })
                }
                label="Faço uso de terapia hormonal"
                delay={0.1}
              />
              {formData.usesHormones && (
                <OptionSelector
                  options={[
                    {
                      value: "testosterone",
                      label: "Testosterona",
                    },
                    { value: "estrogen", label: "Estrogênio" },
                  ]}
                  value={formData.hormoneType}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      hormoneType: value as any,
                    })
                  }
                  layout="grid"
                  columns={2}
                  size="sm"
                  showCheck={false}
                  delay={0.2}
                  label="Tipo de hormônio"
                />
              )}
            </motion.div>
          )}
        </div>

        <OptionSelector
          options={[
            { value: "iniciante", label: "Iniciante" },
            { value: "intermediario", label: "Intermediário" },
            { value: "avancado", label: "Avançado" },
          ]}
          value={formData.fitnessLevel}
          onChange={(value) =>
            setFormData({
              ...formData,
              fitnessLevel: value as DifficultyLevel,
            })
          }
          layout="list"
          size="md"
          showCheck={false}
          delay={0.7}
          label="Nível de Experiência"
        />
      </div>
    </StepCard>
  );
}
