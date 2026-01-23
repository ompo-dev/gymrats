"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "2xl",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
}: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center"
        onClick={closeOnOverlayClick ? onClose : undefined}
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
          className={cn(
            "w-full rounded-t-3xl bg-white sm:rounded-3xl",
            maxWidthClasses[maxWidth],
            className
          )}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className={cn(
                "border-b-2 border-gray-300 p-6",
                headerClassName
              )}
            >
              <div className="flex items-center justify-between">
                {title && (
                  <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                )}
                {showCloseButton && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
                    aria-label="Fechar modal"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* Body */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className={cn("flex-1 overflow-y-auto p-6", bodyClassName)}
            style={{ maxHeight: "calc(90vh - 200px)" }}
          >
            {children}
          </motion.div>

          {/* Footer */}
          {footer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className={cn("border-t-2 border-gray-300 p-6", footerClassName)}
            >
              {footer}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

