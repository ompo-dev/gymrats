"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { DuoButton } from "@/components/ui/duo-button";
import { Dumbbell, Chrome, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { authApi } from "@/lib/api/auth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthenticated, setUserId, setUserProfile, setUserRole } =
    useAuthStore();
  // IMPORTANTE: Selecionar diretamente a função, não criar objeto
  const loadAll = useStudentUnifiedStore((state) => state.loadAll);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Verificar se há callback do Google OAuth
  useEffect(() => {
    const checkCallback = async () => {
      // Se vier de um callback do Google, verificar sessão
      const callbackParam = searchParams.get("callback");
      if (callbackParam) {
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

              // Salvar token e dados (compatibilidade com sistema existente)
              if (sessionResponse.session?.token) {
                localStorage.setItem(
                  "auth_token",
                  sessionResponse.session.token
                );
              }
              localStorage.setItem("isAuthenticated", "true");
              localStorage.setItem("userEmail", sessionResponse.user.email);
              localStorage.setItem("userId", sessionResponse.user.id);
              localStorage.setItem("userRole", userRole || "");
              localStorage.setItem(
                "isAdmin",
                userRole === "ADMIN" ? "true" : "false"
              );

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
                router.push("/auth/register/user-type");
              }
            }
          }
        } catch (err: any) {
          console.error("Erro ao verificar callback:", err);
          setError(err.message || "Erro ao processar login com Google");
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
        callbackURL: "/auth/login?callback=google",
        errorCallbackURL: "/auth/login?error=google",
        newUserCallbackURL: "/auth/login?callback=google",
      });
      // O redirecionamento para Google será automático
      // Não precisamos fazer nada aqui, o callback será tratado no useEffect
    } catch (err: any) {
      console.error("Erro ao iniciar login com Google:", err);
      setError(err.message || "Erro ao iniciar login com Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 shrink-0">
        <Link href="/welcome">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </motion.button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
              className="flex justify-center mb-4"
            >
              <div className="w-20 h-20 bg-linear-to-br from-[#58CC02] to-[#47A302] rounded-3xl flex items-center justify-center shadow-lg">
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Entrar</h1>
            <p className="text-gray-600">Bem-vindo de volta!</p>
          </div>

          {/* Error Message */}
          {(error || searchParams.get("error")) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium"
            >
              {error || "Erro ao fazer login com Google. Tente novamente."}
            </motion.div>
          )}

          {/* Google Login - Único método de autenticação */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DuoButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              loading={isLoading}
              animation="scale"
            >
              <Chrome className="w-5 h-5" />
              {isLoading ? "Conectando..." : "Entrar com Google"}
            </DuoButton>
          </motion.div>

          {/* Informação sobre login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-600 text-sm">
              Use sua conta Google para acessar o GymRats.
              <br />
              <span className="text-xs text-gray-500 mt-1 block">
                Se você já tinha uma conta, use o mesmo email do Google.
              </span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginPageContent />
    </Suspense>
  );
}
