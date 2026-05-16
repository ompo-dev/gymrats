"use client";

import { useEffect, useState } from "react";
import type { z } from "zod";
import { StepCard } from "@/components/molecules/cards/step-card";
import { OptionSelector } from "@/components/ui/option-selector";
import { RangeSlider } from "@/components/ui/range-slider";
import { type step2Schema, validateStep2 } from "../schemas";
import type { StepProps } from "./types";

export function Step2({ formData, setFormData, forceValidation }: StepProps) {
	const [errors, setErrors] = useState<
		Partial<Record<keyof z.infer<typeof step2Schema>, string>>
	>({});
	const [touched, setTouched] = useState<
		Partial<Record<keyof z.infer<typeof step2Schema>, boolean>>
	>({});

	// Marca todos os campos como touched quando forceValidation é true
	useEffect(() => {
		if (forceValidation) {
			setTouched({
				goals: true,
				weeklyWorkoutFrequency: true,
				workoutDuration: true,
			});
		}
	}, [forceValidation]);

	// Valida apenas campos que foram tocados
	useEffect(() => {
		if (Object.keys(touched).length > 0) {
			const validation = validateStep2({
				goals: formData.goals,
				weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency,
				workoutDuration: formData.workoutDuration,
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
	}, [
		formData.goals,
		formData.weeklyWorkoutFrequency,
		formData.workoutDuration,
		touched,
	]);

	return (
		<StepCard title="Objetivos" description="O que você quer alcançar?">
			<div className="space-y-6">
				<div>
					<OptionSelector
						options={[
							{
								value: "perder-peso",
								label: "Perder Peso",
								emoji: "⚖️",
							},
							{
								value: "ganhar-massa",
								label: "Ganhar Massa",
								emoji: "💪",
							},
							{
								value: "definir",
								label: "Definir Músculos",
								emoji: "✨",
							},
							{ value: "saude", label: "Saúde Geral", emoji: "❤️" },
							{ value: "forca", label: "Ganhar Força", emoji: "🏋️" },
							{
								value: "resistencia",
								label: "Resistência",
								emoji: "🏃",
							},
						]}
						value={formData.goals}
						onChange={(value) => {
							const goalValue = value as
								| "perder-peso"
								| "ganhar-massa"
								| "definir"
								| "saude"
								| "forca"
								| "resistencia";
							const goals = formData.goals.includes(goalValue)
								? formData.goals.filter((g) => g !== goalValue)
								: [...formData.goals, goalValue];
							setFormData({
								...formData,
								goals: goals as (
									| "perder-peso"
									| "ganhar-massa"
									| "definir"
									| "saude"
									| "forca"
									| "resistencia"
								)[],
							});
							setTouched((prev) => ({ ...prev, goals: true }));
						}}
						multiple
						layout="grid"
						columns={2}
						size="md"
						delay={0.3}
						label="Selecione seus objetivos"
					/>
					{touched.goals && errors.goals && (
						<p className="mt-2 text-sm font-bold text-red-500">
							{errors.goals}
						</p>
					)}
				</div>

				<OptionSelector
					options={[1, 2, 3, 4, 5, 6, 7].map((num) => ({
						value: String(num),
						label: String(num),
					}))}
					value={String(formData.weeklyWorkoutFrequency)}
					onChange={(value) => {
						setFormData({
							...formData,
							weeklyWorkoutFrequency: parseInt(value, 10),
						});
						setTouched((prev) => ({ ...prev, weeklyWorkoutFrequency: true }));
					}}
					layout="grid"
					columns={7}
					size="sm"
					showCheck={false}
					delay={0.6}
					label="Quantas vezes por semana pode treinar?"
				/>

				<div>
					<RangeSlider
						min={20}
						max={120}
						step={10}
						value={formData.workoutDuration}
						onChange={(value) => {
							setFormData({
								...formData,
								workoutDuration: value,
							});
							setTouched((prev) => ({ ...prev, workoutDuration: true }));
						}}
						label="Duração preferida por treino"
						unit="min"
						size="lg"
						delay={0.9}
					/>
				</div>
			</div>
		</StepCard>
	);
}
