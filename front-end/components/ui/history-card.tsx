import * as React from "react"
import { DuoCard } from "./duo-card"
import { StatusBadge } from "./status-badge"
import { cn } from "@/lib/utils"

export interface HistoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  date: string | Date
  status?: "excelente" | "bom" | "regular" | "ruim"
  metadata?: Array<{
    icon?: string
    label: string
  }>
}

export function HistoryCard({
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
    
    // Verificar se a data é válida
    if (isNaN(d.getTime())) {
      return "Data inválida";
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Resetar horas para comparar apenas as datas
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Hoje";
    }
    if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return "Ontem";
    }
    
    // Formatar data: "27 de dez" ou "27 de dez de 2025"
    const day = d.getDate();
    const month = d.toLocaleDateString("pt-BR", { month: "short" });
    const year = d.getFullYear() !== today.getFullYear() ? ` de ${d.getFullYear()}` : "";
    
    return `${day} de ${month}${year}`;
  };
  
  const formattedDate = formatDate(date);

  return (
    <DuoCard
      variant="default"
      size="md"
      className={cn("bg-gray-50", className)}
      {...props}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="font-bold text-duo-text">{title}</div>
          <div className="text-xs text-duo-gray-dark">{formattedDate}</div>
        </div>
        {status && (
          <StatusBadge
            status={status}
            label={status}
          />
        )}
      </div>
      {metadata.length > 0 && (
        <div className="flex gap-4 text-sm text-duo-gray-dark">
          {metadata.map((item, index) => (
            <div key={index}>
              {item.icon && <span>{item.icon} </span>}
              {item.label}
            </div>
          ))}
        </div>
      )}
    </DuoCard>
  )
}
