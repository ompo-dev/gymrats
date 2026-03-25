import { Loader2, type LucideIcon, Pencil } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { DuoButton } from "@/components/duo";
import { cn } from "@/lib/utils";

export interface UnitSectionCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  sectionLabel: string;
  title: string;
  icon?: LucideIcon;
  buttonHref?: string;
  buttonIcon?: LucideIcon;
  onButtonClick?: () => void;
  additionalAction?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function UnitSectionCard({
  sectionLabel,
  title,
  icon: Icon,
  buttonHref,
  buttonIcon: ButtonIcon,
  onButtonClick,
  additionalAction,
  isLoading,
  className,
  ...props
}: UnitSectionCardProps) {
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-0.5 rounded-[14px]",
        "bg-duo-green shadow-[0_4px_0_#48A502]",
        "overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* Seção de conteúdo */}
      <div className="flex flex-col items-start gap-2.5 px-4 py-[15px] flex-1 min-w-0">
        <div className="flex flex-col items-start gap-0 w-full">
          {/* Label pequeno */}
          <div className="flex items-center w-full">
            <span className="font-extrabold text-[13px] leading-[22px] text-[#CEF2AD]">
              {sectionLabel}
            </span>
          </div>
          {/* Título */}
          <div className="flex items-start w-full">
            <h2 className="font-extrabold text-[20px] leading-[24px] text-white line-clamp-2">
              {title}
            </h2>
          </div>
        </div>
      </div>

      {/* Seção do ícone */}
      {Icon && !buttonHref && !onButtonClick && (
        <div className="flex flex-row items-center justify-center px-[15px] py-[26px] bg-[var(--duo-primary)] flex-none self-stretch border-l-2 border-[var(--duo-primary-dark)]">
          <Icon className="h-[22px] w-[22px] text-white" />
        </div>
      )}

      {/* Ação adicional (ex: botão resetar) */}
      {additionalAction && (
        <div className="flex items-center px-3 border-l-2 border-[var(--duo-primary-dark)]">
          {additionalAction}
        </div>
      )}

      {/* Seção do botão */}
      {(buttonHref || onButtonClick) && (
        <div className="flex flex-row items-center justify-center px-4 py-4 bg-[var(--duo-primary)] flex-none self-stretch border-l-2 border-[var(--duo-primary-dark)]">
          <DuoButton
            asChild={!!buttonHref}
            variant="white"
            size="icon-lg"
            className="h-10 w-10 cursor-pointer"
            onClick={onButtonClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-duo-green" />
            ) : buttonHref ? (
              <Link href={buttonHref}>
                {ButtonIcon ? (
                  <ButtonIcon className="h-6 w-6" />
                ) : (
                  <Pencil className="h-6 w-6" />
                )}
              </Link>
            ) : ButtonIcon ? (
              <ButtonIcon className="h-6 w-6" />
            ) : (
              <Pencil className="h-6 w-6" />
            )}
          </DuoButton>
        </div>
      )}
    </div>
  );
}
