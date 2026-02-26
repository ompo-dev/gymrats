"use client";

import { ChevronDown } from "lucide-react";
import {
	useEffect,
	useId,
	useRef,
	useState,
	type HTMLAttributes,
	type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface DuoSelectOption {
	value: string;
	label: string;
	icon?: ReactNode;
	description?: string;
	badge?: ReactNode;
	disabled?: boolean;
}

export interface DuoSelectProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
	label?: string;
	options: DuoSelectOption[];
	value?: string;
	placeholder?: string;
	onChange?: (value: string) => void;
	error?: string;
	disabled?: boolean;
}

export function DuoSelect({
	label,
	options,
	value,
	placeholder = "Selecione...",
	onChange,
	error,
	disabled,
	className,
	...props
}: DuoSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const listboxId = useId();
	const labelId = useId();

	const selectedOption = options.find((o) => o.value === value);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
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
				setIsOpen(false);
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
						isOpen ? "border-[var(--duo-primary)]" : "border-[var(--duo-border)]",
						error && "border-[var(--duo-danger)]",
						disabled && "cursor-not-allowed opacity-50",
					)}
					onClick={() => !disabled && setIsOpen(!isOpen)}
					onKeyDown={handleKeyDown}
				>
					<span
						className={cn(
							"flex flex-1 items-center gap-2 truncate text-sm font-semibold",
							selectedOption
								? "text-[var(--duo-fg)]"
								: "text-[var(--duo-fg-muted)]",
						)}
					>
						{selectedOption?.icon}
						<div className="flex min-w-0 flex-1 flex-col items-start">
							<span className="truncate">{selectedOption?.label ?? placeholder}</span>
							{selectedOption?.description && (
								<span className="text-xs font-normal text-[var(--duo-fg-muted)] truncate">
									{selectedOption.description}
								</span>
							)}
						</div>
						{selectedOption?.badge}
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

				<ul
					id={listboxId}
					role="listbox"
					className={cn(
						"absolute z-50 mt-1 w-full rounded-xl border-2 border-[var(--duo-border)] py-1",
						"bg-[var(--duo-bg-card)] shadow-xl shadow-black/20",
						"origin-top transition-all duration-200",
						isOpen
							? "translate-y-0 scale-100 opacity-100"
							: "-translate-y-2 scale-95 opacity-0 pointer-events-none",
					)}
				>
					{options.map((option, index) => (
						<li
							key={option.value}
							role="option"
							aria-selected={option.value === value}
							aria-disabled={option.disabled}
							className={cn(
								"flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-all duration-150",
								"hover:bg-[var(--duo-bg-elevated)]",
								option.value === value &&
									"bg-[var(--duo-primary)]/10 text-[var(--duo-primary)]",
								focusedIndex === index && "bg-[var(--duo-bg-elevated)]",
								option.disabled && "cursor-not-allowed opacity-50",
							)}
							onClick={() => {
								if (option.disabled) return;
								onChange?.(option.value);
								setIsOpen(false);
							}}
						>
							{option.icon && <span className="shrink-0">{option.icon}</span>}
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
				</ul>
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
