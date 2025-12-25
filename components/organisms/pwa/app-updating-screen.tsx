"use client";

import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppUpdatingScreenProps {
  isVisible: boolean;
}

export function AppUpdatingScreen({ isVisible }: AppUpdatingScreenProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-9999 flex items-center justify-center",
        "bg-background backdrop-blur-3xl"
      )}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20"
        >
          <RefreshCw className="h-10 w-10 text-primary" />
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Atualizando App
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Uma nova versão está sendo instalada. Isso pode levar alguns segundos...
          </p>
        </div>

        <motion.div
          className="flex gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

