"use client";

import { Apple, Dumbbell, Loader2, UserMinus, Users } from "lucide-react";
import Image from "next/image";
import { DuoButton, DuoCard } from "@/components/duo";
import type { PersonalStudentAssignmentForDetail } from "../hooks/use-personal-student-detail";
import { cn } from "@/lib/utils";

export interface PersonalStudentHeaderCardProps {
  assignment: PersonalStudentAssignmentForDetail;
  onAssignWorkout?: () => void;
  onAssignDiet?: () => void;
  onRemoveAssignment?: () => void;
  isRemovingAssignment?: boolean;
}

export function PersonalStudentHeaderCard({
  assignment,
  onAssignWorkout,
  onAssignDiet,
  onRemoveAssignment,
  isRemovingAssignment,
}: PersonalStudentHeaderCardProps) {
  const studentName = assignment.student?.user?.name ?? "Aluno";
  const studentEmail = assignment.student?.user?.email ?? "";
  const avatar = (assignment.student as { avatar?: string | null })?.avatar ?? null;
  const gymName = assignment.gym?.name;

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Users
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-[var(--duo-fg)]">{studentName}</h2>
        </div>
      </DuoCard.Header>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full sm:mx-0 sm:h-32 sm:w-32">
          <Image
            src={avatar || "/placeholder.svg"}
            alt={studentName}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-bold",
                gymName
                  ? "bg-duo-blue text-white"
                  : "bg-duo-purple/20 text-duo-purple",
              )}
            >
              {gymName ? `Via ${gymName}` : "Independente"}
            </span>
          </div>
          <div className="mb-4 space-y-2 text-sm text-duo-gray-dark">
            <div className="flex items-center gap-2 break-all">
              <span>{studentEmail}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <DuoButton
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-initial"
              onClick={onAssignWorkout}
            >
              <Dumbbell className="h-4 w-4" />
              Atribuir Treino
            </DuoButton>
            <DuoButton
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-initial"
              onClick={onAssignDiet}
            >
              <Apple className="h-4 w-4" />
              Atribuir Dieta
            </DuoButton>
            {onRemoveAssignment && (
              <DuoButton
                size="sm"
                variant="danger"
                className="flex-1 sm:flex-initial"
                onClick={onRemoveAssignment}
                disabled={isRemovingAssignment}
              >
                {isRemovingAssignment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
                Desvincular Aluno
              </DuoButton>
            )}
          </div>
        </div>
      </div>
    </DuoCard.Root>
  );
}
