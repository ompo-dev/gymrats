"use client";

import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface FormInputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "number" | "email" | "password" | "tel" | "url";
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  delay?: number;
  icon?: React.ReactNode;
  maxLength?: number;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      placeholder,
      type = "text",
      value,
      onChange,
      error,
      required,
      disabled,
      size = "md",
      className,
      delay = 0,
      icon,
      maxLength,
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-10 text-sm",
      md: "h-12 text-base",
      lg: "h-14 text-lg",
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === "number") {
        const numValue = e.target.value ? parseFloat(e.target.value) : "";
        onChange(numValue);
      } else {
        onChange(e.target.value);
      }
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
            type={type}
            value={String(value || "")}
            onChange={handleChange}
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
