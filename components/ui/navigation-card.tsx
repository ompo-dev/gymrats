import * as React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavigationCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color?:
    | "duo-green"
    | "duo-red"
    | "duo-orange"
    | "duo-blue"
    | "duo-yellow"
    | "duo-purple";
  className?: string;
}

const colorClasses = {
  "duo-green": "border-duo-green bg-duo-green/10 hover:bg-duo-green/20",
  "duo-red": "border-duo-red bg-duo-red/10 hover:bg-duo-red/20",
  "duo-orange": "border-duo-orange bg-duo-orange/10 hover:bg-duo-orange/20",
  "duo-blue": "border-duo-blue bg-duo-blue/10 hover:bg-duo-blue/20",
  "duo-yellow": "border-duo-yellow bg-duo-yellow/10 hover:bg-duo-yellow/20",
  "duo-purple": "border-duo-purple bg-duo-purple/10 hover:bg-duo-purple/20",
};

const iconBgClasses = {
  "duo-green": "bg-duo-green",
  "duo-red": "bg-duo-red",
  "duo-orange": "bg-duo-orange",
  "duo-blue": "bg-duo-blue",
  "duo-yellow": "bg-duo-yellow",
  "duo-purple": "bg-duo-purple",
};

export function NavigationCard({
  href,
  icon: Icon,
  title,
  description,
  color = "duo-green",
  className,
}: NavigationCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl border-2 p-4 transition-all active:scale-[0.98]",
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            iconBgClasses[color]
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-duo-text">{title}</h3>
          <p className="text-xs text-duo-gray-dark">{description}</p>
        </div>
      </div>
    </Link>
  );
}
