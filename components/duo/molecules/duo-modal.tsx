"use client";

import { X } from "lucide-react";
import { type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  full: "max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]",
};

interface DuoModalRootProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "full";
  children: ReactNode;
}

function DuoModalRoot({
  isOpen,
  onClose,
  size = "md",
  className,
  children,
  ...props
}: DuoModalRootProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-in fade-in duration-200 absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Dialog"
        tabIndex={-1}
        className={cn(
          "relative w-full rounded-2xl border border-[var(--duo-border)] bg-[var(--duo-bg-card)]",
          "shadow-2xl shadow-black/30",
          "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300",
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

function DuoModalBackdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="animate-in fade-in duration-200 absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

function DuoModalHeader({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  if (!title && !children) return null;
  return (
    <div className="flex items-center justify-between border-b border-[var(--duo-border)] px-5 py-4">
      {title && (
        <h2 className="text-lg font-bold text-[var(--duo-fg)]">{title}</h2>
      )}
      {children}
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--duo-fg-muted)] transition-all duration-200 hover:bg-[var(--duo-bg-elevated)] hover:text-[var(--duo-fg)] active:scale-90"
        aria-label="Fechar"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function DuoModalContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

interface DuoModalSimpleProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "full";
  children: ReactNode;
}

function DuoModalSimple({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
  className,
  ...props
}: DuoModalSimpleProps) {
  return (
    <DuoModalRoot
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      className={className}
      {...props}
    >
      {title && <DuoModalHeader title={title} onClose={onClose} />}
      <DuoModalContent>{children}</DuoModalContent>
    </DuoModalRoot>
  );
}

export const DuoModal = {
  Root: DuoModalRoot,
  Backdrop: DuoModalBackdrop,
  Header: DuoModalHeader,
  Content: DuoModalContent,
  /** Conveniência: aceita props (isOpen, onClose, title, size) e renderiza a composição internamente */
  Simple: DuoModalSimple,
};
