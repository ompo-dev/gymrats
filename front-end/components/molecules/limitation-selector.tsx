"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { OptionSelector } from "@/components/ui/option-selector";
import { FormInput } from "@/components/ui/form-input";
import { LucideIcon } from "lucide-react";

interface LimitationOption {
  value: string;
  label: string;
  emoji?: string;
}

interface LimitationDetail {
  type: "selector" | "text";
  options?: { value: string; label: string; emoji?: string }[];
  placeholder?: string;
  label?: string;
}

interface LimitationSelectorProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  options: LimitationOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  limitationDetails?: Record<string, string | string[]>;
  onDetailChange?: (
    limitationKey: string,
    detailValue: string | string[]
  ) => void;
  detailConfig?: Record<string, LimitationDetail>;
  delay?: number;
  error?: string;
}

export function LimitationSelector({
  title,
  icon: Icon,
  iconColor,
  borderColor,
  bgColor,
  options,
  selectedValues,
  onChange,
  limitationDetails = {},
  onDetailChange,
  detailConfig = {},
  delay = 0,
  error,
}: LimitationSelectorProps) {
  // Estado local para controlar se mostrou "Sim" ou "Não"
  const [hasLimitations, setHasLimitations] = useState<boolean>(
    selectedValues.length > 0
  );

  const handleHasLimitationsChange = (value: string) => {
    const hasLimits = value === "sim";

    // Atualiza estado imediatamente
    setHasLimitations(hasLimits);

    if (!hasLimits) {
      // Se selecionou "não", limpa tudo
      onChange([]);
      // Limpa detalhes relacionados
      if (onDetailChange) {
        Object.keys(limitationDetails).forEach((key) => {
          if (detailConfig[key]) {
            onDetailChange(key, "");
          }
        });
      }
    }
  };

  const handleOptionClick = (value: string) => {
    const current = selectedValues || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    // Remove detalhes se a limitação foi desmarcada
    if (
      !updated.includes(value) &&
      onDetailChange &&
      limitationDetails[value]
    ) {
      onDetailChange(value, "");
    }

    onChange(updated);
  };

  const isLimitationSelected = (value: string) => {
    return selectedValues.includes(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <label className="block text-sm font-bold text-gray-900">{title}</label>
      </div>

      {/* Pergunta inicial: Tem limitações? - Seguindo padrão do Step 1 */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "sim", label: "Sim", emoji: "✅" },
            { value: "nao", label: "Não", emoji: "❌" },
          ].map((option, index) => (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: delay + 0.1 + index * 0.1,
                type: "spring",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleHasLimitationsChange(option.value)}
              className={`rounded-2xl border-2 py-3 font-bold uppercase tracking-wider transition-all active:shadow-none active:translate-y-[4px] ${
                hasLimitations === (option.value === "sim")
                  ? "border-duo-green bg-duo-green text-white shadow-[0_4px_0_#58A700]"
                  : "border-gray-300 bg-white text-gray-900 shadow-[0_4px_0_#D1D5DB] hover:border-duo-green/50 hover:shadow-[0_4px_0_#9CA3AF]"
              }`}
            >
              <span className="mr-2">{option.emoji}</span>
              {option.label}
            </motion.button>
          ))}
        </div>

        {/* Opções de limitações (aparece apenas se selecionou "Sim") - Seguindo padrão do Step 1 */}
        {hasLimitations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 rounded-xl border-2 border-duo-green/30 bg-duo-green/5 p-4"
          >
            <p className="text-xs text-gray-600">
              Selecione todas as limitações que se aplicam a você
            </p>

            {/* Botões de seleção como no Step 1 */}
            <div className="grid grid-cols-2 gap-3">
              {options.map((option, index) => (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: delay + 0.2 + index * 0.05,
                    type: "spring",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleOptionClick(option.value)}
                  className={`rounded-2xl border-2 py-3 font-bold uppercase tracking-wider transition-all active:shadow-none active:translate-y-[4px] ${
                    isLimitationSelected(option.value)
                      ? "border-duo-green bg-duo-green text-white shadow-[0_4px_0_#58A700]"
                      : "border-gray-300 bg-white text-gray-900 shadow-[0_4px_0_#D1D5DB] hover:border-duo-green/50 hover:shadow-[0_4px_0_#9CA3AF]"
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>

            {/* Seções expandidas para detalhes das limitações - Seguindo padrão do Step 1 */}
            {Object.entries(detailConfig).map(([limitationKey, detail]) => {
              if (!isLimitationSelected(limitationKey)) return null;

              return (
                <motion.div
                  key={limitationKey}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`space-y-4 rounded-xl border-2 ${borderColor} ${bgColor} p-4 mt-4`}
                >
                  <p className="text-sm font-bold text-gray-900">
                    {detail.label || `Detalhes sobre ${limitationKey}`}
                  </p>
                  {detail.type === "selector" && detail.options && (
                    <OptionSelector
                      options={detail.options}
                      value={
                        Array.isArray(limitationDetails[limitationKey])
                          ? (limitationDetails[limitationKey] as string[])[0] ||
                            ""
                          : (limitationDetails[limitationKey] as string) || ""
                      }
                      onChange={(value) => {
                        const detailValue = Array.isArray(value)
                          ? value[0]
                          : value;
                        onDetailChange?.(limitationKey, detailValue);
                      }}
                      multiple={false}
                      layout="grid"
                      columns={
                        Math.min(Math.max(1, detail.options.length), 7) as
                          | 1
                          | 2
                          | 3
                          | 4
                          | 5
                          | 6
                          | 7
                      }
                      size="sm"
                      delay={0}
                    />
                  )}
                  {detail.type === "text" && (
                    <FormInput
                      label="Descrição"
                      type="text"
                      placeholder={detail.placeholder}
                      value={
                        typeof limitationDetails[limitationKey] === "string"
                          ? limitationDetails[limitationKey]
                          : ""
                      }
                      onChange={(value) =>
                        onDetailChange?.(limitationKey, value as string)
                      }
                      delay={0}
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {error && <p className="text-sm font-bold text-red-500">{error}</p>}
    </motion.div>
  );
}
