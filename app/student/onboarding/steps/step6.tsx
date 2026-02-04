"use client";

import { Activity, Thermometer } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { StepCard } from "@/components/molecules/cards/step-card";
import { FormInput } from "@/components/ui/form-input";
import { RangeSlider } from "@/components/ui/range-slider";
import { type step5Schema_Activity, validateStep5 } from "../schemas";
import type { StepProps } from "./types";

// Descrições para cada nível de atividade (1-10)
const activityLevelDescriptions: Record<
	number,
	{ label: string; description: string; example: string }
> = {
	1: {
		label: "Sedentário Total",
		description: "Sem exercício, trabalho sentado",
		example: "Pessoa acamada ou muito limitada",
	},
	2: {
		label: "Muito Sedentário",
		description: "Pouco ou nenhum exercício",
		example: "Trabalho de escritório, sem atividades físicas",
	},
	3: {
		label: "Sedentário Leve",
		description: "Exercício leve 1-2x/semana",
		example: "Caminhadas ocasionais",
	},
	4: {
		label: "Levemente Ativo",
		description: "Exercício leve 3-5x/semana",
		example: "Trabalho home office, exercícios leves",
	},
	5: {
		label: "Moderadamente Ativo",
		description: "Exercício moderado 3-5x/semana",
		example: "Trabalho de escritório com exercícios regulares",
	},
	6: {
		label: "Ativo",
		description: "Exercício pesado 3-5x/semana",
		example: "Trabalho que requer movimento constante",
	},
	7: {
		label: "Muito Ativo",
		description: "Exercício pesado 6-7x/semana",
		example: "Trabalho físico moderado",
	},
	8: {
		label: "Extremamente Ativo",
		description: "Exercício muito pesado diário",
		example: "Trabalho na construção, trabalho físico pesado",
	},
	9: {
		label: "Atleta",
		description: "Treino intenso 2x/dia",
		example: "Atleta de alto rendimento",
	},
	10: {
		label: "Atleta Elite",
		description: "Treino extremo, competição",
		example: "Atleta profissional de alto rendimento",
	},
};

export function Step6({ formData, setFormData, forceValidation }: StepProps) {
	const [errors, setErrors] = useState<
		Partial<Record<keyof z.infer<typeof step5Schema_Activity>, string>>
	>({});
	const [touched, setTouched] = useState<
		Partial<Record<keyof z.infer<typeof step5Schema_Activity>, boolean>>
	>({});

	// Marca todos os campos como touched quando forceValidation é true
	useEffect(() => {
		if (forceValidation) {
			setTouched({
				activityLevel: true,
				hormoneTreatmentDuration: true,
			});
		}
	}, [forceValidation]);

	// Valida apenas campos que foram tocados
	useEffect(() => {
		if (Object.keys(touched).length > 0) {
			const validation = validateStep5({
				activityLevel: formData.activityLevel,
				hormoneTreatmentDuration: formData.hormoneTreatmentDuration,
			});

			if (!validation.success) {
				const fieldErrors: typeof errors = {};
				validation.error.errors.forEach((err: z.ZodIssue) => {
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
	}, [formData.activityLevel, formData.hormoneTreatmentDuration, touched]);

	const currentActivityLevel = formData.activityLevel || 4;
	const activityInfo =
		activityLevelDescriptions[currentActivityLevel] ||
		activityLevelDescriptions[4];

	return (
		<StepCard
			title="Nível de Atividade e Disponibilidade"
			description="Ajuste fino para cálculos mais precisos"
		>
			<div className="space-y-6">
				{/* Nível de Atividade - Termômetro 1-10 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="space-y-4"
				>
					<div className="flex items-center gap-2">
						<Thermometer className="h-5 w-5 text-duo-green" />
						<span className="block text-sm font-bold text-gray-900">
							Nível de Atividade Física (1-10)
						</span>
					</div>

					<RangeSlider
						min={1}
						max={10}
						step={1}
						value={currentActivityLevel}
						onChange={(value) => {
							setFormData({
								...formData,
								activityLevel: value,
							});
							setTouched((prev) => ({ ...prev, activityLevel: true }));
							// Recalcula valores metabólicos quando activityLevel muda
							// O Step5 vai detectar a mudança e recalcular
						}}
						label=""
						unit=""
						showValue={true}
						size="lg"
						delay={0.3}
					/>

					{/* Card com informações do nível selecionado */}
					<motion.div
						key={currentActivityLevel}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="rounded-xl border-2 border-duo-green bg-duo-green/5 p-4"
					>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-lg font-bold text-gray-900">
									{activityInfo.label}
								</span>
								<span className="text-2xl font-black text-duo-green">
									{currentActivityLevel}/10
								</span>
							</div>
							<p className="text-sm text-gray-700">
								{activityInfo.description}
							</p>
							<p className="text-xs text-gray-600 italic">
								Exemplo: {activityInfo.example}
							</p>
						</div>
					</motion.div>

					{touched.activityLevel && errors.activityLevel && (
						<p className="text-sm font-bold text-red-500">
							{errors.activityLevel}
						</p>
					)}
				</motion.div>

				{/* Tempo de Tratamento Hormonal (apenas se usa hormônios) */}
				{formData.isTrans && formData.usesHormones && formData.hormoneType && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className="space-y-4 rounded-xl border-2 border-duo-green/30 bg-duo-green/5 p-4"
					>
						<div className="flex items-center gap-2">
							<Activity className="h-5 w-5 text-duo-green" />
							<span className="block text-sm font-bold text-gray-900">
								Tempo de Tratamento Hormonal
							</span>
						</div>
						<p className="text-xs text-gray-600">
							Há quantos meses você faz uso de{" "}
							{formData.hormoneType === "testosterone"
								? "testosterona"
								: "estrogênio"}
							?
						</p>
						<FormInput
							label="Meses de tratamento"
							type="number"
							placeholder="0"
							value={formData.hormoneTreatmentDuration || ""}
							onChange={(value) => {
								setFormData({
									...formData,
									hormoneTreatmentDuration:
										typeof value === "number" ? value : undefined,
								});
								setTouched((prev) => ({
									...prev,
									hormoneTreatmentDuration: true,
								}));
							}}
							onBlur={() => {
								setTouched((prev) => ({
									...prev,
									hormoneTreatmentDuration: true,
								}));
							}}
							error={
								touched.hormoneTreatmentDuration
									? errors.hormoneTreatmentDuration
									: undefined
							}
							min={0}
							max={120}
							delay={0}
						/>
					</motion.div>
				)}
			</div>
		</StepCard>
	);
}
