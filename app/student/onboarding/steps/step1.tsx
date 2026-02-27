"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import { type step1Schema, validateStep1 } from "../schemas";
import type { DifficultyLevel, OnboardingData, StepProps } from "./types";

export function Step1({ formData, setFormData, forceValidation }: StepProps) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof z.infer<typeof step1Schema>, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof z.infer<typeof step1Schema>, boolean>>
  >({});

  // Valida apenas campos que foram tocados ou quando tenta avançar
  const validateField = (field: keyof z.infer<typeof step1Schema>) => {
    const validation = validateStep1({
      age: typeof formData.age === "number" ? formData.age : undefined,
      gender: formData.gender || undefined,
      isTrans: formData.isTrans,
      usesHormones: formData.usesHormones,
      hormoneType: formData.hormoneType || undefined,
      height: typeof formData.height === "number" ? formData.height : undefined,
      weight: typeof formData.weight === "number" ? formData.weight : undefined,
      fitnessLevel: formData.fitnessLevel || undefined,
    });

    if (!validation.success) {
      const fieldError = validation.error.errors.find(
        (err) => err.path[0] === field,
      );
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Marca todos os campos como touched quando forceValidation é true
  useEffect(() => {
    if (forceValidation) {
      setTouched({
        age: true,
        height: true,
        weight: true,
        gender: true,
        fitnessLevel: true,
      });
    }
  }, [forceValidation]);

  // Valida apenas campos que foram tocados
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const validation = validateStep1({
        age: typeof formData.age === "number" ? formData.age : undefined,
        gender: formData.gender || undefined,
        isTrans: formData.isTrans,
        usesHormones: formData.usesHormones,
        hormoneType: formData.hormoneType || undefined,
        height:
          typeof formData.height === "number" ? formData.height : undefined,
        weight:
          typeof formData.weight === "number" ? formData.weight : undefined,
        fitnessLevel: formData.fitnessLevel || undefined,
      });

      if (!validation.success) {
        const fieldErrors: typeof errors = {};
        validation.error.errors.forEach((err) => {
          const path = err.path[0] as keyof typeof fieldErrors;
          if (path && touched[path]) {
            fieldErrors[path] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({});
      }
    }
  }, [formData, touched]);

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
            Informações Pessoais
          </h2>
          <p className="text-sm text-duo-fg-muted">
            Vamos conhecer você melhor
          </p>
        </div>
        <div className="space-y-5">
        <DuoInput.Simple
          label="Idade *"
          type="text"
          inputMode="numeric"
          placeholder="25"
          value={formData.age === undefined ? "" : formData.age}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || v === "-") {
              setFormData({ ...formData, age: "" });
              return;
            }
            const n = parseFloat(v);
            if (!Number.isNaN(n)) {
              const clamped = Math.min(120, Math.max(13, n));
              setFormData({ ...formData, age: clamped });
            }
          }}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, age: true }));
            validateField("age");
          }}
          required
          error={touched.age ? errors.age : undefined}
        />
        <DuoInput.Simple
          label="Altura (cm) *"
          type="text"
          inputMode="numeric"
          placeholder="170"
          value={formData.height === undefined ? "" : formData.height}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || v === "-") {
              setFormData({ ...formData, height: "" });
              return;
            }
            const n = parseFloat(v);
            if (!Number.isNaN(n)) {
              const clamped = Math.min(250, Math.max(100, n));
              setFormData({ ...formData, height: clamped });
            }
          }}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, height: true }));
            validateField("height");
          }}
          required
          error={touched.height ? errors.height : undefined}
        />
        <DuoInput.Simple
          label="Peso (kg) *"
          type="text"
          inputMode="numeric"
          placeholder="70"
          value={formData.weight === undefined ? "" : formData.weight}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || v === "-") {
              setFormData({ ...formData, weight: "" });
              return;
            }
            const n = parseFloat(v);
            if (!Number.isNaN(n)) {
              const clamped = Math.min(300, Math.max(30, n));
              setFormData({ ...formData, weight: clamped });
            }
          }}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, weight: true }));
            validateField("weight");
          }}
          required
          error={touched.weight ? errors.weight : undefined}
        />

        <div className="space-y-4">
          <span className="block text-sm font-bold text-gray-900">Gênero</span>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "male", label: "Masculino" },
              { value: "trans-male", label: "Trans Masculino" },
              { value: "female", label: "Feminino" },
              { value: "trans-female", label: "Trans Feminino" },
            ].map((option, index) => (
              <DuoButton
                key={option.value}
                type="button"
                variant={formData.gender === option.value ? "primary" : "outline"}
                onClick={() => {
                  const isTrans = option.value.includes("trans");
                  setFormData({
                    ...formData,
                    gender: option.value as OnboardingData["gender"],
                    isTrans,
                    usesHormones: isTrans ? formData.usesHormones : false,
                    hormoneType: isTrans ? formData.hormoneType : "",
                  });
                }}
                className={`rounded-2xl py-3 ${
                  formData.gender !== option.value
                    ? "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50"
                    : ""
                }`}
              >
                {option.label}
              </DuoButton>
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
                <DuoSelect.Simple
                  options={[
                    { value: "testosterone", label: "Testosterona" },
                    { value: "estrogen", label: "Estrogênio" },
                  ]}
                  value={formData.hormoneType}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      hormoneType: value as OnboardingData["hormoneType"],
                    })
                  }
                  label="Tipo de hormônio"
                  placeholder="Selecione"
                />
              )}
            </motion.div>
          )}
        </div>

        <DuoSelect.Simple
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
          label="Nível de Experiência"
          placeholder="Selecione"
        />
      </div>
      </DuoCard.Root>
    </motion.div>
  );
}
