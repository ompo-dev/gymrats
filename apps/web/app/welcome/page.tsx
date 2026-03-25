"use client";

import {
  BookOpen,
  Chrome,
  Dumbbell,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DuoButton, DuoCard } from "@/components/duo";

function WelcomePageContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const buildGoogleStartUrl = () => {
    const appBaseURL = window.location.origin;
    const startUrl = new URL("/api/auth/google/start", appBaseURL);

    startUrl.searchParams.set("redirectTo", `${appBaseURL}/auth/callback`);
    startUrl.searchParams.set(
      "errorRedirectTo",
      `${appBaseURL}/auth/callback?error=true`,
    );

    return startUrl.toString();
  };

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");

    if (!errorParam) {
      return;
    }

    setError(
      messageParam || "Erro ao fazer login com Google. Tente novamente.",
    );
    setIsLoading(false);
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const startUrl = buildGoogleStartUrl();
      window.location.assign(startUrl);
    } catch (err) {
      console.error("Erro ao iniciar login com Google:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao iniciar login com Google",
      );
      setIsLoading(false);
    }
  };

  const features = [
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

  return (
    <div className="flex min-h-screen flex-col bg-duo-bg">
      <div className="flex-1 flex items-center justify-center px-4 py-12 pb-32">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex justify-center"
          >
            <DuoCard.Root variant="default" size="lg" className="p-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                className="w-36 h-36 flex items-center justify-center"
              >
                <Image
                  src="/icon.svg"
                  alt="Gym Rats Logo"
                  width={160}
                  height={160}
                  className="w-full h-full"
                  priority
                />
              </motion.div>
            </DuoCard.Root>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-duo-green leading-tight">
              GymRats
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <DuoCard.Root variant="default" size="lg">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                        className="flex flex-col items-center text-center"
                      >
                        <div className="w-12 h-12 bg-duo-green/10 rounded-xl flex items-center justify-center mb-2">
                          <Icon className="w-6 h-6 text-duo-green" />
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

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border-2 border-duo-danger bg-duo-danger/10 p-3 text-sm font-medium text-duo-danger"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-6"
          >
            <DuoButton
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <Chrome className="w-5 h-5" />
                  <span>Entrar com Google</span>
                </>
              )}
            </DuoButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-duo-fg-muted">
              Ao continuar, voce concorda com nossos{" "}
              <a
                href="/terms"
                className="text-duo-primary underline hover:text-duo-primary-dark"
              >
                Termos de Uso
              </a>{" "}
              e{" "}
              <a
                href="/privacy"
                className="text-duo-primary underline hover:text-duo-primary-dark"
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

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-duo-bg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-duo-primary shadow-lg">
              <Dumbbell className="h-10 w-10 text-white" />
            </div>
            <p className="text-duo-fg-muted">Carregando...</p>
          </div>
        </div>
      }
    >
      <WelcomePageContent />
    </Suspense>
  );
}
