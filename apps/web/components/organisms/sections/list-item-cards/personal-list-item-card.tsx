"use client";

import { ChevronRight, MapPin, Monitor } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";

export interface PersonalListItemCardProps {
  image: string;
  name: string;
  onClick: () => void;
  badge?: { label: string };
  email?: string;
  subtitle?: string;
  atendimentoPresencial?: boolean;
  atendimentoRemoto?: boolean;
  distance?: number;
  isSelected?: boolean;
  hoverColor?: "duo-blue" | "duo-primary";
  trailingAction?: React.ReactNode;
  className?: string;
}

export function PersonalListItemCard({
  image,
  name,
  onClick,
  badge,
  email,
  subtitle,
  atendimentoPresencial,
  atendimentoRemoto,
  distance,
  isSelected,
  hoverColor = "duo-primary",
  trailingAction,
  className,
}: PersonalListItemCardProps) {
  const hasMeta =
    atendimentoPresencial || atendimentoRemoto || distance != null;
  const hoverClass =
    hoverColor === "duo-primary"
      ? "hover:border-duo-primary/40"
      : "hover:border-duo-blue";

  return (
    <DuoCard.Root
      variant="default"
      size="default"
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all active:scale-[0.98]",
        hoverClass,
        isSelected && "ring-2 ring-duo-primary",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-duo-border bg-gray-100">
          <img
            src={image || "/placeholder.svg"}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-duo-text truncate">{name}</h3>
            {badge && (
              <span className="rounded-full bg-duo-green px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
                {badge.label}
              </span>
            )}
          </div>
          {hasMeta && (
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-duo-gray-dark">
              {atendimentoPresencial && (
                <span className="inline-flex items-center gap-1 rounded-full bg-duo-blue/10 px-2 py-0.5 font-bold text-duo-blue">
                  <MapPin className="h-3 w-3" />
                  Presencial
                </span>
              )}
              {atendimentoRemoto && (
                <span className="inline-flex items-center gap-1 rounded-full bg-duo-purple/10 px-2 py-0.5 font-bold text-duo-purple">
                  <Monitor className="h-3 w-3" />
                  Remoto
                </span>
              )}
              {distance != null && (
                <span className="font-bold">
                  {distance.toFixed(1)} km
                </span>
              )}
            </div>
          )}
          {email && !hasMeta && (
            <p className="mt-1 text-xs text-duo-gray-dark truncate">{email}</p>
          )}
          {subtitle && (
            <p className="mt-1 text-xs text-duo-gray-dark truncate">
              {subtitle}
            </p>
          )}
        </div>
        {trailingAction && (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {trailingAction}
          </div>
        )}
        <ChevronRight
          className={cn(
            "h-5 w-5 shrink-0 text-duo-gray-dark transition-transform",
            isSelected && "rotate-90",
          )}
        />
      </div>
    </DuoCard.Root>
  );
}
