"use client";

import { ArrowLeft, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import { DuoButton } from "@/components/duo";

interface ModalRootProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  zIndex?: string;
}

function ModalRoot({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-2xl",
  zIndex = "z-60",
}: ModalRootProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 ${zIndex} flex items-end justify-center bg-black/50 sm:items-center`}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            className={`w-full ${maxWidth} rounded-t-3xl bg-duo-bg-card sm:rounded-3xl sm:scale-100`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children?: ReactNode;
}

function ModalHeader({ title, onClose, onBack, children }: ModalHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="border-b-2 border-duo-border p-6"
    >
      <div className="flex items-center justify-between">
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

interface ModalContentProps {
  children: ReactNode;
  maxHeight?: string;
}

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
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
  },
);
ModalContent.displayName = "ModalContent";

export const Modal = {
  Root: ModalRoot,
  Header: ModalHeader,
  Content: ModalContent,
};
