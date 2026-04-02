"use client";

import {
  BookOpen,
  Dumbbell,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { WelcomeScreen } from "@/components/screens/public";

function WelcomePageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const buildGoogleStartUrl = () => {
    const appBaseURL = window.location.origin;
    const startUrl = new URL("/api/auth/google/start", appBaseURL);
    const searchParams = new URLSearchParams(window.location.search);
    const messageParam = searchParams.get("message");

    startUrl.searchParams.set("redirectTo", `${appBaseURL}/auth/callback`);
    startUrl.searchParams.set(
      "errorRedirectTo",
      `${appBaseURL}/auth/callback?error=true`,
    );

    if (searchParams.get("error")) {
      setError(
        messageParam || "Erro ao fazer login com Google. Tente novamente.",
      );
      setIsLoading(false);
    }

    return startUrl.toString();
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");

    if (!errorParam) {
      return;
    }

    setError(
      messageParam || "Erro ao fazer login com Google. Tente novamente.",
    );
    setIsLoading(false);
  }, []);

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

  return (
    <WelcomeScreen
      error={error}
      features={[
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
      ]}
      isLoading={isLoading}
      onGoogleLogin={handleGoogleLogin}
    />
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
