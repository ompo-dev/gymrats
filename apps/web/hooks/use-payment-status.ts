"use client";

import { useCallback, useEffect, useState } from "react";
import { getPaymentStatusRequest } from "@/lib/api/bootstrap";

const DEFAULT_BACKOFF_MS = [2000, 5000, 10000] as const;

function isTerminalStatus(status?: string | null) {
  return (
    status === "paid" ||
    status === "canceled" ||
    status === "expired" ||
    status === "withdrawn"
  );
}

export function usePaymentStatus(
  paymentId: string | null | undefined,
  options?: {
    enabled?: boolean;
    backoffMs?: readonly number[];
  },
) {
  const isEnabled = Boolean(paymentId) && (options?.enabled ?? true);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [isFetching, setIsFetching] = useState(false);
  const backoffMs = options?.backoffMs ?? DEFAULT_BACKOFF_MS;

  const refetch = useCallback(async () => {
    if (!paymentId) {
      setStatus(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsFetching(true);
    setIsLoading((current) => current || status === null);
    setError(null);

    try {
      const response = await getPaymentStatusRequest(paymentId);
      setStatus(response.status);
      return response;
    } catch (cause) {
      const resolvedError =
        cause instanceof Error ? cause : new Error("Erro ao consultar pagamento");
      setError(resolvedError);
      throw resolvedError;
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [paymentId, status]);

  useEffect(() => {
    if (!isEnabled) {
      setAttempt(0);
      setStatus(null);
      setError(null);
      setIsLoading(false);
      setIsFetching(false);
      return;
    }

    void refetch();
  }, [isEnabled, paymentId, refetch]);

  useEffect(() => {
    const pollingEnabled = isEnabled && !isTerminalStatus(status);

    if (!pollingEnabled) {
      setAttempt(0);
      return;
    }

    const delay = backoffMs[Math.min(attempt, backoffMs.length - 1)] ?? 10000;
    const timeout =
      document.visibilityState === "visible"
        ? window.setTimeout(() => {
            setAttempt((current) => current + 1);
            void refetch();
          }, delay)
        : null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setAttempt(0);
        void refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeout != null) {
        window.clearTimeout(timeout);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [attempt, backoffMs, isEnabled, refetch, status]);

  return {
    data: status ? { id: paymentId ?? "", status } : undefined,
    status,
    error,
    isLoading,
    isFetching,
    isTerminal: isTerminalStatus(status),
    refetch,
  };
}
