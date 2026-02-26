"use client";

import * as React from "react";
import { DuoInput } from "@/components/duo";

/** @deprecated Use DuoInput from @/components/duo diretamente */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof DuoInput>>(
	(props, ref) => <DuoInput ref={ref} {...props} />,
);

Input.displayName = "Input";

export { Input };
