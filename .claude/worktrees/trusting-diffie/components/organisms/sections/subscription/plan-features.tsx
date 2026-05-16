"use client";

import { CheckCircle } from "lucide-react";

interface PlanFeaturesProps {
	features: string[];
}

export function PlanFeatures({ features }: PlanFeaturesProps) {
	return (
		<div className="space-y-2 pt-4 border-t-2 border-duo-border">
			{features.map((feature, index) => (
				<div
					key={index}
					className="flex items-center gap-2 text-sm text-duo-text"
				>
					<CheckCircle className="h-4 w-4 text-duo-green" />
					<span>{feature}</span>
				</div>
			))}
		</div>
	);
}
