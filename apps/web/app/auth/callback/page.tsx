"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthCallbackScreen } from "@/components/screens/public";
import { type AuthSessionResponse, authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores";

function resolveSafeNextPath(nextValue: string | null): string | null {
  if (!nextValue || !nextValue.startsWith("/") || nextValue.startsWith("//")) {
    return null;
  }

  return nextValue;
}

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
      const nextPath = resolveSafeNextPath(searchParams.get("next"));

      const redirectURL =
        nextPath && userRole !== "PENDING"
          ? nextPath
          : userRole === "PENDING"
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
          const fallbackUrl = new URL("/welcome", window.location.origin);
          const nextPath = resolveSafeNextPath(searchParams.get("next"));
          fallbackUrl.searchParams.set("error", "google");
          if (nextPath) {
            fallbackUrl.searchParams.set("next", nextPath);
          }
          window.location.replace(fallbackUrl.toString());
        }, 2000);
      }
    };

    processCallback();
  }, [searchParams, syncSession]);

  return (
    <AuthCallbackScreen error={error} status={status} />
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackScreen status="processing" />}>
      <AuthCallbackPageContent />
    </Suspense>
  );
}
