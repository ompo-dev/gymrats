"use client";

import { useCallback, useState } from "react";
import { invalidateBootstrapDomain } from "@/hooks/use-bootstrap-refresh";
import { useStudent } from "@/hooks/use-student";
import type { StudentPixPaymentPayload } from "@/lib/types/student-unified";

type MutationState<TResult, TArgs extends unknown[]> = {
  mutateAsync: (...args: TArgs) => Promise<TResult>;
  isPending: boolean;
};

export function usePaymentFlow() {
  const {
    payStudentPayment,
    cancelStudentPayment,
  } = useStudent("actions");
  const [isPayingNow, setIsPayingNow] = useState(false);
  const [isCancelingPayment, setIsCancelingPayment] = useState(false);

  const invalidatePaymentQueries = useCallback(async () => {
    invalidateBootstrapDomain("student");
  }, []);

  const payNow = {
    mutateAsync: async (paymentId: string) => {
      setIsPayingNow(true);

      try {
        return await payStudentPayment(paymentId);
      } finally {
        setIsPayingNow(false);
      }
    },
    isPending: isPayingNow,
  } satisfies MutationState<StudentPixPaymentPayload, [string]>;

  const cancelPayment = {
    mutateAsync: async (paymentId: string) => {
      setIsCancelingPayment(true);

      try {
        await cancelStudentPayment(paymentId);
      } finally {
        setIsCancelingPayment(false);
      }
    },
    isPending: isCancelingPayment,
  } satisfies MutationState<void, [string]>;

  return {
    payNow,
    cancelPayment,
    invalidatePaymentQueries,
  };
}
