"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface LoadingMoreStateProps {
  message?: string;
}

export function LoadingMoreState({
  message = "Carregando mais...",
}: LoadingMoreStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center py-4"
    >
      <Loader2 className="h-6 w-6 animate-spin text-duo-green" />
      <span className="ml-2 text-sm text-gray-600">{message}</span>
    </motion.div>
  );
}

