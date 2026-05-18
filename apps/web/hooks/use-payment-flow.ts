"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { invalidateBootstrapDomain } from "@/hooks/use-bootstrap-refresh";
import { useStudent } from "@/hooks/use-student";
import type { StudentPixPaymentPayload } from "@/lib/types/student-unified";

type MutationState<TResult, TArgs extends unknown[]> = {
  mutateAsync: (...args: TArgs) => Promise<TResult>;
  isPending: boolean;
};

export function usePaymentFlow() {
  const { payStudentPayment, cancelStudentPayment } = useStudent("actions");
  const [pendingPayNowById, setPendingPayNowById] = useState<
    Record<string, boolean>
  >({});
  const [isCancelingPayment, setIsCancelingPayment] = useState(false);
  const payNowPromisesRef = useRef<
    Map<string, Promise<StudentPixPaymentPayload>>
  >(new Map());

  const invalidatePaymentQueries = useCallback(async () => {
    invalidateBootstrapDomain("student");
  }, []);

  const hasPendingPayNow = useMemo(
    () => Object.keys(pendingPayNowById).length > 0,
    [pendingPayNowById],
  );

  const isPayNowPending = useCallback(
    (paymentId: string) => Boolean(pendingPayNowById[paymentId]),
    [pendingPayNowById],
  );

  const payNow = {
    mutateAsync: async (paymentId: string) => {
      const pendingRequest = payNowPromisesRef.current.get(paymentId);
      if (pendingRequest) {
        return pendingRequest;
      }

      setPendingPayNowById((current) => ({ ...current, [paymentId]: true }));

      const request = (async () => {
        try {
          const result = await payStudentPayment(paymentId);
          await invalidatePaymentQueries();
          return result;
        } finally {
          payNowPromisesRef.current.delete(paymentId);
          setPendingPayNowById((current) => {
            if (!current[paymentId]) {
              return current;
            }

            const next = { ...current };
            delete next[paymentId];
            return next;
          });
        }
      })();

      payNowPromisesRef.current.set(paymentId, request);
      return request;
    },
    isPending: hasPendingPayNow,
  } satisfies MutationState<StudentPixPaymentPayload, [string]>;

  const cancelPayment = {
    mutateAsync: async (paymentId: string) => {
      setIsCancelingPayment(true);

      try {
        await cancelStudentPayment(paymentId);
        await invalidatePaymentQueries();
      } finally {
        setIsCancelingPayment(false);
      }
    },
    isPending: isCancelingPayment,
  } satisfies MutationState<void, [string]>;

  return {
    payNow,
    cancelPayment,
    pendingPayNowById,
    isPayNowPending,
    invalidatePaymentQueries,
  };
}
