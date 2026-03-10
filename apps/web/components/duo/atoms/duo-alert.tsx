"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
} from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type DuoAlertVariant = "info" | "success" | "warning" | "danger";

interface DuoAlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: DuoAlertVariant;
  icon?: LucideIcon;
  title?: string;
}

const variantStyles: Record<DuoAlertVariant, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-orange-50 border-orange-200 text-orange-800",
  danger: "bg-red-50 border-red-200 text-red-800",
};

const iconMap: Record<DuoAlertVariant, LucideIcon> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const iconStyles: Record<DuoAlertVariant, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-orange-500",
  danger: "text-red-500",
};

export function DuoAlert({
  variant = "info",
  icon: CustomIcon,
  title,
  className,
  children,
  ...props
}: DuoAlertProps) {
  const Icon = CustomIcon || iconMap[variant];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border-2 p-4 animate-in fade-in slide-in-from-top-2 duration-300",
        variantStyles[variant],
        className,
      )}
      role="alert"
      {...props}
    >
      <div className="flex-shrink-0">
        <Icon className={cn("h-5 w-5", iconStyles[variant])} />
      </div>
      <div className="flex-1">
        {title && (
          <h4 className="text-sm font-bold leading-none mb-1">{title}</h4>
        )}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
