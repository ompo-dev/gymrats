"use client";

import { Book } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { Button } from "./button";
import Link from "next/link";

const sectionCardVariants = cva(
  "relative flex flex-row items-stretch gap-0 rounded-[14px] filter drop-shadow-[0px_4px_0px] transition-all hover:scale-[1.01] overflow-hidden",
  {
    variants: {
      variant: {
        default: "drop-shadow-[0px_4px_0px_#48A502]",
        blue: "drop-shadow-[0px_4px_0px_#1899D6]",
        orange: "drop-shadow-[0px_4px_0px_#E68500]",
        purple: "drop-shadow-[0px_4px_0px_#B870E6]",
        red: "drop-shadow-[0px_4px_0px_#E63939]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface SectionCardProps extends VariantProps<typeof sectionCardVariants> {
  sectionLabel: string;
  title: string;
  showButton?: boolean;
  buttonHref?: string;
  className?: string;
}

export function SectionCard({
  sectionLabel,
  title,
  variant,
  className,
  showButton = true,
  buttonHref = "/student?tab=education",
}: SectionCardProps) {
  const cardClasses = cn(sectionCardVariants({ variant }), className);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      className={cardClasses}
    >
      {/* Main Content */}
      <div
        className={cn(
          "relative flex flex-col items-start px-4 py-[15px] gap-[10px] flex-1 min-w-0 rounded-[14px]",
          variant === "default" && "bg-[#5ACD05]",
          variant === "blue" && "bg-[#1CB0F6]",
          variant === "orange" && "bg-[#FF9600]",
          variant === "purple" && "bg-[#CE82FF]",
          variant === "red" && "bg-[#FF4B4B]"
        )}
        style={{ minHeight: "76px" }}
      >
        {/* Button com ícone de livro - Centralizado verticalmente */}
        {showButton && (
          <Link
            href={buttonHref}
            className="absolute top-1/2 -translate-y-1/2 right-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="white"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <Book className="h-7 w-7" />
            </Button>
          </Link>
        )}

        <div className="flex flex-col items-start gap-0 w-full pr-16">
          {/* Section Label */}
          <div
            className="w-full font-nunito font-extrabold text-[13px] leading-[22px] flex items-center text-[#CEF2AD] mb-[2px]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {sectionLabel}
          </div>
          {/* Title - Permite múltiplas linhas */}
          <div
            className="w-full font-nunito font-extrabold text-[20px] leading-[24px] text-[#FFFDFE] wrap-break-word"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {title}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
