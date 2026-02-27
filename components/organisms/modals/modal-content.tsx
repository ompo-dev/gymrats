"use client";

import { forwardRef, type ReactNode } from "react";
import { Modal } from "./modal";

/** @deprecated Use Modal.Content from "./modal" */
export const ModalContent = forwardRef<
	HTMLDivElement,
	{ children: ReactNode; maxHeight?: string }
>(({ children, maxHeight = "50vh" }, ref) => {
	return (
		<Modal.Content ref={ref} maxHeight={maxHeight}>
			{children}
		</Modal.Content>
	);
});

ModalContent.displayName = "ModalContent";
