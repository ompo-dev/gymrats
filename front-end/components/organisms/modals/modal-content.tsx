"use client";

import { motion } from "motion/react";
import { ReactNode, forwardRef } from "react";

interface ModalContentProps {
  children: ReactNode;
  maxHeight?: string;
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, maxHeight = "50vh" }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex-1 overflow-y-auto p-6"
        style={{ maxHeight }}
      >
        {children}
      </motion.div>
    );
  }
);

ModalContent.displayName = "ModalContent";
