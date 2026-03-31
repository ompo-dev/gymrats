"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Chrome,
  Dumbbell,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { DuoButton, DuoCard } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";

export interface WelcomeFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface WelcomeScreenProps
  extends ScreenProps<{
    error?: string;
    isLoading: boolean;
    features?: WelcomeFeature[];
    onGoogleLogin: () => void | Promise<void>;
  }> {}

export const welcomeScreenContract: ViewContract = {
  componentId: "welcome-screen",
  testId: "welcome-screen",
};

export const defaultWelcomeFeatures: WelcomeFeature[] = [
  {
    icon: Dumbbell,
    title: "Controle de Treinos",
    description:
      "Treinos personalizados baseados em seus objetivos e nivel de experiencia",
  },
  {
    icon: UtensilsCrossed,
    title: "Dieta e Nutricao",
    description:
      "Acompanhe sua alimentacao e receba recomendacoes nutricionais personalizadas",
  },
  {
    icon: TrendingUp,
    title: "Progressao",
    description:
      "Monitore seu progresso com metricas detalhadas e graficos de evolucao",
  },
  {
    icon: BookOpen,
    title: "Aprendizado",
    description:
      "Aprenda tecnicas avancadas de musculacao com conteudo educativo completo",
  },
];

export function WelcomeScreen({
  error = "",
  isLoading,
  features = defaultWelcomeFeatures,
  onGoogleLogin,
}: WelcomeScreenProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-duo-bg"
      data-testid={welcomeScreenContract.testId}
    >
      <div className="flex flex-1 items-center justify-center px-4 py-12 pb-32">
        <div className="w-full max-w-md">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <DuoCard.Root className="p-2" size="lg" variant="default">
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                className="flex h-36 w-36 items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              >
                <Image
                  alt="Gym Rats Logo"
                  className="h-full w-full"
                  height={160}
                  priority
                  src="/icon.svg"
                  width={160}
                />
              </motion.div>
            </DuoCard.Root>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold leading-tight text-duo-green md:text-5xl">
              GymRats
            </h1>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <DuoCard.Root size="lg" variant="default">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;

                    return (
                      <motion.div
                        key={feature.title}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center"
                        initial={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                      >
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-duo-green/10">
                          <Icon className="h-6 w-6 text-duo-green" />
                        </div>
                        <h3 className="mb-1 text-sm font-bold text-duo-fg">
                          {feature.title}
                        </h3>
                        <p className="text-xs leading-tight text-duo-fg-muted">
                          {feature.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </DuoCard.Root>
          </motion.div>

          {error ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border-2 border-duo-danger bg-duo-danger/10 p-3 text-sm font-medium text-duo-danger"
              initial={{ opacity: 0, y: -10 }}
            >
              {error}
            </motion.div>
          ) : null}

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <DuoButton
              className="flex w-full items-center justify-center gap-3"
              disabled={isLoading}
              onClick={onGoogleLogin}
              variant="primary"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <Chrome className="h-5 w-5" />
                  <span>Entrar com Google</span>
                </>
              )}
            </DuoButton>
          </motion.div>

          <motion.div
            animate={{ opacity: 1 }}
            className="text-center"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <p className="text-sm text-duo-fg-muted">
              Ao continuar, voce concorda com nossos{" "}
              <a
                className="text-duo-primary underline hover:text-duo-primary-dark"
                href="/terms"
              >
                Termos de Uso
              </a>{" "}
              e{" "}
              <a
                className="text-duo-primary underline hover:text-duo-primary-dark"
                href="/privacy"
              >
                Politica de Privacidade
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
