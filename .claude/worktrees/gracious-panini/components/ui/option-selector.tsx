"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Option {
	value: string;
	label: string;
	emoji?: string;
	icon?: React.ReactNode;
	description?: string;
}

interface OptionSelectorProps {
	options: Option[];
	value: string | string[];
	onChange: (value: string) => void;
	multiple?: boolean;
	layout?: "grid" | "list";
	columns?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
	size?: "sm" | "md" | "lg";
	showCheck?: boolean;
	textAlign?: "left" | "center" | "right";
	className?: string;
	delay?: number;
	animate?: boolean;
	label?: string;
	ariaLabel?: string;
	ariaLabelledBy?: string;
}

// Componente auxiliar para garantir que a animação de tap complete mesmo em cliques rápidos
const TapButton = React.forwardRef<
	HTMLButtonElement,
	React.ComponentProps<typeof motion.button> & { selected: boolean }
>(({ onClick, selected, animate, transition, ...props }, ref) => {
	const [isTapping, setIsTapping] = useState(false);

	const handlePointerDown = () => {
		setIsTapping(true);
	};

	const handlePointerUp = () => {
		setTimeout(() => {
			setIsTapping(false);
		}, 250);
	};

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		onClick?.(e);
	};

	const animateValue =
		typeof animate === "object" && animate !== null && !Array.isArray(animate)
			? animate
			: {};
	const transitionValue =
		typeof transition === "object" &&
		transition !== null &&
		!Array.isArray(transition)
			? transition
			: {};

	return (
		<motion.button
			ref={ref}
			{...props}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerUp}
			onClick={handleClick}
			animate={{
				...animateValue,
				y: isTapping ? 4 : 0,
				boxShadow: isTapping
					? selected
						? "0 0px 0 #58A700"
						: "0 0px 0 #D1D5DB"
					: selected
						? "0 4px 0 #58A700"
						: "0 4px 0 #D1D5DB",
			}}
			transition={{
				...transitionValue,
				y: { duration: 0.2, ease: "easeInOut" },
				boxShadow: { duration: 0.2, ease: "easeInOut" },
			}}
			whileTap={{
				y: 4,
				boxShadow: selected ? "0 0px 0 #58A700" : "0 0px 0 #D1D5DB",
				transition: { duration: 0.2, ease: "easeInOut" },
			}}
		/>
	);
});

TapButton.displayName = "TapButton";

export function OptionSelector({
	options,
	value,
	onChange,
	multiple = false,
	layout = "grid",
	columns = 2,
	size = "md",
	showCheck = false,
	textAlign = "center",
	className,
	delay = 0,
	animate = true,
	label,
	ariaLabel,
	ariaLabelledBy,
}: OptionSelectorProps) {
	const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

	// Gerar ID estável baseado nos valores das opções, garantindo consistência entre servidor e cliente
	const stableId = useMemo(() => {
		const optionsHash = options.map((o) => o.value).join("-");
		// Usar um hash simples e determinístico
		let hash = 0;
		for (let i = 0; i < optionsHash.length; i++) {
			const char = optionsHash.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return `option-group-${Math.abs(hash)}`;
	}, [options]);

	const isSelected = (optionValue: string) => {
		if (multiple) {
			return Array.isArray(value) && value.includes(optionValue);
		}
		return value === optionValue;
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLButtonElement>,
		index: number,
	) => {
		let nextIndex = index;
		const totalOptions = options.length;

		switch (e.key) {
			case "ArrowRight":
			case "ArrowDown":
				e.preventDefault();
				nextIndex = (index + 1) % totalOptions;
				break;
			case "ArrowLeft":
			case "ArrowUp":
				e.preventDefault();
				nextIndex = (index - 1 + totalOptions) % totalOptions;
				break;
			case "Home":
				e.preventDefault();
				nextIndex = 0;
				break;
			case "End":
				e.preventDefault();
				nextIndex = totalOptions - 1;
				break;
			case " ":
			case "Enter":
				e.preventDefault();
				onChange(options[index].value);
				return;
			default:
				return;
		}

		buttonRefs.current[nextIndex]?.focus();
	};

	const sizeClasses = {
		sm: "py-2 px-3 text-sm",
		md: "py-3 px-4",
		lg: "py-4 px-6 text-lg",
	};

	const gridCols = {
		1: "grid-cols-1",
		2: "grid-cols-2",
		3: "grid-cols-3",
		4: "grid-cols-4",
		5: "grid-cols-5",
		6: "grid-cols-6",
		7: "grid-cols-7",
	};

	// Detecta se algum item tem texto muito longo e precisa de ajuste
	// Só aplica ajuste se: columns === 3, options.length === 3, e algum item tem mais de 12 caracteres
	const getLongItemIndex = () => {
		if (layout !== "grid" || options.length === 0) return -1;
		// Só aplica a regra especial se tiver 3 colunas e 3 itens
		if (columns === 3 && options.length === 3) {
			const longItemIndex = options.findIndex((opt) => opt.label.length > 12);
			return longItemIndex;
		}
		return -1;
	};

	const longItemIndex = getLongItemIndex();
	const needsAdjustment = longItemIndex !== -1;

	if (layout === "list") {
		const labelId = label ? `${stableId}-label` : undefined;
		const staticBoxShadow = (selected: boolean) =>
			selected ? "0 4px 0 #58A700" : "0 4px 0 #D1D5DB";

		return (
			<div className={cn("space-y-3", className)} suppressHydrationWarning>
				{label && (
					<label
						id={labelId}
						className="mb-3 block text-sm font-bold text-gray-900"
					>
						{label}
					</label>
				)}
				<div
					role={multiple ? "group" : "radiogroup"}
					aria-label={ariaLabel || (label ? undefined : "Opções de seleção")}
					aria-labelledby={ariaLabelledBy || labelId}
					className="space-y-3"
					suppressHydrationWarning
				>
					{options.map((option, index) => {
						const selected = isSelected(option.value);
						const optionId = `${stableId}-option-${index}`;
						const descriptionId = option.description
							? `${optionId}-description`
							: undefined;

						// SEMPRE renderizar TODOS os botões, sem nenhuma condição
						// Garantir HTML idêntico entre servidor e cliente
						return (
							<button
								key={`${stableId}-${option.value}-${index}`}
								ref={(el: HTMLButtonElement | null) => {
									buttonRefs.current[index] = el;
								}}
								id={optionId}
								suppressHydrationWarning
								onClick={() => onChange(option.value)}
								onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) =>
									handleKeyDown(e, index)
								}
								role={multiple ? "checkbox" : "radio"}
								aria-checked={selected}
								aria-selected={selected}
								aria-label={option.label}
								aria-describedby={descriptionId}
								className={cn(
									"relative w-full rounded-2xl border-2 p-4 font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-duo-green focus-visible:ring-offset-2",
									!option.emoji &&
										!option.icon &&
										!option.description &&
										"uppercase tracking-wider text-center",
									(option.emoji || option.icon || option.description) &&
										"text-left",
									selected
										? "border-duo-green bg-duo-green"
										: "border-gray-300 bg-white hover:border-duo-green/50",
									sizeClasses[size],
								)}
								style={{ boxShadow: staticBoxShadow(selected) }}
							>
								{showCheck && isSelected(option.value) && (
									<div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-duo-green shadow-lg">
										<Check className="h-4 w-4" />
									</div>
								)}
								{option.emoji || option.icon || option.description ? (
									<div className="flex items-center gap-3">
										{option.emoji && (
											<span className="text-2xl">{option.emoji}</span>
										)}
										{option.icon && <div>{option.icon}</div>}
										<div className="flex-1">
											<div
												className={cn(
													"font-bold",
													isSelected(option.value)
														? "text-white"
														: "text-gray-900",
												)}
											>
												{option.label}
											</div>
											{option.description && (
												<div
													id={descriptionId}
													className={cn(
														"text-xs",
														selected ? "text-white/90" : "text-gray-600",
													)}
												>
													{option.description}
												</div>
											)}
										</div>
									</div>
								) : (
									<div
										className={cn(
											"font-bold",
											textAlign === "left"
												? "text-left"
												: textAlign === "right"
													? "text-right"
													: "text-center",
											selected ? "text-white" : "text-gray-900",
										)}
									>
										{option.label}
									</div>
								)}
							</button>
						);
					})}
				</div>
			</div>
		);
	}

	// Se precisa ajuste, calcula quantas colunas o grid deve ter
	// Se temos 3 colunas, 3 itens e um é longo, vira 2 colunas (2 itens na primeira linha)
	const itemsInFirstRow = needsAdjustment ? options.length - 1 : options.length;
	const actualColumns = needsAdjustment ? itemsInFirstRow : columns;

	const Wrapper = animate ? motion.div : "div";
	const labelId = label ? `${stableId}-label` : undefined;
	return (
		<div className={cn("space-y-3", className)}>
			{label && (
				<label
					id={labelId}
					className="mb-3 block text-sm font-bold text-gray-900"
				>
					{label}
				</label>
			)}
			<Wrapper
				initial={animate ? { opacity: 0, y: 20 } : undefined}
				animate={animate ? { opacity: 1, y: 0 } : undefined}
				transition={animate ? { delay } : undefined}
				role={multiple ? "group" : "radiogroup"}
				aria-label={ariaLabel || (label ? undefined : "Opções de seleção")}
				aria-labelledby={ariaLabelledBy || labelId}
				className={cn(
					"grid gap-3",
					actualColumns <= 7
						? gridCols[actualColumns as keyof typeof gridCols]
						: `grid-cols-${actualColumns}`,
				)}
				style={{
					gridTemplateColumns: `repeat(${actualColumns}, minmax(0, 1fr))`,
				}}
			>
				{options.map((option, index) => {
					const selected = isSelected(option.value);
					const optionId = `${stableId}-option-${index}`;
					const descriptionId = option.description
						? `${optionId}-description`
						: undefined;
					const isLastItem = index === options.length - 1;
					const shouldMoveToBottom = needsAdjustment && isLastItem;

					// Se precisa ajuste e é o último item, ele vai para linha de baixo ocupando todas as colunas
					if (shouldMoveToBottom) {
						return (
							<TapButton
								key={option.value}
								ref={(el) => {
									buttonRefs.current[index] = el;
								}}
								id={optionId}
								suppressHydrationWarning
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{
									opacity: 1,
									scale: 1,
									boxShadow: selected ? "0 4px 0 #58A700" : "0 4px 0 #D1D5DB",
								}}
								transition={{
									delay: index * 0.05,
									type: "spring",
									boxShadow: { duration: 0, ease: "linear" },
								}}
								whileHover={{ scale: 1.02 }}
								selected={selected}
								onClick={() => onChange(option.value)}
								onKeyDown={(e) => handleKeyDown(e, index)}
								role={multiple ? "checkbox" : "radio"}
								aria-checked={selected}
								aria-selected={selected}
								aria-label={option.label}
								aria-describedby={descriptionId}
								className={cn(
									"relative rounded-2xl border-2 transition-all min-w-0 overflow-hidden font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-duo-green focus-visible:ring-offset-2",
									!option.emoji &&
										!option.icon &&
										!option.description &&
										"uppercase tracking-wider",
									selected
										? "border-duo-green bg-duo-green text-white"
										: "border-gray-300 bg-white text-gray-900 hover:border-duo-green/50",
									sizeClasses[size],
									option.emoji || option.icon || option.description
										? "text-left"
										: textAlign === "left"
											? "text-left"
											: textAlign === "right"
												? "text-right"
												: "text-center",
								)}
								style={{
									gridColumn: `1 / -1`,
									gridRow: "2",
								}}
							>
								{showCheck && isSelected(option.value) && (
									<motion.div
										initial={{ scale: 0, rotate: -180 }}
										animate={{ scale: 1, rotate: 0 }}
										className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-duo-green"
									>
										<Check className="h-3 w-3" />
									</motion.div>
								)}
								{option.emoji && (
									<div className="mb-1 text-3xl">{option.emoji}</div>
								)}
								{option.icon && <div className="mb-2">{option.icon}</div>}
								<div
									className={cn(
										"font-bold wrap-break-words",
										textAlign === "left"
											? "text-left"
											: textAlign === "right"
												? "text-right"
												: "text-center",
									)}
								>
									{option.label}
								</div>
								{option.description && (
									<div
										id={descriptionId}
										className={cn(
											"mt-1 text-xs opacity-80",
											selected && "opacity-90",
											textAlign === "left"
												? "text-left"
												: textAlign === "right"
													? "text-right"
													: "text-center",
										)}
									>
										{option.description}
									</div>
								)}
							</TapButton>
						);
					}

					// Itens que ficam na primeira linha - cada um ocupa exatamente 1 coluna
					// Se o grid virou 2 colunas (porque temos 2 itens), cada item ocupa 1 coluna
					const finalColSpan = 1;

					return (
						<TapButton
							key={option.value}
							ref={(el) => {
								buttonRefs.current[index] = el;
							}}
							id={optionId}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{
								opacity: 1,
								scale: 1,
								boxShadow: selected ? "0 4px 0 #58A700" : "0 4px 0 #D1D5DB",
							}}
							transition={{
								delay: index * 0.05,
								type: "spring",
								boxShadow: { duration: 0, ease: "linear" },
							}}
							whileHover={{ scale: 1.05, y: -2 }}
							selected={selected}
							onClick={() => onChange(option.value)}
							onKeyDown={(e) => handleKeyDown(e, index)}
							role={multiple ? "checkbox" : "radio"}
							aria-checked={selected}
							aria-selected={selected}
							aria-label={option.label}
							aria-describedby={descriptionId}
							className={cn(
								"relative rounded-2xl border-2 transition-all min-w-0 overflow-hidden font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-duo-green focus-visible:ring-offset-2",
								!option.emoji &&
									!option.icon &&
									!option.description &&
									"uppercase tracking-wider",
								selected
									? "border-duo-green bg-duo-green text-white"
									: "border-gray-300 bg-white text-gray-900 hover:border-duo-green/50",
								sizeClasses[size],
								(option.emoji || option.icon) && textAlign === "left"
									? "text-left"
									: (option.emoji || option.icon) && textAlign === "right"
										? "text-right"
										: (option.emoji || option.icon) && textAlign === "center"
											? "text-center"
											: !option.emoji && !option.icon
												? textAlign === "left"
													? "text-left"
													: textAlign === "right"
														? "text-right"
														: "text-center"
												: "",
							)}
							style={{
								gridColumn: `span ${finalColSpan}`,
							}}
						>
							{showCheck && isSelected(option.value) && (
								<motion.div
									initial={{ scale: 0, rotate: -180 }}
									animate={{ scale: 1, rotate: 0 }}
									className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-duo-green"
								>
									<Check className="h-3 w-3" />
								</motion.div>
							)}
							{(option.emoji || option.icon) && textAlign === "center" ? (
								<div className="flex flex-col items-center">
									{option.emoji && (
										<div className="mb-1 text-3xl">{option.emoji}</div>
									)}
									{option.icon && <div className="mb-2">{option.icon}</div>}
									<div className="font-bold wrap-break-words text-center">
										{option.label}
									</div>
									{option.description && (
										<div
											id={descriptionId}
											className={cn(
												"mt-1 text-xs opacity-80 text-center",
												selected && "opacity-90",
											)}
										>
											{option.description}
										</div>
									)}
								</div>
							) : (
								<>
									{option.emoji && (
										<div
											className={cn(
												"mb-1 text-3xl",
												textAlign === "center" && "mx-auto",
												textAlign === "right" && "ml-auto",
											)}
										>
											{option.emoji}
										</div>
									)}
									{option.icon && (
										<div
											className={cn(
												"mb-2",
												textAlign === "center" && "mx-auto",
												textAlign === "right" && "ml-auto",
											)}
										>
											{option.icon}
										</div>
									)}
									<div
										className={cn(
											"font-bold wrap-break-words",
											textAlign === "left"
												? "text-left"
												: textAlign === "right"
													? "text-right"
													: "text-center",
										)}
									>
										{option.label}
									</div>
									{option.description && (
										<div
											id={descriptionId}
											className={cn(
												"mt-1 text-xs opacity-80",
												selected && "opacity-90",
												textAlign === "left"
													? "text-left"
													: textAlign === "right"
														? "text-right"
														: "text-center",
											)}
										>
											{option.description}
										</div>
									)}
								</>
							)}
						</TapButton>
					);
				})}
			</Wrapper>
		</div>
	);
}
