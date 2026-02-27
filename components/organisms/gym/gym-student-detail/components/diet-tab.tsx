"use client";

import { Apple, Loader2 } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import type { DailyNutrition, StudentData } from "@/lib/types";

export interface DietTabProps {
	student: StudentData;
	dailyNutrition: DailyNutrition | null;
	nutritionDate: string;
	isLoadingNutrition: boolean;
	onNutritionDateChange: (date: string) => void;
	onFetchNutrition: (date?: string) => void;
}

export function DietTab({
	student,
	dailyNutrition,
	nutritionDate,
	isLoadingNutrition,
	onNutritionDateChange,
	onFetchNutrition,
}: DietTabProps) {
	const targetCal = student.profile?.targetCalories ?? 2000;
	const targetProtein = student.profile?.targetProtein ?? 150;
	const targetCarbs = student.profile?.targetCarbs ?? 250;
	const targetFats = student.profile?.targetFats ?? 65;

	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Apple className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
						<h2 className="font-bold text-duo-fg">Nutrição e Dieta do Aluno</h2>
					</div>
					<input
						type="date"
						value={nutritionDate}
						onChange={(e) => {
							onNutritionDateChange(e.target.value);
							onFetchNutrition(e.target.value);
						}}
						className="rounded-lg border border-duo-border bg-duo-bg px-3 py-1.5 text-sm font-bold text-duo-text"
					/>
				</div>
			</DuoCard.Header>
			{isLoadingNutrition ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-10 w-10 animate-spin text-duo-gray-dark" />
				</div>
			) : dailyNutrition ? (
				<NutritionTracker.Simple
					nutrition={dailyNutrition}
					onMealComplete={() => {}}
					onAddMeal={() => {}}
					readOnly
				/>
			) : (
				<div className="py-12 text-center">
					<Apple className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
					<p className="font-bold text-duo-gray-dark">Nenhum registro de nutrição para esta data</p>
					<p className="mt-1 text-sm text-duo-gray-dark">
						As metas do perfil: {targetCal} kcal, {targetProtein}g Proteína, {targetCarbs}g Carboidratos, {targetFats}g Gorduras.
					</p>
				</div>
			)}
		</DuoCard.Root>
	);
}
