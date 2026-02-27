"use client";

import { Trophy } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { formatDatePtBr } from "@/lib/utils/date-safe";
import type { StudentData } from "@/lib/types";

export interface RecordsTabProps {
	student: StudentData;
}

export function RecordsTab({ student }: RecordsTabProps) {
	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<Trophy className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
					<h2 className="font-bold text-[var(--duo-fg)]">Recordes Pessoais</h2>
				</div>
			</DuoCard.Header>
			<div className="space-y-3">
				{(student.personalRecords ?? []).map((record, idx) => (
					<DuoCard.Root
						key={`${record.exerciseName ?? "ex"}-${record.date?.toISOString?.() ?? idx}-${record.value}`}
						variant="orange"
						size="default"
					>
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
							<div className="flex-1 min-w-0">
								<p className="text-base sm:text-lg font-bold text-duo-text wrap-break-words">
									{record.exerciseName}
								</p>
								<p className="text-xs sm:text-sm text-duo-gray-dark">
									{formatDatePtBr(record.date) || "N/A"}
								</p>
							</div>
							<div className="text-left sm:text-right">
								<p className="text-2xl sm:text-3xl font-bold text-duo-orange">{record.value}kg</p>
								<p className="text-xs font-bold text-duo-gray-dark capitalize">
									{record.type.replace("-", " ")}
								</p>
							</div>
						</div>
					</DuoCard.Root>
				))}
			</div>
		</DuoCard.Root>
	);
}
