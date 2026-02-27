"use client";

import { Play, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { DuoButton, DuoCard } from "@/components/duo";
import { RecordCard } from "@/components/ui/record-card";
import type { PersonalRecord } from "@/lib/types";

export interface PersonalRecordsCardProps {
	records: PersonalRecord[];
	onWorkoutClick: () => void;
}

export function PersonalRecordsCard({
	records,
	onWorkoutClick,
}: PersonalRecordsCardProps) {
	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<Trophy
						className="h-5 w-5 shrink-0"
						style={{ color: "var(--duo-secondary)" }}
						aria-hidden
					/>
					<h2 className="font-bold text-[var(--duo-fg)]">Recordes Pessoais</h2>
				</div>
			</DuoCard.Header>
			{records.length > 0 ? (
				<div className="space-y-3">
					{records.map((record) => (
						<RecordCard.Simple
							key={`${record.exerciseId}-${String(record.date)}`}
							exerciseName={record.exerciseName}
							date={record.date}
							value={record.value}
							unit={record.type === "max-weight" ? "kg" : " reps"}
							previousBest={record.previousBest}
						/>
					))}
				</div>
			) : (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col items-center justify-center py-8 px-4 text-center"
				>
					<Trophy className="h-12 w-12 text-duo-gray-dark mb-4 opacity-50" />
					<h3 className="text-lg font-bold text-duo-text mb-2">
						Seus recordes estão esperando!
					</h3>
					<p className="text-sm text-duo-gray-dark mb-4 max-w-sm">
						Complete treinos e quebre seus próprios recordes. Cada treino é
						uma oportunidade de superar seus limites!
					</p>
					<DuoButton
						onClick={onWorkoutClick}
						variant="primary"
						className="w-full max-w-xs"
					>
						<Play className="h-4 w-4 mr-2" />
						Primeiro Treino
					</DuoButton>
				</motion.div>
			)}
		</DuoCard.Root>
	);
}
