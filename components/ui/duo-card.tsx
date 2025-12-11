"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const duoCardVariants = cva("bg-white transition-all", {
  variants: {
    variant: {
      default: "rounded-2xl border-2 border-gray-300 shadow-[0_4px_0_#D1D5DB]",
      small: "rounded-xl border-2 border-gray-300 shadow-[0_2px_0_#D1D5DB]",
      highlighted:
        "rounded-xl border-2 border-duo-green bg-duo-green/10 shadow-[0_2px_0_#58A700]",
      blue: "rounded-xl border-2 border-duo-blue bg-duo-blue/10 shadow-[0_2px_0_#1899D6]",
      orange:
        "rounded-xl border-2 border-duo-orange bg-duo-orange/10 shadow-[0_2px_0_#E68A00]",
      yellow:
        "rounded-xl border-2 border-duo-yellow bg-duo-yellow/10 shadow-[0_2px_0_#E6B800]",
    },
    size: {
      default: "p-6",
      sm: "p-3",
      md: "p-4",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface DuoCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof duoCardVariants> {}

function DuoCard({ className, variant, size, ...props }: DuoCardProps) {
  return (
    <div
      className={cn(duoCardVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { DuoCard, duoCardVariants };
