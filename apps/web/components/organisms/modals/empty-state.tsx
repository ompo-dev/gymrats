"use client";

import { motion } from "motion/react";

interface EmptyStateProps {
  message: string;
}

function EmptyStateSimple({ message }: EmptyStateProps) {
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

export const EmptyState = { Simple: EmptyStateSimple };
