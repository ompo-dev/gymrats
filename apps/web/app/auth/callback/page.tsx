"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { type AuthSessionResponse, authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores";

function AuthCallbackPageContent() {
  const searchParams = useSearchParams();
  const syncSession = useAuthStore((state) => state.syncSession);
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const processSuccess = (sessionResponse: AuthSessionResponse) => {
      syncSession({
        user: {
          id: sessionResponse.user.id,
          email: sessionResponse.user.email,
          name: sessionResponse.user.name,
          role:
            (sessionResponse.user.role as
              | "PENDING"
              | "STUDENT"
              | "GYM"
              | "PERSONAL"
              | "ADMIN") ?? "STUDENT",
          hasGym: sessionResponse.user.hasGym ?? false,
          hasStudent: sessionResponse.user.hasStudent ?? false,
        },
        session: sessionResponse.session
          ? {
              id: "callback",
              token: sessionResponse.session.token,
            }
          : null,
      });

      const userRole = sessionResponse.user.role;
      setStatus("success");
      const hasReferral = document.cookie.includes("gymrats_referral");

      const redirectURL =
        userRole === "PENDING"
          ? "/auth/register/user-type"
          : userRole === "GYM"
            ? hasReferral
              ? "/gym?tab=financial&subTab=subscription"
              : "/gym"
            : userRole === "PERSONAL"
              ? "/personal"
              : hasReferral
                ? "/student?tab=payments&subTab=subscription"
                : "/student";

      window.location.replace(redirectURL);
    };

    const processCallback = async () => {
      try {
        const errorParam = searchParams.get("error");
        if (errorParam) {
          throw new Error("Erro durante autenticacao. Tente novamente.");
        }

        const urlToken =
          searchParams.get("token") || searchParams.get("oneTimeToken");

        let sessionResponse =
          urlToken != null
            ? await authApi.exchangeOneTimeToken(urlToken)
            : null;

        if (!sessionResponse) {
          sessionResponse = await authApi.getSession();
        }

        if (!sessionResponse?.user) {
          throw new Error("Erro ao buscar dados da sessao");
        }

        processSuccess(sessionResponse);
      } catch (err) {
        console.error("Erro ao processar callback:", err);
        const message =
          err instanceof Error ? err.message : "Erro ao processar login";
        setError(message);
        setStatus("error");

        setTimeout(() => {
          window.location.replace("/welcome?error=google");
        }, 2000);
      }
    };

    processCallback();
  }, [searchParams, syncSession]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        {status === "processing" && (
          <>
            <div className="w-20 h-20 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Processando login...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-[#58CC02] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Sucesso"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-gray-600">Login realizado com sucesso!</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Erro"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-red-600 font-bold mb-2">Erro ao fazer login</p>
            <p className="text-sm text-gray-600">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackPageContent />
    </Suspense>
  );
}
