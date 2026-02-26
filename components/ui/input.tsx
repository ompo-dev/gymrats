"use client";

import * as React from "react";
import { DuoInput } from "@/components/duo/molecules/duo-input";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, ...props }, ref) => (
		<DuoInput ref={ref} className={className} {...props} />
	),
);

Input.displayName = "Input";

export { Input };
