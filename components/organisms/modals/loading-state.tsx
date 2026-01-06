"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Carregando..." }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8 text-gray-600"
    >
      <Loader2 className="mb-2 h-8 w-8 animate-spin text-duo-green" />
      <div className="text-sm font-bold">{message}</div>
    </motion.div>
  );
}

