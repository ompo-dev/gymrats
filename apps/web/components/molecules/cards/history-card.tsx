import type * as React from "react";
import { DuoBadge, DuoCard } from "@/components/duo";

export interface HistoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  date: string | Date;
  status?: "excelente" | "bom" | "regular" | "ruim";
  metadata?: Array<{
    icon?: string;
    label: string;
  }>;
}

function HistoryCardSimple({
  title,
  date,
  status,
  metadata = [],
  className,
  ...props
}: HistoryCardProps) {
  // Formatar data de forma amigável: "Hoje", "Ontem" ou data formatada
  const formatDate = (dateValue: string | Date): string => {
    const d = typeof dateValue === "string" ? new Date(dateValue) : dateValue;

    if (Number.isNaN(d.getTime())) {
      return "Data inválida";
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    );

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Hoje";
    }
    if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return "Ontem";
    }

    const day = d.getDate();
    const month = d.toLocaleDateString("pt-BR", { month: "short" });
    const year =
      d.getFullYear() !== today.getFullYear() ? ` de ${d.getFullYear()}` : "";

    return `${day} de ${month}${year}`;
  };

  const formattedDate = formatDate(date);

  return (
    <DuoCard.Root variant="default" size="md" className={className} {...props}>
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="font-bold text-[var(--duo-fg)]">{title}</div>
          <div className="text-xs text-[var(--duo-fg-muted)]">
            {formattedDate}
          </div>
        </div>
        {status && (
          <DuoBadge
            variant={
              status === "excelente"
                ? "success"
                : status === "bom"
                  ? "secondary"
                  : status === "regular"
                    ? "warning"
                    : "danger"
            }
            size="sm"
          >
            {status}
          </DuoBadge>
        )}
      </div>
      {metadata.length > 0 && (
        <div className="flex gap-4 text-sm text-[var(--duo-fg-muted)]">
          {metadata.map((item, index) => (
            <div key={index}>
              {item.icon && <span>{item.icon} </span>}
              {item.label}
            </div>
          ))}
        </div>
      )}
    </DuoCard.Root>
  );
}

export const HistoryCard = { Simple: HistoryCardSimple };
