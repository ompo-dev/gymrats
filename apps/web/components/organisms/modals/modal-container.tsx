"use client";

import type { ReactNode } from "react";
import { Modal } from "./modal";

/** @deprecated Use Modal.Root from "./modal" */
export function ModalContainer({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-2xl",
  zIndex = "z-60",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  zIndex?: string;
}) {
  return (
    <Modal.Root
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      zIndex={zIndex}
    >
      {children}
    </Modal.Root>
  );
}
