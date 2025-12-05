"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";
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
  return (
    <motion.button
      onClick={onClick}
      disabled={isLocked}
      whileHover={!isLocked && !isCompleted ? { scale: 1.05, y: -5 } : {}}
      whileTap={!isLocked && !isCompleted ? { scale: 0.95, y: -3 } : {}}
      animate={!isLocked && !isCompleted ? { y: -5 } : { y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative w-[70px] h-[65px] flex items-center justify-center z-10",
        // Quando bloqueado: tons de cinza
        isLocked && "cursor-not-allowed bg-[#E5E5E5]",
        // Quando desbloqueado e atual OU em progresso: verde
        !isLocked && !isCompleted && isCurrent && "bg-[#58CC02]",
        // Quando desbloqueado e completo: dourado
        !isLocked &&
          isCompleted &&
          "bg-linear-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00]",
        // Fallback: se não está bloqueado, não está completo e não é current, deve ter cor verde também (em progresso)
        !isLocked && !isCompleted && !isCurrent && "bg-[#58CC02]"
      )}
      style={{
        borderRadius: "31.75px",
        boxShadow: isLocked
          ? "0px 8px 0px rgba(0, 0, 0, 0.1), 0px 8px 0px #D1D5DB"
          : isCurrent || (!isLocked && !isCompleted)
          ? "0px 8px 0px rgba(0, 0, 0, 0.2), 0px 8px 0px #58CC02"
          : isCompleted
          ? "0px 8px 0px rgba(0, 0, 0, 0.2), 0px 8px 0px #FFA500"
          : "none",
      }}
    >
      {/* Estrela - sempre mostra, mas em cinza quando bloqueado */}
      <Star
        className={cn(
          "fill-current",
          isLocked
            ? "text-[#AFAFAF]"
            : isCompleted
            ? "text-white"
            : "text-white"
        )}
        style={{ width: "42px", height: "34px" }}
      />
    </motion.button>
  );
}

