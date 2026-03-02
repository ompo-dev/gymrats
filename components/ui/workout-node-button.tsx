"use client";

import { Star } from "lucide-react";
import { DuoButton } from "@/components/duo";
import { cn } from "@/lib/utils";

interface WorkoutNodeButtonProps {
  onClick: () => void;
  isLocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

/**
 * Botão principal do WorkoutNode - 70px x 65px, centralizado
 * Renderiza estrela sempre, mas em tons de cinza quando bloqueado
 */
export function WorkoutNodeButton({
  onClick,
  isLocked,
  isCompleted,
  isCurrent,
}: WorkoutNodeButtonProps) {
  const activeColor = "#58CC02"; // duo-green

  const handleClick = (e: React.MouseEvent) => {
    // Não chamar onClick se estiver bloqueado
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <DuoButton
      type="button"
      onClick={handleClick}
      disabled={isLocked}
      variant={isLocked ? "locked" : "primary"}
      className={cn(
        "relative w-[70px] h-[65px] flex items-center justify-center z-10 min-w-[70px] min-h-[65px] p-0 border-0",
        // Quando bloqueado: tons de cinza
        isLocked && "cursor-not-allowed bg-duo-bg-elevated",
        // Quando desbloqueado e completo: dourado
        !isLocked &&
          isCompleted &&
          "bg-linear-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00] border-0",
        // Quando não completo: cor baseada no tipo (cardio=vermelho, strength=verde)
        !isLocked && !isCompleted && "transition-colors duration-200",
      )}
      style={{
        borderRadius: "31.75px",
        backgroundColor: !isLocked && !isCompleted ? activeColor : undefined,
        boxShadow: isLocked
          ? "0px 8px 0px rgba(0, 0, 0, 0.1), 0px 8px 0px #D1D5DB"
          : isCurrent || (!isLocked && !isCompleted)
            ? `0px 8px 0px rgba(0, 0, 0, 0.2), 0px 8px 0px ${activeColor}`
            : isCompleted
              ? "0px 8px 0px rgba(0, 0, 0, 0.2), 0px 8px 0px #FFA500"
              : "none",
      }}
    >
      {/* Estrela - sempre mostra, mas em cinza quando bloqueado */}
      <Star
        className={cn(
          "fill-current",
          isLocked ? "text-duo-fg-muted" : "text-white",
        )}
        style={{ width: "42px", height: "34px" }}
      />
    </DuoButton>
  );
}
