"use client";

import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
	onClick: () => void;
	className?: string;
	color?: "duo-red" | "duo-blue" | "duo-green";
}

const colorClasses = {
	"duo-red": "text-duo-red",
	"duo-blue": "text-duo-blue",
	"duo-green": "text-duo-green",
};

export function BackButton({
	onClick,
	className,
	color = "duo-blue",
}: BackButtonProps) {
	return (
		<button
			onClick={onClick}
			className={cn(
				"mb-4 flex items-center gap-2 font-bold hover:underline",
				colorClasses[color],
				className,
			)}
		>
			<ArrowLeft className="h-5 w-5" />
			Voltar
		</button>
	);
}
