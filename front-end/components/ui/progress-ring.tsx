"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  children: React.ReactNode;
  showProgress: boolean;
  progressPercent: number;
  className?: string;
  color?: string; // Cor do progresso (padrão: amarelo)
}

/**
 * Componente que envolve um node e renderiza uma barra de progresso circular
 * ao redor dele quando showProgress é true
 */
export function ProgressRing({
  children,
  showProgress,
  progressPercent,
  className,
  color = "#FFC800", // duo-yellow por padrão
}: ProgressRingProps) {
  // Estado para animação suave do progresso
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animar o progresso suavemente quando mudar
  useEffect(() => {
    if (!showProgress) {
      setAnimatedProgress(0);
      return;
    }

    if (progressPercent === animatedProgress) return;

    const duration = 500; // 500ms para animação
    const steps = 30; // 30 frames
    const increment = (progressPercent - animatedProgress) / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedProgress(progressPercent);
        clearInterval(interval);
      } else {
        setAnimatedProgress((prev) => {
          const newValue = prev + increment;
          // Garantir que não ultrapasse o target
          if (increment > 0) {
            return Math.min(newValue, progressPercent);
          } else {
            return Math.max(newValue, progressPercent);
          }
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [progressPercent, animatedProgress, showProgress]);

  // Calcular o progresso em graus para o conic-gradient
  // conic-gradient começa do topo (12h) e vai no sentido horário
  // progressPercent de 0% = 0deg, 100% = 360deg
  const progressDegrees = animatedProgress * 3.6; // 3.6deg por 1% (360deg / 100%)

  // Se não deve mostrar progresso, retorna apenas os children sem o container
  if (!showProgress) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "relative rounded-full w-[110px] h-[110px] flex items-center justify-center",
        className
      )}
    >
      {/* Círculo de progresso usando conic-gradient - este é o círculo que mostra o progresso */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${color} 0deg ${progressDegrees}deg, #E5E5E5 ${progressDegrees}deg 360deg)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      {/* Círculo interno branco para criar o efeito de anel - maior para mostrar mais do progresso */}
      <div
        className="absolute rounded-full bg-white z-10"
        style={{
          width: "82px",
          height: "82px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Children (o node) - com z-index maior para ficar acima */}
      <div className="relative z-20">{children}</div>
    </div>
  );
}
