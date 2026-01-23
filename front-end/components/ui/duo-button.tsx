"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

const duoButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-bold text-base transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 uppercase tracking-wide shadow-lg active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[#58CC02] text-white hover:bg-[#47A302] focus-visible:ring-[#58CC02] shadow-[#58CC02]/30",
        secondary:
          "bg-white text-[#58CC02] hover:bg-gray-50 focus-visible:ring-[#58CC02] border-2 border-transparent",
        outline:
          "bg-transparent text-gray-700 border-2 border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-300",
        "outline-white":
          "bg-transparent text-white border-2 border-white hover:bg-white/10 focus-visible:ring-white",
        blue:
          "bg-[#1CB0F6] text-white hover:bg-[#1A9CE0] focus-visible:ring-[#1CB0F6] shadow-[#1CB0F6]/30",
        orange:
          "bg-[#FF9600] text-white hover:bg-[#E68A00] focus-visible:ring-[#FF9600] shadow-[#FF9600]/30",
        purple:
          "bg-[#CE82FF] text-white hover:bg-[#B870E6] focus-visible:ring-[#CE82FF] shadow-[#CE82FF]/30",
        red:
          "bg-[#FF4B4B] text-white hover:bg-[#E63939] focus-visible:ring-[#FF4B4B] shadow-[#FF4B4B]/30",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300 shadow-none",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        default: "h-12 px-6 text-base",
        lg: "h-14 px-8 text-lg",
        xl: "h-16 px-10 text-xl",
      },
      animation: {
        none: "",
        bounce: "hover:animate-bounce",
        pulse: "hover:animate-pulse",
        scale: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      animation: "scale",
    },
  }
)

export interface DuoButtonProps
  extends Omit<HTMLMotionProps<"button">, "size">,
    VariantProps<typeof duoButtonVariants> {
  asChild?: boolean
  loading?: boolean
}

const DuoButton = React.forwardRef<HTMLButtonElement, DuoButtonProps>(
  (
    {
      className,
      variant,
      size,
      animation,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    if (asChild) {
      return (
        <Slot
          className={cn(duoButtonVariants({ variant, size, animation, className }))}
          {...(props as any)}
        >
          {children}
        </Slot>
      )
    }

    const motionProps = {
      whileHover: animation === "scale" && !isDisabled ? { scale: 1.02, y: -2 } : undefined,
      whileTap: !isDisabled ? { scale: 0.98 } : undefined,
      transition: { type: "spring", stiffness: 400, damping: 17 },
    }

    return (
      <motion.button
        ref={ref}
        className={cn(duoButtonVariants({ variant, size, animation, className }))}
        disabled={isDisabled}
        {...motionProps}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Carregando...
          </span>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

DuoButton.displayName = "DuoButton"

export { DuoButton, duoButtonVariants }

