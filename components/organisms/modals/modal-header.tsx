"use client";

import { ArrowLeft, X } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { DuoButton } from "@/components/duo";

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children?: ReactNode;
}

export function ModalHeader({
  title,
  onClose,
  onBack,
  children,
}: ModalHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="border-b-2 border-duo-border p-6"
    >
      <div className=" flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <DuoButton
              type="button"
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </DuoButton>
          )}
          <h2 className="text-2xl font-bold text-duo-text">{title}</h2>
        </div>
        <DuoButton
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 rounded-full"
        >
          <X className="h-5 w-5" />
        </DuoButton>
      </div>
      {children}
    </motion.div>
  );
}
