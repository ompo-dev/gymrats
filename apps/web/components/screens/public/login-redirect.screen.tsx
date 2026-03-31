"use client";

import type { ScreenProps, ViewContract } from "@/components/foundations";

export interface LoginRedirectScreenProps
  extends ScreenProps<{
    message?: string;
  }> {}

export const loginRedirectScreenContract: ViewContract = {
  componentId: "login-redirect-screen",
  testId: "login-redirect-screen",
};

export function LoginRedirectScreen({
  message = "Redirecionando...",
}: LoginRedirectScreenProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white"
      data-testid={loginRedirectScreenContract.testId}
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-20 w-20 animate-spin rounded-full border-4 border-[#58CC02] border-t-transparent" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
