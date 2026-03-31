"use client";

import type { ScreenProps, ViewContract } from "@/components/foundations";

export type AuthCallbackStatus = "processing" | "success" | "error";

export interface AuthCallbackScreenProps
  extends ScreenProps<{
    status: AuthCallbackStatus;
    error?: string;
  }> {}

export const authCallbackScreenContract: ViewContract = {
  componentId: "auth-callback-screen",
  testId: "auth-callback-screen",
};

export function AuthCallbackScreen({
  status,
  error = "",
}: AuthCallbackScreenProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white"
      data-testid={authCallbackScreenContract.testId}
    >
      <div className="text-center">
        {status === "processing" ? (
          <>
            <div className="mx-auto mb-4 h-20 w-20 animate-spin rounded-full border-4 border-[#58CC02] border-t-transparent" />
            <p className="text-gray-600">Processando login...</p>
          </>
        ) : null}

        {status === "success" ? (
          <>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#58CC02]">
              <svg
                aria-label="Sucesso"
                className="h-12 w-12 text-white"
                fill="none"
                role="img"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <p className="text-gray-600">Login realizado com sucesso!</p>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500">
              <svg
                aria-label="Erro"
                className="h-12 w-12 text-white"
                fill="none"
                role="img"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <p className="mb-2 font-bold text-red-600">Erro ao fazer login</p>
            <p className="text-sm text-gray-600">{error}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
