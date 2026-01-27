"use client";

import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forwardRef, useEffect, useRef } from "react";

interface FormInputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "number" | "email" | "password" | "tel" | "url";
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  delay?: number;
  icon?: React.ReactNode;
  maxLength?: number;
  min?: number;
  max?: number;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      placeholder,
      type = "text",
      value,
      onChange,
      onBlur,
      error,
      required,
      disabled,
      size = "md",
      className,
      delay = 0,
      icon,
      maxLength,
      min,
      max,
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-10 text-sm",
      md: "h-12 text-base",
      lg: "h-14 text-lg",
    };

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      if (type === "number") {
        // Permite valores vazios
        if (inputValue === "" || inputValue === "-") {
          onChange("");
          return;
        }
        
        // Permite apenas números e ponto decimal durante a digitação
        const isValidPartial = /^-?\d*\.?\d*$/.test(inputValue);
        if (!isValidPartial) {
          return;
        }
        
        // Não permite números negativos se min >= 0
        const numValue = parseFloat(inputValue);
        if (!isNaN(numValue) && numValue < 0 && (min === undefined || min >= 0)) {
          return;
        }
        
        // Permite qualquer valor durante a digitação (validação será com debounce)
        onChange(inputValue);
      } else {
        onChange(inputValue);
      }
    };
    
    // Debounce para validação de números (500ms após parar de digitar)
    useEffect(() => {
      if (type === "number" && typeof value === "string" && value !== "") {
        // Limpa timer anterior
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        // Cria novo timer
        debounceTimerRef.current = setTimeout(() => {
          const numValue = parseFloat(value);
          
          if (!isNaN(numValue)) {
            // Valida min e max após debounce
            let finalValue = numValue;
            
            if (min !== undefined && numValue < min) {
              finalValue = min;
            } else if (max !== undefined && numValue > max) {
              finalValue = max;
            }
            
            // Converte para número apenas quando válido
            onChange(finalValue);
          } else {
            // Se não for um número válido, limpa o campo
            onChange("");
          }
        }, 1000); // 1000ms de debounce (dobrado)
      }
      
      // Cleanup
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [value, type, min, max, onChange]);
    
    const handleBlur = () => {
      // Validação imediata no blur (sem debounce)
      if (type === "number" && typeof value === "string" && value !== "") {
        const numValue = parseFloat(value);
        
        if (!isNaN(numValue)) {
          let finalValue = numValue;
          
          if (min !== undefined && numValue < min) {
            finalValue = min;
          } else if (max !== undefined && numValue > max) {
            finalValue = max;
          }
          
          onChange(finalValue);
        } else {
          onChange("");
        }
      }
      
      // Limpa timer de debounce ao perder foco
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      // Chama o onBlur original se fornecido
      onBlur?.();
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, type: "spring" }}
        className={cn("space-y-2", className)}
      >
        {label && (
          <Label className="block text-sm font-bold text-gray-900">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <Input
            ref={ref}
            type={type === "number" ? "text" : type} // Usa "text" para number para ter controle total
            inputMode={type === "number" ? "numeric" : undefined}
            value={String(value || "")}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(
              sizeClasses[size],
              "border-2 border-gray-300 font-semibold transition-all focus:border-duo-green focus:ring-2 focus:ring-duo-green/20",
              error &&
                "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              icon && "pl-10"
            )}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    );
  }
);

FormInput.displayName = "FormInput";
