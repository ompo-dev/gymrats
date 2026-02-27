"use client";

import { Activity } from "lucide-react";
import { DuoCard } from "@/components/duo";
import type { StudentData } from "@/lib/types";

export interface ProgressTabProps {
	student: StudentData;
}

export function ProgressTab({ student }: ProgressTabProps) {
	const totalXP = student.progress?.totalXP ?? 0;
	const xpToNext = student.progress?.xpToNextLevel ?? 100;
	const progressWidth = (totalXP / (totalXP + xpToNext || 1)) * 100;

	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<Activity className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
					<h2 className="font-bold text-[var(--duo-fg)]">Progresso e XP</h2>
				</div>
			</DuoCard.Header>
			<div className="mb-6">
				<div className="mb-2 flex items-center justify-between">
					<span className="font-bold text-duo-text">Nível {student.progress?.currentLevel ?? 1}</span>
					<span className="text-sm text-duo-gray-dark">
						{totalXP} / {totalXP + xpToNext} XP
					</span>
				</div>
				<div className="h-4 overflow-hidden rounded-full bg-gray-200">
					<div className="h-full bg-duo-green" style={{ width: `${progressWidth}%` }} />
				</div>
			</div>
			<h3 className="mb-3 font-bold text-duo-text text-sm sm:text-base">Atividade Semanal</h3>
			<div className="grid grid-cols-7 gap-1 sm:gap-2">
				{(["D", "S", "T", "Q", "Q", "S", "S"] as const).map((day, index) => (
					<div key={`weekday-${day}-${index}`} className="text-center">
						<p className="mb-1 sm:mb-2 text-xs font-bold text-duo-gray-dark">{day}</p>
						<DuoCard.Root variant="default" size="sm" className="p-2 sm:p-3">
							<p className="text-sm sm:text-lg font-bold text-duo-green">
								{student.progress?.weeklyXP?.[index] ?? 0}
							</p>
						</DuoCard.Root>
					</div>
				))}
			</div>
		</DuoCard.Root>
	);
}
