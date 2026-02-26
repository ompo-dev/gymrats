"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface DuoModalProps extends HTMLAttributes<HTMLDivElement> {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	size?: "sm" | "md" | "lg" | "full";
}

const sizeStyles = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	full: "max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]",
};

export function DuoModal({
	isOpen,
	onClose,
	title,
	size = "md",
	className,
	children,
	...props
}: DuoModalProps) {
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
				aria-label={title ?? "Dialog"}
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
				{title && (
					<div className="flex items-center justify-between border-b border-[var(--duo-border)] px-5 py-4">
						<h2 className="text-lg font-bold text-[var(--duo-fg)]">{title}</h2>
						<button
							onClick={onClose}
							className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--duo-fg-muted)] transition-all duration-200 hover:bg-[var(--duo-bg-elevated)] hover:text-[var(--duo-fg)] active:scale-90"
							aria-label="Fechar"
						>
							<X size={18} />
						</button>
					</div>
				)}
				<div className="p-5">{children}</div>
			</div>
		</div>
	);
}
