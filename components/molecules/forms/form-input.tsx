"use client";

import { motion } from "motion/react";
import { forwardRef, useEffect, useRef } from "react";
import { DuoInput } from "@/components/duo";
import { cn } from "@/lib/utils";

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

const FormInputSimple = forwardRef<HTMLInputElement, FormInputProps>(
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
		ref,
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
				if (
					!Number.isNaN(numValue) &&
					numValue < 0 &&
					(min === undefined || min >= 0)
				) {
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

					if (!Number.isNaN(numValue)) {
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

				if (!Number.isNaN(numValue)) {
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
				<DuoInput.Simple
					ref={ref}
					label={label ? `${label}${required ? " *" : ""}` : undefined}
					leftIcon={icon}
					error={error}
					type={type === "number" ? "text" : type}
					inputMode={type === "number" ? "numeric" : undefined}
					value={String(value || "")}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder={placeholder}
					disabled={disabled}
					maxLength={maxLength}
					required={required}
					className={cn(sizeClasses[size])}
				/>
			</motion.div>
		);
	},
);

FormInputSimple.displayName = "FormInput";

export const FormInput = { Simple: FormInputSimple };
