"use client";

import type { ReactNode } from "react";
import { Modal } from "./modal";

/** @deprecated Use Modal.Header from "./modal" */
export function ModalHeader({
  title,
  onClose,
  onBack,
  children,
}: {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children?: ReactNode;
}) {
  return (
    <Modal.Header title={title} onClose={onClose} onBack={onBack}>
      {children}
    </Modal.Header>
  );
}
