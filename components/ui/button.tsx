import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-duo-green text-white font-bold uppercase tracking-wider shadow-[0_4px_0_#58A700] hover:bg-duo-green/90 active:shadow-none active:translate-y-[4px] transition-all disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF] disabled:shadow-none disabled:cursor-not-allowed",
        white:
          "bg-white text-duo-green font-bold uppercase tracking-wider shadow-[0_4px_0_#E5E7EB] hover:bg-gray-50 active:shadow-none active:translate-y-[4px] transition-all disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF] disabled:shadow-none disabled:cursor-not-allowed",
        "light-blue":
          "bg-[#1CB0F6] text-white font-bold uppercase tracking-wider shadow-[0_4px_0_#1899D6] hover:bg-[#1CB0F6]/90 active:shadow-none active:translate-y-[4px] transition-all disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF] disabled:shadow-none disabled:cursor-not-allowed",
        disabled:
          "bg-[#E5E5E5] text-[#AFAFAF] font-bold uppercase tracking-wider cursor-not-allowed rounded-2xl text-[13px] leading-[18px]",
        destructive:
          "bg-red-50 text-red-600 border-2 border-red-300 font-bold uppercase tracking-wider shadow-[0_4px_0_#FCA5A5] hover:bg-red-100 active:shadow-none active:translate-y-[4px] transition-all disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF] disabled:shadow-none disabled:cursor-not-allowed",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[50px] rounded-2xl text-[13.2px] leading-[18px] px-4",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-sm",
        lg: "h-12 rounded-2xl px-6 has-[>svg]:px-4 text-base",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    />
  );
}

export { Button, buttonVariants };
