import { Droplets } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard } from "@/components/duo";

export interface WaterIntakeCardProps
	extends React.HTMLAttributes<HTMLDivElement> {
	current: number;
	target: number;
	glasses: number;
	onToggleGlass: (index: number) => void;
	/** Modo somente leitura: copos não são clicáveis */
	readOnly?: boolean;
}

function WaterIntakeCardSimple({
	current,
	target,
	glasses,
	onToggleGlass,
	readOnly = false,
	className,
	...props
}: WaterIntakeCardProps) {
	const progress = (current / target) * 100;
	// Calcular número de copos baseado no target (cada copo = 250ml)
	// Sempre mostrar 12 copos para suportar até 3000ml (3000 / 250 = 12)
	const totalGlasses = 12;

	return (
		<DuoCard.Root variant="default" padding="md" className={className} {...props}>
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<Droplets className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
					<h2 className="font-bold text-[var(--duo-fg)]">Hidratação</h2>
				</div>
				<span className="text-sm font-bold text-duo-gray-dark">
					{current}ml / {target}ml
				</span>
			</DuoCard.Header>
			<div className="mb-3 h-2 overflow-hidden rounded-full bg-duo-bg-elevated">
				<div
					className="h-full rounded-full bg-duo-blue transition-all duration-300"
					style={{ width: `${Math.min(progress, 100)}%` }}
				/>
			</div>

			<div className="grid grid-cols-6 gap-1.5 sm:gap-2 w-full max-w-[10.5rem] sm:max-w-[12rem]">
				{Array.from({ length: totalGlasses }).map((_, i) => {
					const Wrapper = readOnly ? "div" : "button";
					return (
						<Wrapper
							key={i}
							{...(readOnly
								? {}
								: { onClick: () => onToggleGlass(i) })}
							className={cn(
								"aspect-square rounded-lg border-2 transition-all flex items-center justify-center min-w-0",
								!readOnly && "active:scale-95",
								i < glasses
									? "border-duo-blue bg-duo-blue/20 shadow-[0_2px_0_#1899D6]"
									: "border-duo-border bg-duo-bg-card",
								!readOnly && "hover:border-duo-blue/50 shadow-[0_2px_0_#D1D5DB]",
							)}
						>
							<Droplets
								className={cn(
									"shrink-0 w-[55%] h-[55%] min-w-3 min-h-3 max-w-5 max-h-5",
									i < glasses ? "text-duo-blue" : "text-duo-border",
								)}
							/>
						</Wrapper>
					);
				})}
			</div>
		</DuoCard.Root>
	);
}

export const WaterIntakeCard = { Simple: WaterIntakeCardSimple };
