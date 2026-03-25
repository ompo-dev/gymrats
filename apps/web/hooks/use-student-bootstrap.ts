"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { getStudentBootstrapRequest } from "@/lib/api/bootstrap";
import { recordClientTelemetryEvent } from "@/lib/observability/client-events";
import { queryKeys } from "@/lib/query/query-keys";
import type {
  PaymentMethod,
  StudentGymMembership,
  StudentPayment,
} from "@/lib/types";
import type {
  StudentData,
  StudentDataSection,
  StudentReferralData,
  SubscriptionData,
} from "@/lib/types/student-unified";

export const STUDENT_FINANCIAL_BOOTSTRAP_SECTIONS = [
  "subscription",
  "memberships",
  "payments",
  "paymentMethods",
  "referral",
] as const satisfies readonly StudentDataSection[];

function normalizeMemberships(
  memberships: Partial<StudentData>["memberships"],
): StudentGymMembership[] {
  if (!Array.isArray(memberships)) {
    return [];
  }

  return memberships.map((membership) => ({
    ...membership,
    startDate: membership.startDate
      ? membership.startDate instanceof Date
        ? membership.startDate
        : new Date(membership.startDate)
      : new Date(),
    nextBillingDate: membership.nextBillingDate
      ? membership.nextBillingDate instanceof Date
        ? membership.nextBillingDate
        : new Date(membership.nextBillingDate)
      : undefined,
  }));
}

function normalizePayments(
  payments: Partial<StudentData>["payments"],
): StudentPayment[] {
  if (!Array.isArray(payments)) {
    return [];
  }

  return payments.map((payment) => ({
    ...payment,
    date: payment.date
      ? payment.date instanceof Date
        ? payment.date
        : new Date(payment.date)
      : new Date(),
    dueDate: payment.dueDate
      ? payment.dueDate instanceof Date
        ? payment.dueDate
        : new Date(payment.dueDate)
      : new Date(),
  }));
}

export function selectStudentFinancialSnapshot(data?: Partial<StudentData>) {
  return {
    subscription:
      (data?.subscription as SubscriptionData | null | undefined) ?? null,
    memberships: normalizeMemberships(data?.memberships),
    payments: normalizePayments(data?.payments),
    paymentMethods: Array.isArray(data?.paymentMethods)
      ? (data.paymentMethods as PaymentMethod[])
      : [],
    referral:
      (data?.referral as StudentReferralData | null | undefined) ?? null,
  };
}

export function useStudentBootstrap(
  sections?: readonly StudentDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const query = useQuery({
    queryKey: queryKeys.studentBootstrap(sections),
    queryFn: () => getStudentBootstrapRequest(sections),
    enabled: options?.enabled ?? true,
    retry: false,
  });
  const lastTrackedRequestId = useRef<string | null>(null);

  useEffect(() => {
    if (
      !query.data?.meta.requestId ||
      query.data.meta.requestId === lastTrackedRequestId.current
    ) {
      return;
    }

    lastTrackedRequestId.current = query.data.meta.requestId;
    const payloadBytes = new Blob([JSON.stringify(query.data.data)]).size;

    void recordClientTelemetryEvent({
      eventType: "student.bootstrap_loaded",
      domain: "student",
      journey: "student",
      metricName: "bootstrapBytes",
      metricValue: payloadBytes,
      payload: {
        requestId: query.data.meta.requestId,
        generatedAt: query.data.meta.generatedAt,
        sections: sections ?? ["all"],
        sectionTimings: query.data.meta.sectionTimings,
      },
    });
  }, [query.data, sections]);

  return query;
}

export function useStudentPayments(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(["payments"], options);
  return {
    ...query,
    payments: normalizePayments(query.data?.data.payments),
  };
}

export function useStudentMemberships(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(["memberships"], options);
  return {
    ...query,
    memberships: normalizeMemberships(query.data?.data.memberships),
  };
}

export function useSubscriptionState(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(["subscription"], options);
  return {
    ...query,
    subscription: query.data?.data.subscription ?? null,
  };
}

export function useStudentReferralBootstrap(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(["referral"], options);

  return {
    ...query,
    referral:
      (query.data?.data.referral as StudentReferralData | null | undefined) ??
      null,
  };
}

export function useStudentFinancialBootstrap(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(
    STUDENT_FINANCIAL_BOOTSTRAP_SECTIONS,
    options,
  );
  const financialData = useMemo(
    () => selectStudentFinancialSnapshot(query.data?.data),
    [query.data?.data],
  );

  return {
    ...query,
    ...financialData,
  };
}
