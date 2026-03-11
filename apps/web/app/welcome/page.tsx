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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import { authApi } from "@/lib/api/auth";
import { resolveApiBaseUrl } from "@/lib/api/client-factory";
import { setAuthToken } from "@/lib/auth/token-client";
import { authClient } from "@/lib/auth-client";
import { isStandaloneMode } from "@/lib/utils/pwa-detection";
import { useAuthStore } from "@/stores";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

function WelcomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthenticated, setUserId, setUserProfile, setUserRole } =
    useAuthStore();
  const loadAll = useStudentUnifiedStore((state) => state.loadAll);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const oauthWindowRef = useRef<Window | null>(null);
  const isPWA = typeof window !== "undefined" ? isStandaloneMode() : false;

  const buildGoogleStartUrl = () => {
    const appBaseURL =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const apiBaseURL = resolveApiBaseUrl() || appBaseURL;
    const startUrl = new URL("/api/auth/google/start", apiBaseURL);

    startUrl.searchParams.set("redirectTo", `${appBaseURL}/auth/callback`);
    startUrl.searchParams.set(
      "errorRedirectTo",
      `${appBaseURL}/auth/callback?error=true`,
    );

    return startUrl.toString();
  };

  // Listener para mensagens do OAuth popup (PWA)
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      // Verificar origem da mensagem por segurança
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === "OAUTH_SUCCESS") {
        try {
          const { user, session } = event.data;

          // ⚠️ SEGURANÇA: Salvar apenas token no localStorage para compatibilidade
          // NÃO salvar userRole e isAdmin - sempre validar no servidor
          if (session?.token) {
            setAuthToken(session.token);
          }
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userEmail", user.email);
          localStorage.setItem("userId", user.id);
          // ⚠️ NÃO salvar userRole e isAdmin no localStorage - inseguro!

          // Atualizar store
          setAuthenticated(true);
          setUserId(user.id);
          setUserRole(user.role || null);
          setUserProfile({
            id: user.id,
            name: user.name,
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

          // PENDING: novo usuário precisa escolher tipo (aluno ou academia)
          if (user.role === "PENDING") {
            router.push("/auth/register/user-type");
            setIsLoading(false);
            return;
          }

          // Verificar se há indicação pendente para redirecionar para assinatura
          const hasReferral = document.cookie.includes("gymrats_referral");

          if (user.role === "STUDENT" || user.role === "ADMIN") {
            loadAll().catch((err) => {
              console.error(
                "Erro ao carregar dados do student após login:",
                err,
              );
            });
            router.push(
              hasReferral
                ? "/student?tab=payments&subTab=subscription"
                : "/student",
            );
          } else if (user.role === "GYM") {
            router.push(
              hasReferral ? "/gym?tab=financial&subTab=subscription" : "/gym",
            );
          } else if (user.role === "PERSONAL") {
            router.push("/personal");
          } else {
            router.push("/welcome");
          }

          setIsLoading(false);
        } catch (err) {
          console.error("Erro ao processar OAuth success:", err);
          setError(
            err instanceof Error ? err.message : "Erro ao processar login",
          );
          setIsLoading(false);
        }
      } else if (event.data.type === "OAUTH_ERROR") {
        console.error("Erro do OAuth popup:", event.data.error);
        setError(event.data.error || "Erro ao fazer login com Google");
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleOAuthMessage);

    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, [
    router,
    setAuthenticated,
    setUserId,
    setUserProfile,
    setUserRole,
    loadAll,
  ]);

  // Verificar se há callback do Google OAuth (modo navegador normal)
  useEffect(() => {
    // Se está em PWA, não processar callbacks normais (usar postMessage)
    if (isPWA) {
      return;
    }

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
                (sessionResponse.user as {
                  role: "STUDENT" | "GYM" | "PERSONAL" | "ADMIN";
                })
                  .role || sessionResponse.user.role;

              // ⚠️ SEGURANÇA: Salvar apenas token no localStorage para compatibilidade
              // NÃO salvar userRole e isAdmin - sempre validar no servidor
              if (sessionResponse.session?.token) {
                localStorage.setItem(
                  "auth_token",
                  sessionResponse.session.token,
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

              // PENDING: novo usuário precisa escolher tipo (aluno ou academia)
              if ((userRole as string) === "PENDING") {
                router.push("/auth/register/user-type");
                return;
              }

              // Verificar se há indicação pendente para redirecionar para assinatura
              const hasReferral = document.cookie.includes("gymrats_referral");

              if (userRole === "STUDENT" || userRole === "ADMIN") {
                loadAll().catch((err) => {
                  console.error(
                    "Erro ao carregar dados do student após login:",
                    err,
                  );
                });
                router.push(
                  hasReferral
                    ? "/student?tab=payments&subTab=subscription"
                    : "/student",
                );
              } else if (userRole === "GYM") {
                router.push(
                  hasReferral
                    ? "/gym?tab=financial&subTab=subscription"
                    : "/gym",
                );
              } else if (userRole === "PERSONAL") {
                router.push("/personal");
              } else {
                router.push("/welcome");
              }
            }
          }
        } catch (err) {
          console.error("Erro ao verificar callback:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao processar login com Google",
          );
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
    isPWA,
  ]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const startUrl = buildGoogleStartUrl();

      // Se está em PWA, abrir OAuth em popup para voltar ao app após login
      if (isPWA) {
        // Marcar no sessionStorage que estamos abrindo popup (para callback detectar)
        sessionStorage.setItem("pwa_oauth_popup", "true");

        const popup = window.open(
          startUrl,
          "google-oauth-popup",
          "width=500,height=600,scrollbars=yes,resizable=yes,left=" +
            (window.screen.width / 2 - 250) +
            ",top=" +
            (window.screen.height / 2 - 300),
        );

        if (!popup) {
          sessionStorage.removeItem("pwa_oauth_popup");
          throw new Error(
            "Não foi possível abrir a janela de login. Verifique se os pop-ups estão habilitados.",
          );
        }

        oauthWindowRef.current = popup;

        // Monitorar se a popup foi fechada manualmente
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            sessionStorage.removeItem("pwa_oauth_popup");
            // Se fechou sem sucesso, pode ter sido cancelado
            if (isLoading) {
              setIsLoading(false);
              setError("Login cancelado pelo usuário");
            }
          }
        }, 500);

        // Limpar flag após um tempo (caso callback não seja chamado)
        setTimeout(
          () => {
            sessionStorage.removeItem("pwa_oauth_popup");
            clearInterval(checkClosed);
          },
          5 * 60 * 1000,
        ); // 5 minutos máximo
      } else {
        window.location.assign(startUrl);
        return;
      }
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
    <div className="flex min-h-screen flex-col bg-duo-bg">
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
            <DuoCard.Root variant="default" size="lg">
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

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border-2 border-duo-danger bg-duo-danger/10 p-3 text-sm font-medium text-duo-danger"
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

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-duo-fg-muted">
              Ao continuar, você concorda com nossos{" "}
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
