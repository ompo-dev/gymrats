"use client";

import { ChevronRight, MapPin, Star } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";

export interface AcademyListItemCardProps {
  image: string;
  name: string;
  onClick: () => void;
  badge?: { label: string; variant?: "green" | "yellow" };
  planName?: string;
  address?: string;
  rating?: number;
  totalReviews?: number;
  distance?: number;
  isSelected?: boolean;
  hoverColor?: "duo-blue" | "duo-primary";
  trailingAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function AcademyListItemCard({
  image,
  name,
  onClick,
  badge,
  planName,
  address,
  rating,
  totalReviews,
  distance,
  isSelected,
  hoverColor = "duo-blue",
  trailingAction,
  children,
  className,
}: AcademyListItemCardProps) {
  const hasMapMeta = rating != null || distance != null;
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
        isSelected && "ring-2 ring-duo-blue",
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-duo-text truncate">{name}</h3>
            {badge && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0",
                  badge.variant === "yellow"
                    ? "bg-duo-yellow text-white"
                    : "bg-duo-green text-white",
                )}
              >
                {badge.label}
              </span>
            )}
          </div>
          {hasMapMeta && (
            <div className="mt-1 flex items-center gap-3 text-xs text-duo-gray-dark">
              {rating != null && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-duo-yellow text-duo-yellow" />
                  <span className="font-bold">{rating}</span>
                  {totalReviews != null && (
                    <span>({totalReviews})</span>
                  )}
                </div>
              )}
              {distance != null && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="font-bold">
                    {distance.toFixed(1)} km
                  </span>
                </div>
              )}
            </div>
          )}
          {planName && !hasMapMeta && (
            <div className="mt-1 flex items-center gap-3 text-xs text-duo-gray-dark">
              <span className="font-bold">{planName}</span>
            </div>
          )}
          {address && (
            <p className="mt-1 text-xs text-duo-gray-dark flex items-center gap-1 min-w-0">
              <MapPin className="h-3 w-3 shrink-0 flex-none" />
              <span className="truncate block">{address}</span>
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
      {children}
    </DuoCard.Root>
  );
}
