"use client";

import {
  Apple,
  Ban,
  Calendar,
  CheckCircle,
  Dumbbell,
  Loader2,
  Mail,
  PauseCircle,
  Phone,
  Users,
} from "lucide-react";
import Image from "next/image";
import { DuoButton, DuoCard } from "@/components/duo";
import type { StudentData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDatePtBr } from "@/lib/utils/date-safe";

export interface StudentHeaderCardProps {
  student: StudentData;
  membershipStatus: "active" | "inactive" | "suspended" | "canceled";
  isUpdatingStatus: boolean;
  onMembershipAction: (action: "suspended" | "canceled" | "active") => void;
}

export function StudentHeaderCard({
  student,
  membershipStatus,
  isUpdatingStatus,
  onMembershipAction,
}: StudentHeaderCardProps) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Users
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-[var(--duo-fg)]">{student.name}</h2>
        </div>
      </DuoCard.Header>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full sm:mx-0 sm:h-32 sm:w-32">
          <Image
            src={student.avatar || "/placeholder.svg"}
            alt={student.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-bold",
                student.membershipStatus === "active"
                  ? "bg-duo-green text-white"
                  : "bg-gray-300 text-duo-gray-dark",
              )}
            >
              {student.membershipStatus === "active" ? "Ativo" : "Inativo"}
            </span>
          </div>
          <div className="mb-4 space-y-2 text-sm text-duo-gray-dark">
            <div className="flex items-center gap-2 wrap-break-words">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="break-all">{student.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{student.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                Membro desde {formatDatePtBr(student.joinDate) || "N/A"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <DuoButton
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              <Dumbbell className="h-4 w-4" />
              Atribuir Treino
            </DuoButton>
            <DuoButton
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              <Apple className="h-4 w-4" />
              Atribuir Dieta
            </DuoButton>
            {student.gymMembership?.id && (
              <>
                {membershipStatus === "active" ? (
                  <DuoButton
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-initial border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => onMembershipAction("suspended")}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PauseCircle className="h-4 w-4" />
                    )}
                    Suspender
                  </DuoButton>
                ) : membershipStatus === "suspended" ? (
                  <DuoButton
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-initial border-duo-green text-duo-green hover:bg-duo-green/10"
                    onClick={() => onMembershipAction("active")}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Reativar
                  </DuoButton>
                ) : null}
                {membershipStatus !== "canceled" && (
                  <DuoButton
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-initial border-duo-red text-duo-red hover:bg-duo-red/10"
                    onClick={() => onMembershipAction("canceled")}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Ban className="h-4 w-4" />
                    )}
                    Cancelar Matrícula
                  </DuoButton>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DuoCard.Root>
  );
}
