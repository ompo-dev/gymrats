"use client";

import { Button } from "@/components/atoms/buttons/button";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { motion } from "motion/react";
import {
  Chrome,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/stores";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { authApi } from "@/lib/api/auth";

function WelcomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthenticated, setUserId, setUserProfile, setUserRole } =
    useAuthStore();
  const loadAll = useStudentUnifiedStore((state) => state.loadAll);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Verificar se há callback do Google OAuth
  useEffect(() => {
    const checkCallback = async () => {
      const callbackParam = searchParams.get("callback");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError("Erro ao fazer login com Google. Tente novamente.");
        setIsLoading(false);
        return;
      }

      if (callbackParam === "google") {
        try {
          // Aguardar um pouco para o Better Auth processar o callback
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Buscar sessão do Better Auth
          const { data: session } = await authClient.getSession();

          if (session?.user) {
            // Buscar dados completos via nossa API de session
            const sessionResponse = await authApi.getSession();

            if (sessionResponse) {
              const userRole =
                (sessionResponse.user as { role: "STUDENT" | "GYM" | "ADMIN" })
                  .role || sessionResponse.user.role;

              // ⚠️ SEGURANÇA: Salvar apenas token no localStorage para compatibilidade
              // NÃO salvar userRole e isAdmin - sempre validar no servidor
              if (sessionResponse.session?.token) {
                localStorage.setItem(
                  "auth_token",
                  sessionResponse.session.token
                );
              }
              localStorage.setItem("isAuthenticated", "true");
              localStorage.setItem("userEmail", sessionResponse.user.email);
              localStorage.setItem("userId", sessionResponse.user.id);
              // ⚠️ NÃO salvar userRole e isAdmin no localStorage - inseguro!
              // Estes valores devem ser sempre obtidos do servidor via useUserSession()

              // Atualizar store
              setAuthenticated(true);
              setUserId(sessionResponse.user.id);
              setUserRole(userRole || null);
              setUserProfile({
                id: sessionResponse.user.id,
                name: sessionResponse.user.name,
                age: 25,
                gender: "prefer-not-to-say",
                height: 170,
                weight: 70,
                fitnessLevel: "iniciante",
                weeklyWorkoutFrequency: 3,
                workoutDuration: 60,
                goals: [],
                availableEquipment: [],
                gymType: "academia-completa",
                preferredWorkoutTime: "manha",
                preferredSets: 3,
                preferredRepRange: "hipertrofia",
                restTime: "medio",
              });

              // Carregar dados do student se for STUDENT ou ADMIN
              if (userRole === "STUDENT" || userRole === "ADMIN") {
                loadAll().catch((err) => {
                  console.error(
                    "Erro ao carregar dados do student após login:",
                    err
                  );
                });
                router.push("/student");
              } else if (userRole === "GYM") {
                router.push("/gym");
              } else {
                // Se não tem role, permanecer na welcome
                router.push("/welcome");
              }
            }
          }
        } catch (err: any) {
          console.error("Erro ao verificar callback:", err);
          setError(err.message || "Erro ao processar login com Google");
          setIsLoading(false);
        }
      }
    };

    checkCallback();
  }, [
    searchParams,
    router,
    setAuthenticated,
    setUserId,
    setUserProfile,
    setUserRole,
    loadAll,
  ]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Usar Better Auth para login com Google
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/welcome?callback=google",
        errorCallbackURL: "/welcome?error=google",
        newUserCallbackURL: "/welcome?callback=google",
      });
      // O redirecionamento para Google será automático
    } catch (err: any) {
      console.error("Erro ao iniciar login com Google:", err);
      setError(err.message || "Erro ao iniciar login com Google");
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Dumbbell,
      title: "Controle de Treinos",
      description:
        "Treinos personalizados baseados em seus objetivos e nível de experiência",
    },
    {
      icon: UtensilsCrossed,
      title: "Dieta e Nutrição",
      description:
        "Acompanhe sua alimentação e receba recomendações nutricionais personalizadas",
    },
    {
      icon: TrendingUp,
      title: "Progressão",
      description:
        "Monitore seu progresso com métricas detalhadas e gráficos de evolução",
    },
    {
      icon: BookOpen,
      title: "Aprendizado",
      description:
        "Aprenda técnicas avançadas de musculação com conteúdo educativo completo",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 pb-32">
        <div className="w-full max-w-md">
          {/* Logo Card - Muito Maior */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex justify-center"
          >
            <DuoCard variant="default" size="lg" className="p-2">
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
            </DuoCard>
          </motion.div>

          {/* App Name */}
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

          {/* Features Description Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <DuoCard variant="default" size="lg">
              <div className="space-y-6">
                {/* Features Grid */}
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
                        <h3 className="text-sm font-bold text-gray-900 mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-xs text-gray-600 leading-tight">
                          {feature.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </DuoCard>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-6"
          >
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="default"
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
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-gray-500">
              Ao continuar, você concorda com nossos{" "}
              <a
                href="/terms"
                className="text-[#58CC02] underline hover:text-[#47A302]"
              >
                Termos de Uso
              </a>{" "}
              e{" "}
              <a
                href="/privacy"
                className="text-[#58CC02] underline hover:text-[#47A302]"
              >
                Política de Privacidade
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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-linear-to-br from-[#58CC02] to-[#47A302] rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <WelcomePageContent />
    </Suspense>
  );
}
