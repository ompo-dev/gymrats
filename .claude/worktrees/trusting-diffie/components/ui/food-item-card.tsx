import { ChevronDown, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type * as React from "react";
import { Button } from "@/components/atoms/buttons/button";
import type { MealFoodItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FoodItemCardProps
	extends React.HTMLAttributes<HTMLDivElement> {
	food: MealFoodItem;
	isExpanded: boolean;
	onToggle: () => void;
	onDelete?: () => void;
}

export function FoodItemCard({
	food,
	isExpanded,
	onToggle,
	onDelete,
	className,
	...props
}: FoodItemCardProps) {
	return (
		<div
			className={cn("transition-all", className)}
			onClick={(e) => e.stopPropagation()}
			{...props}
		>
			<div
				onClick={(e) => {
					e.stopPropagation();
					onToggle();
				}}
				className={cn(
					"w-full rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98] cursor-pointer",
					isExpanded
						? "border-duo-blue bg-duo-blue/5 shadow-sm"
						: "border-gray-300 bg-white hover:border-duo-blue hover:shadow-sm",
				)}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						onToggle();
					}
				}}
			>
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<div className="font-bold text-gray-900">{food.foodName}</div>
						<div className="text-xs text-gray-600">
							{food.servings} {food.servings === 1 ? "porção" : "porções"} •{" "}
							{food.servingSize}
						</div>
					</div>
					<ChevronDown
						className={cn(
							"h-4 w-4 text-gray-400 transition-transform duration-300 shrink-0",
							isExpanded && "rotate-180",
						)}
					/>
				</div>

				<AnimatePresence>
					{isExpanded && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
							className="overflow-hidden"
						>
							<div className="mt-3 border-t border-gray-300 pt-3 space-y-3">
								<motion.div
									initial={{ y: -10, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									transition={{ delay: 0.1, duration: 0.2 }}
									className="grid grid-cols-4 gap-2 text-center"
								>
									<div>
										<div className="text-sm font-bold text-gray-900">
											{food.calories}
										</div>
										<div className="text-xs text-gray-600">cal</div>
									</div>
									<div>
										<div className="text-sm font-bold text-gray-900">
											{food.protein}g
										</div>
										<div className="text-xs text-gray-600">prot</div>
									</div>
									<div>
										<div className="text-sm font-bold text-gray-900">
											{food.carbs}g
										</div>
										<div className="text-xs text-gray-600">carb</div>
									</div>
									<div>
										<div className="text-sm font-bold text-gray-900">
											{food.fats}g
										</div>
										<div className="text-xs text-gray-600">gord</div>
									</div>
								</motion.div>

								{onDelete && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.15, duration: 0.2 }}
									>
										<Button
											variant="destructive"
											size="sm"
											className="w-full"
											onClick={(e) => {
												e.stopPropagation();
												onDelete();
											}}
										>
											<Trash2 className="h-3.5 w-3.5" />
											Excluir Alimento
										</Button>
									</motion.div>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
