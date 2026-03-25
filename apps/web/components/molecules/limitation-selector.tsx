"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { DuoButton, DuoInput, DuoSelect } from "@/components/duo";

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
    detailValue: string | string[],
  ) => void;
  detailConfig?: Record<string, LimitationDetail>;
  delay?: number;
  error?: string;
}

function LimitationSelectorSimple({
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
    selectedValues.length > 0,
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
        <p className="block text-sm font-bold text-duo-fg">{title}</p>
      </div>

      {/* Pergunta inicial: Tem limitações? - Seguindo padrão do Step 1 */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "sim", label: "Sim", emoji: "✅" },
            { value: "nao", label: "Não", emoji: "❌" },
          ].map((option, _index) => (
            <DuoButton
              key={option.value}
              type="button"
              variant={
                hasLimitations === (option.value === "sim")
                  ? "primary"
                  : "outline"
              }
              onClick={() => handleHasLimitationsChange(option.value)}
              className={`rounded-2xl py-3 ${
                hasLimitations !== (option.value === "sim")
                  ? "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50"
                  : ""
              }`}
            >
              <span className="mr-2">{option.emoji}</span>
              {option.label}
            </DuoButton>
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
            <p className="text-xs text-duo-fg-muted">
              Selecione todas as limitações que se aplicam a você
            </p>

            {/* Botões de seleção como no Step 1 */}
            <div className="grid grid-cols-2 gap-3">
              {options.map((option, _index) => (
                <DuoButton
                  key={option.value}
                  type="button"
                  variant={
                    isLimitationSelected(option.value) ? "primary" : "outline"
                  }
                  onClick={() => handleOptionClick(option.value)}
                  className={`rounded-2xl py-3 ${
                    !isLimitationSelected(option.value)
                      ? "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50"
                      : ""
                  }`}
                >
                  {option.label}
                </DuoButton>
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
                  <p className="text-sm font-bold text-duo-fg">
                    {detail.label || `Detalhes sobre ${limitationKey}`}
                  </p>
                  {detail.type === "selector" && detail.options && (
                    <DuoSelect.Simple
                      options={detail.options}
                      value={
                        Array.isArray(limitationDetails[limitationKey])
                          ? (limitationDetails[limitationKey] as string[])[0] ||
                            ""
                          : (limitationDetails[limitationKey] as string) || ""
                      }
                      onChange={(value) => {
                        onDetailChange?.(limitationKey, value);
                      }}
                      placeholder="Selecione"
                    />
                  )}
                  {detail.type === "text" && (
                    <DuoInput.Simple
                      label="Descrição"
                      type="text"
                      placeholder={detail.placeholder}
                      value={
                        typeof limitationDetails[limitationKey] === "string"
                          ? limitationDetails[limitationKey]
                          : ""
                      }
                      onChange={(e) =>
                        onDetailChange?.(limitationKey, e.target.value)
                      }
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {error && <p className="text-sm font-bold text-duo-danger">{error}</p>}
    </motion.div>
  );
}

export const LimitationSelector = { Simple: LimitationSelectorSimple };
