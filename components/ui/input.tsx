"use client";

import * as React from "react";
import { DuoInput } from "@/components/duo";

/** @deprecated Use DuoInput from @/components/duo diretamente */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof DuoInput.Simple>>(
	(props, ref) => <DuoInput.Simple ref={ref} {...props} />,
);

Input.displayName = "Input";

export { Input };
