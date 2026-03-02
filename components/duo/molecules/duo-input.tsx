"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";
import { cn } from "@/lib/utils";

export interface DuoInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

function DuoInputRoot({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)} {...props}>
      {children}
    </div>
  );
}

function DuoInputLabel({
  htmlFor,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLLabelElement> & { htmlFor: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-bold uppercase tracking-wider text-[var(--duo-fg-muted)]",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

const DuoInputField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    error?: boolean;
    leftAddon?: boolean;
    rightAddon?: boolean;
  }
>(({ error, leftAddon, rightAddon, className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "w-full rounded-xl border-2 bg-[var(--duo-bg-card)] px-4 py-3 text-base text-[var(--duo-fg)]",
      type === "time" &&
        "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
      "placeholder:opacity-60 placeholder:text-[var(--duo-fg-muted)]",
      "transition-all duration-200 ease-out",
      "focus:border-[var(--duo-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--duo-primary)]/20",
      "hover:border-[var(--duo-fg-muted)]",
      error
        ? "border-[var(--duo-danger)] focus:border-[var(--duo-danger)] focus:ring-[var(--duo-danger)]/20"
        : "border-[var(--duo-border)]",
      leftAddon && "pl-10",
      rightAddon && "pr-10",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
DuoInputField.displayName = "DuoInputField";

function DuoInputAddon({
  position,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { position: "left" | "right" }) {
  return (
    <span
      className={cn(
        "absolute top-1/2 -translate-y-1/2 text-[var(--duo-fg-muted)] transition-colors duration-200 group-focus-within:text-[var(--duo-primary)]",
        position === "left" && "left-3",
        position === "right" && "right-3",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function DuoInputError({
  id,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { id?: string }) {
  return (
    <span
      id={id}
      className={cn(
        "text-xs font-semibold text-[var(--duo-danger)] animate-in slide-in-from-top-1 duration-200",
        className,
      )}
      role="alert"
      {...props}
    >
      {children}
    </span>
  );
}

function DuoInputHelper({
  id,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { id?: string }) {
  return (
    <span
      id={id}
      className={cn("text-xs text-[var(--duo-fg-muted)]", className)}
      {...props}
    >
      {children}
    </span>
  );
}

const DuoInputSimple = forwardRef<HTMLInputElement, DuoInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      id: propId,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const id = propId ?? autoId;
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText ? `${id}-helper` : undefined;

    return (
      <DuoInputRoot className={className}>
        {label && <DuoInputLabel htmlFor={id}>{label}</DuoInputLabel>}
        <div className="group relative">
          {leftIcon && (
            <DuoInputAddon position="left">{leftIcon}</DuoInputAddon>
          )}
          <DuoInputField
            ref={ref}
            id={id}
            aria-describedby={errorId ?? helperId}
            aria-invalid={!!error}
            error={!!error}
            leftAddon={!!leftIcon}
            rightAddon={!!rightIcon}
            {...props}
          />
          {rightIcon && (
            <DuoInputAddon position="right">{rightIcon}</DuoInputAddon>
          )}
        </div>
        {error && <DuoInputError id={errorId}>{error}</DuoInputError>}
        {!error && helperText && (
          <DuoInputHelper id={helperId}>{helperText}</DuoInputHelper>
        )}
      </DuoInputRoot>
    );
  },
);
DuoInputSimple.displayName = "DuoInputSimple";

export const DuoInput = {
  Root: DuoInputRoot,
  Label: DuoInputLabel,
  Field: DuoInputField,
  Addon: DuoInputAddon,
  Error: DuoInputError,
  Helper: DuoInputHelper,
  Simple: DuoInputSimple,
};
