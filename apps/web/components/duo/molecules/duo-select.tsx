"use client";

import { ChevronDown } from "lucide-react";
import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** Altura máxima do dropdown (max-h-60 = 240px) - usado para decidir direção */
const DROPDOWN_MAX_HEIGHT = 240;

export interface DuoSelectOption {
  value: string;
  label: string;
  emoji?: string;
  icon?: ReactNode;
  description?: string;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface DuoSelectProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label?: string;
  options: DuoSelectOption[];
  value?: string | string[];
  placeholder?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  /** Quando true, permite múltipla seleção. value deve ser string[], onChange recebe o valor clicado (parent faz toggle). */
  multiple?: boolean;
}

function DuoSelectSimple({
  label,
  options,
  value,
  placeholder = "Selecione...",
  onChange,
  error,
  disabled,
  className,
  multiple = false,
  ...props
}: DuoSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [_opensUpward, setOpensUpward] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const labelId = useId();

  // Calcula posição do dropdown e direção (cima/baixo) - usa Portal com position fixed - Memoizado para evitar loops
  const updateDropdownPosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const opensUp = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;
    setOpensUpward(opensUp);
    setDropdownStyle({
      left: rect.left,
      width: rect.width,
      top: opensUp ? rect.top - DROPDOWN_MAX_HEIGHT - 4 : rect.bottom + 4,
    });
  }, [triggerRef]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setDropdownStyle(null);
      return;
    }
    updateDropdownPosition();
  }, [isOpen, updateDropdownPosition]);

  // Atualiza posição em scroll/resize quando aberto
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);

  const valueArr = Array.isArray(value) ? value : value ? [value] : [];
  const selectedOption = multiple
    ? undefined
    : options.find((o) => o.value === value);
  const selectedOptions = multiple
    ? options.filter((o) => valueArr.includes(o.value))
    : [];
  const isSelected = (optValue: string) =>
    multiple ? valueArr.includes(optValue) : value === optValue;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const isInsideTrigger = containerRef.current?.contains(target);
      const isInsideDropdown = listboxRef.current?.contains(target);
      if (!isInsideTrigger && !isInsideDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isOpen && focusedIndex >= 0 && !options[focusedIndex].disabled) {
        onChange?.(options[focusedIndex].value);
        if (!multiple) setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...props}
    >
      {label && (
        <span
          id={labelId}
          className="text-sm font-bold uppercase tracking-wider text-[var(--duo-fg-muted)]"
        >
          {label}
        </span>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-labelledby={label ? labelId : undefined}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left",
            "bg-[var(--duo-bg-card)] transition-all duration-200",
            "focus:border-[var(--duo-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--duo-primary)]/20",
            "hover:border-[var(--duo-fg-muted)]",
            isOpen
              ? "border-[var(--duo-primary)]"
              : "border-[var(--duo-border)]",
            error && "border-[var(--duo-danger)]",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
        >
          <span
            className={cn(
              "flex flex-1 items-center gap-2 truncate text-sm font-semibold",
              selectedOption || selectedOptions.length > 0
                ? "text-[var(--duo-fg)]"
                : "text-[var(--duo-fg-muted)]",
            )}
          >
            {multiple ? (
              <span className="truncate">
                {selectedOptions.length > 0
                  ? `${selectedOptions.length} selecionado${selectedOptions.length !== 1 ? "s" : ""}`
                  : placeholder}
              </span>
            ) : (
              <>
                {selectedOption?.emoji && (
                  <span className="shrink-0 text-lg">
                    {selectedOption.emoji}
                  </span>
                )}
                {selectedOption?.icon}
                <div className="flex min-w-0 flex-1 flex-col items-start">
                  <span className="truncate">
                    {selectedOption?.label ?? placeholder}
                  </span>
                  {selectedOption?.description && (
                    <span className="text-xs font-normal text-[var(--duo-fg-muted)] truncate">
                      {selectedOption.description}
                    </span>
                  )}
                </div>
                {selectedOption?.badge}
              </>
            )}
          </span>
          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-[var(--duo-fg-muted)] transition-transform duration-300",
              isOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown via Portal para evitar z-index/stacking context e cliques indo para elementos abaixo */}
        {isOpen &&
          dropdownStyle &&
          typeof document !== "undefined" &&
          createPortal(
            <ul
              ref={listboxRef}
              id={listboxId}
              aria-multiselectable={multiple}
              className={cn(
                "fixed z-[9999] max-h-60 overflow-y-auto rounded-xl border-2 border-[var(--duo-border)] py-1",
                "bg-[var(--duo-bg-card)] shadow-xl shadow-black/20",
                "animate-in fade-in zoom-in-95 duration-200",
              )}
              style={{
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  aria-selected={isSelected(option.value)}
                  aria-disabled={option.disabled}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-all duration-150",
                    "hover:bg-[var(--duo-bg-elevated)]",
                    isSelected(option.value) &&
                      "bg-[var(--duo-primary)]/10 text-[var(--duo-primary)]",
                    focusedIndex === index && "bg-[var(--duo-bg-elevated)]",
                    option.disabled && "cursor-not-allowed opacity-50",
                  )}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    if (option.disabled) return;
                    onChange?.(option.value);
                    if (!multiple) setIsOpen(false);
                  }}
                >
                  {multiple && isSelected(option.value) && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--duo-primary)] text-white text-xs">
                      ✓
                    </span>
                  )}
                  {option.emoji && (
                    <span className="shrink-0 text-lg">{option.emoji}</span>
                  )}
                  {option.icon && (
                    <span className="shrink-0">{option.icon}</span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold text-[var(--duo-fg)]">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-xs text-[var(--duo-fg-muted)]">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {option.badge}
                </li>
              ))}
            </ul>,
            document.body,
          )}
      </div>
      {error && (
        <span
          className="text-xs font-semibold text-[var(--duo-danger)]"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}

export const DuoSelect = {
  Simple: DuoSelectSimple,
};
