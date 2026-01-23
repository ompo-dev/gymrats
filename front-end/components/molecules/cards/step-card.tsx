"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card"; // Card base do shadcn/ui - manter em ui/
import { ReactNode } from "react";

interface StepCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function StepCard({ title, description, children, className }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <Card className={`border-2 border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-md ${className || ""}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 text-center"
        >
          <h2 className="mb-2 text-2xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </motion.div>
        {children}
      </Card>
    </motion.div>
  );
}

