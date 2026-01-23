"use client";

import { motion } from "motion/react";
import { Dumbbell, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  variant?: "student" | "gym";
  message?: string;
  className?: string;
}

export function LoadingScreen({
  variant = "student",
  message = "Carregando...",
  className,
}: LoadingScreenProps) {
  const Icon = variant === "student" ? Dumbbell : Building2;
  const colors =
    variant === "student"
      ? {
          primary: "text-duo-green",
          bg: "bg-duo-green/10",
          ring: "border-duo-green",
        }
      : {
          primary: "text-duo-orange",
          bg: "bg-duo-orange/10",
          ring: "border-duo-orange",
        };

  return (
    <div
      className={cn(
        "h-screen flex items-center justify-center",
        variant === "student" ? "bg-white" : "bg-gray-50",
        className
      )}
    >
      <div className="text-center space-y-6">
        {/* Ícone animado */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={cn(
              "relative flex h-24 w-24 items-center justify-center rounded-full",
              colors.bg
            )}
          >
            <Icon className={cn("h-12 w-12", colors.primary)} />
            {/* Anel de loading */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full border-4 border-t-transparent",
                colors.ring
              )}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-2"
        >
          <h2 className="text-xl font-bold text-duo-text">{message}</h2>
          <p className="text-sm text-duo-gray-dark">
            {variant === "student"
              ? "Preparando sua experiência..."
              : "Carregando sua academia..."}
          </p>
        </motion.div>

        {/* Pontos de loading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn("h-2 w-2 rounded-full", colors.primary)}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

