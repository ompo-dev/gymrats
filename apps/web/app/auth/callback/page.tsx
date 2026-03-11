"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { setAuthToken } from "@/lib/auth/token-client";
import { authClient } from "@/lib/auth-client";
import { isStandaloneMode } from "@/lib/utils/pwa-detection";

function AuthCallbackPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [error, setError] = useState("");

  const [isInPopup] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.opener !== null && window.opener !== window) {
      return true;
    }

    return sessionStorage.getItem("pwa_oauth_popup") === "true";
  });
  const _isPWA = typeof window !== "undefined" ? isStandaloneMode() : false;

  useEffect(() => {
    if (isInPopup && typeof window !== "undefined") {
      sessionStorage.removeItem("pwa_oauth_popup");
    }
  }, [isInPopup]);

  useEffect(() => {
    const processSuccess = (sessionResponse: {
      user: {
        id: string;
        email?: string | null;
        name?: string | null;
        role?: string;
      };
      session?: { token?: string };
    }) => {
      if (sessionResponse.session?.token) {
        setAuthToken(sessionResponse.session.token);
      }

      const userRole = (sessionResponse.user as { role?: string }).role;

      if (isInPopup && window.opener) {
        window.opener.postMessage(
          {
            type: "OAUTH_SUCCESS",
            user: {
              id: sessionResponse.user.id,
              email: sessionResponse.user.email,
              name: sessionResponse.user.name,
              role: userRole,
            },
            session: {
              token: sessionResponse.session?.token,
            },
          },
          window.location.origin,
        );

        setStatus("success");

        setTimeout(() => {
          window.close();
        }, 1000);

        return;
      }

      const redirectURL =
        userRole === "PENDING"
          ? "/auth/register/user-type"
          : userRole === "GYM"
            ? "/gym"
            : userRole === "PERSONAL"
              ? "/personal"
              : "/student";

      window.location.href = redirectURL;
    };

    const processCallback = async () => {
      try {
        const errorParam = searchParams.get("error");
        if (errorParam) {
          throw new Error("Erro durante autenticacao. Tente novamente.");
        }

        const urlToken =
          searchParams.get("token") || searchParams.get("oneTimeToken");

        await new Promise((resolve) => setTimeout(resolve, 1500));

        let sessionResponse =
          urlToken != null
            ? await authApi.exchangeOneTimeToken(urlToken)
            : null;

        if (!sessionResponse) {
          try {
            const generated = await authClient.oneTimeToken.generate();
            if (generated?.data?.token) {
              sessionResponse = await authApi.exchangeOneTimeToken(
                generated.data.token,
              );
            }
          } catch (generateError) {
            console.warn(
              "Falha ao gerar one-time token, tentando fallback de sessao:",
              generateError,
            );
          }
        }

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

        if (isInPopup && window.opener) {
          window.opener.postMessage(
            {
              type: "OAUTH_ERROR",
              error: message,
            },
            window.location.origin,
          );

          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          setTimeout(() => {
            window.location.href = "/welcome?error=google";
          }, 2000);
        }

        setStatus("error");
      }
    };

    processCallback();
  }, [searchParams, isInPopup]);

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
            {isInPopup && (
              <p className="text-sm text-gray-500 mt-2">
                Esta janela sera fechada automaticamente...
              </p>
            )}
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
            {isInPopup && (
              <p className="text-sm text-gray-500 mt-2">
                Esta janela sera fechada automaticamente...
              </p>
            )}
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
