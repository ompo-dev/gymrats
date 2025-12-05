import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "./button";
import { Book } from "lucide-react";

export interface SectionCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: LucideIcon;
  title: string;
  headerAction?: React.ReactNode;
  sectionLabel?: string;
  buttonHref?: string;
  buttonText?: string;
  variant?: "default" | "small" | "highlighted" | "blue" | "orange" | "yellow";
}

export function SectionCard({
  icon: Icon,
  title,
  headerAction,
  children,
  className,
  sectionLabel,
  buttonHref,
  buttonText = "Ver mais",
  variant,
  ...props
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-[14px] bg-[#5ACD05] px-4 py-[15px] flex flex-row items-center justify-between gap-4 drop-shadow-[0_4px_0_#48A502] min-h-[76px]",
        className
      )}
      {...props}
    >
      {/* Conteúdo à esquerda */}
      <div className="flex flex-col items-start flex-1 min-w-0">
        {sectionLabel && (
          <div className="w-full h-[22px] flex items-center text-[13px] font-extrabold leading-[22px] text-[#CEF2AD] uppercase mb-0">
            {sectionLabel}
          </div>
        )}
        <div className="w-full h-6 flex items-center text-xl font-extrabold leading-6 text-[#FFFDFE]">
          {title}
        </div>
        {children && <div className="w-full mt-2.5">{children}</div>}
      </div>

      {/* Botão à direita */}
      {buttonHref && (
        <div className="shrink-0">
          <Button variant="white" size="sm" asChild>
            <Link href={buttonHref}>
              <Book className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
      {!buttonHref && headerAction && (
        <div className="shrink-0">{headerAction}</div>
      )}
    </div>
  );
}
