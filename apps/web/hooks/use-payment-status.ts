"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getPaymentStatusRequest } from "@/lib/api/bootstrap";
import { queryKeys } from "@/lib/query/query-keys";

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
  const [attempt, setAttempt] = useState(0);
  const query = useQuery({
    queryKey: queryKeys.paymentStatus(paymentId ?? "unknown"),
    queryFn: () => getPaymentStatusRequest(paymentId!),
    enabled: Boolean(paymentId) && (options?.enabled ?? true),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const backoffMs = options?.backoffMs ?? DEFAULT_BACKOFF_MS;
  const status = query.data?.status;
  const pollingEnabled =
    Boolean(paymentId) &&
    (options?.enabled ?? true) &&
    !isTerminalStatus(status);

  useEffect(() => {
    if (!pollingEnabled) {
      setAttempt(0);
      return;
    }
    const delay = backoffMs[Math.min(attempt, backoffMs.length - 1)] ?? 10000;
    const timeout =
      document.visibilityState === "visible"
        ? window.setTimeout(() => {
            setAttempt((current) => current + 1);
            void query.refetch();
          }, delay)
        : null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setAttempt(0);
        void query.refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeout != null) {
        window.clearTimeout(timeout);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [attempt, backoffMs, pollingEnabled, query.refetch]);

  return {
    ...query,
    status,
    isTerminal: isTerminalStatus(status),
  };
}
