"use client";

import { motion } from "motion/react";

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-8 text-center text-gray-600"
    >
      {message}
    </motion.div>
  );
}

