"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateBootstrapQueries } from "@/hooks/use-bootstrap-refresh";
import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import type { StudentPixPaymentPayload } from "@/lib/types/student-unified";

function createIdempotencyKey(scope: string, entityId: string) {
  const cryptoApi =
    typeof window !== "undefined" && "crypto" in window ? window.crypto : null;
  const suffix =
    cryptoApi && "randomUUID" in cryptoApi
      ? cryptoApi.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${scope}:${entityId}:${suffix}`;
}

export function usePaymentFlow() {
  const queryClient = useQueryClient();

  const invalidatePaymentQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentMemberships(),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.studentPayments() }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentSubscription(),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.studentReferral() }),
      invalidateBootstrapQueries(queryClient, "student"),
    ]);
  };

  const payNow = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await apiClient.post<StudentPixPaymentPayload>(
        `/api/students/payments/${paymentId}/pay-now`,
        {},
        {
          headers: {
            "X-Idempotency-Key": createIdempotencyKey(
              "student-pay-now",
              paymentId,
            ),
          },
        },
      );
      return response.data;
    },
  });

  const cancelPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      await apiClient.patch(
        `/api/payments/${paymentId}`,
        { status: "canceled" },
        {
          headers: {
            "X-Idempotency-Key": createIdempotencyKey(
              "student-cancel-payment",
              paymentId,
            ),
          },
        },
      );
    },
    onSuccess: invalidatePaymentQueries,
  });

  return {
    payNow,
    cancelPayment,
    invalidatePaymentQueries,
  };
}
