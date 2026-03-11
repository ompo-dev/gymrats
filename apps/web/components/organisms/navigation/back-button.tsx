"use client";

import { ArrowLeft } from "lucide-react";
import { DuoButton } from "@/components/duo";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  color?: "duo-red" | "duo-blue" | "duo-green";
}

const colorClasses = {
  "duo-red": "text-duo-red",
  "duo-blue": "text-duo-blue",
  "duo-green": "text-duo-green",
};

export function BackButton({
  onClick,
  className,
  color = "duo-blue",
}: BackButtonProps) {
  return (
    <DuoButton
      variant="link"
      size="sm"
      onClick={onClick}
      className={cn("mb-4", colorClasses[color], className)}
    >
      <ArrowLeft className="h-5 w-5" />
      Voltar
    </DuoButton>
  );
}
