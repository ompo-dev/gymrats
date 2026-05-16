"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
	className,
	value = 0,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
	value?: number;
}) {
	// Garantir que o value está entre 0 e 100
	const clampedValue = Math.min(100, Math.max(0, value || 0));
	const percentage = `${clampedValue}%`;

	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			value={clampedValue}
			max={100}
			className={cn(
				"relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className="h-full bg-[#58CC02] transition-all duration-300 ease-in-out"
				style={{
					width: percentage,
				}}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
