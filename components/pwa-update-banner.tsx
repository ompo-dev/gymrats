"use client";

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, X } from "lucide-react";
import { usePWAUpdate } from "@/lib/hooks/use-pwa-update";
import { cn } from "@/lib/utils";

export function PWAUpdateBanner() {
  const { updateAvailable, isUpdating, applyUpdate } = usePWAUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed || isUpdating) return null;

  const handleUpdate = () => {
    applyUpdate();
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Remove o banner por 1 hora
    localStorage.setItem(
      "pwa-update-dismissed",
      Date.now().toString()
    );
  };

  useEffect(() => {
    // Verifica se foi dispensado recentemente (última hora)
    const dismissedTime = localStorage.getItem("pwa-update-dismissed");
    if (dismissedTime) {
      const hourAgo = Date.now() - 60 * 60 * 1000;
      if (parseInt(dismissedTime) > hourAgo) {
        setDismissed(true);
      }
    }
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 mx-auto max-w-lg",
          "pointer-events-none safe-header"
        )}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div
          className={cn(
            "mx-4 mt-4 rounded-xl px-4 py-3 shadow-lg",
            "bg-primary/90 backdrop-blur-xl border border-primary/30",
            "flex items-center gap-3 pointer-events-auto"
          )}
        >
          <RefreshCw className="h-5 w-5 text-white animate-spin" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">
              Atualização Disponível
            </h3>
            <p className="text-xs text-white/80">
              Uma nova versão está disponível
            </p>
          </div>
          <button
            onClick={handleUpdate}
            className={cn(
              "rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-primary",
              "hover:bg-white/90 transition-all shadow-sm"
            )}
            aria-label="Atualizar aplicativo"
          >
            Atualizar
          </button>
          <button
            onClick={handleDismiss}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              "bg-white/20 text-white/80 hover:bg-white/30 transition-all"
            )}
            aria-label="Fechar banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

