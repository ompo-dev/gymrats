import { Droplets } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard, DuoCardHeader } from "@/components/duo";

export interface WaterIntakeCardProps
	extends React.HTMLAttributes<HTMLDivElement> {
	current: number;
	target: number;
	glasses: number;
	onToggleGlass: (index: number) => void;
}

export function WaterIntakeCard({
	current,
	target,
	glasses,
	onToggleGlass,
	className,
	...props
}: WaterIntakeCardProps) {
	const progress = (current / target) * 100;
	// Calcular número de copos baseado no target (cada copo = 250ml)
	// Sempre mostrar 12 copos para suportar até 3000ml (3000 / 250 = 12)
	const totalGlasses = 12;

	return (
		<DuoCard variant="default" padding="md" className={className} {...props}>
			<DuoCardHeader>
				<div className="flex items-center gap-2">
					<Droplets className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
					<h2 className="font-bold text-[var(--duo-fg)]">Hidratação</h2>
				</div>
				<span className="text-sm font-bold text-duo-gray-dark">
					{current}ml / {target}ml
				</span>
			</DuoCardHeader>
			<div className="mb-3 h-2 overflow-hidden rounded-full bg-duo-bg-elevated">
				<div
					className="h-full rounded-full bg-duo-blue transition-all duration-300"
					style={{ width: `${Math.min(progress, 100)}%` }}
				/>
			</div>

			<div className="grid grid-cols-6 gap-2">
				{Array.from({ length: totalGlasses }).map((_, i) => (
					<button
						key={i}
						onClick={() => onToggleGlass(i)}
						className={cn(
							"aspect-square rounded-lg border-2 transition-all active:scale-95",
							i < glasses
								? "border-duo-blue bg-duo-blue/20 shadow-[0_2px_0_#1899D6]"
								: "border-duo-border bg-duo-bg-card hover:border-duo-blue/50 shadow-[0_2px_0_#D1D5DB]",
						)}
					>
						<Droplets
							className={cn(
								"mx-auto h-4 w-4",
								i < glasses ? "text-duo-blue" : "text-duo-border",
							)}
						/>
					</button>
				))}
			</div>
		</DuoCard>
	);
}
