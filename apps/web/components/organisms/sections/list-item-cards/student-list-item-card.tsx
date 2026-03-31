"use client";

import { ChevronRight } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";

export interface StudentListItemCardProps {
  image: string;
  name: string;
  onClick?: () => void;
  subtitle?: string;
  trailingAction?: React.ReactNode;
  className?: string;
}

export function StudentListItemCard({
  image,
  name,
  onClick,
  subtitle,
  trailingAction,
  className,
}: StudentListItemCardProps) {
  const isClickable = !!onClick;

  return (
    <DuoCard.Root
      variant="default"
      size="sm"
      onClick={onClick}
      className={cn(
        !isClickable &&
          "cursor-default hover:scale-100 hover:border-duo-border hover:shadow-none",
        isClickable &&
          "cursor-pointer transition-all hover:border-duo-primary/40 active:scale-[0.98]",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-duo-border bg-gray-100">
          <img
            src={image || "/placeholder.svg"}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-duo-text truncate">{name}</p>
          {subtitle && (
            <p className="text-xs text-duo-gray-dark truncate">{subtitle}</p>
          )}
        </div>
        {trailingAction && (
          <div className="shrink-0" onClickCapture={(e) => e.stopPropagation()}>
            {trailingAction}
          </div>
        )}
        {isClickable && !trailingAction && (
          <ChevronRight className="h-4 w-4 shrink-0 text-duo-gray-dark" />
        )}
      </div>
    </DuoCard.Root>
  );
}
