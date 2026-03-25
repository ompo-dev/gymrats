"use client";

import { Trophy } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { formatDatePtBr } from "@/lib/utils/date-safe";

export interface PersonalRecordItem {
  exerciseName?: string;
  date?: Date | string;
  value?: number;
  type?: string;
}

export interface PersonalRecordsTabProps {
  records?: PersonalRecordItem[];
}

export function PersonalRecordsTab({ records = [] }: PersonalRecordsTabProps) {
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
      <div className="space-y-3">
        {records.length > 0 ? (
          records.map((record, idx) => (
            <DuoCard.Root
              key={`${record.exerciseName ?? "ex"}-${record.date?.toString?.() ?? idx}-${record.value}`}
              variant="orange"
              size="default"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-base sm:text-lg font-bold text-duo-text wrap-break-words">
                    {record.exerciseName}
                  </p>
                  <p className="text-xs sm:text-sm text-duo-gray-dark">
                    {(record.date ? formatDatePtBr(record.date) : null) ||
                      "N/A"}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl sm:text-3xl font-bold text-duo-orange">
                    {record.value}kg
                  </p>
                  <p className="text-xs font-bold text-duo-gray-dark capitalize">
                    {record.type?.replace("-", " ") ?? "—"}
                  </p>
                </div>
              </div>
            </DuoCard.Root>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-duo-fg-muted">
            Nenhum recorde pessoal registrado.
          </p>
        )}
      </div>
    </DuoCard.Root>
  );
}
