"use client";

import { useCallback, useMemo } from "react";
import {
  useBootstrapHydrationEffect,
  useBootstrapTelemetry,
} from "@/hooks/use-bootstrap-lifecycle";
import { useDomainBootstrap } from "@/hooks/shared/use-domain-bootstrap";
import { useStudent } from "@/hooks/use-student";
import { getStudentBootstrapRequest } from "@/lib/api/bootstrap";
import { DEFAULT_STUDENT_BOOTSTRAP_SECTIONS } from "@/lib/api/bootstrap-sections";
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
import {
  hydrateStudentBootstrapData,
  updateStoreWithSection,
} from "@/stores/student/load-helpers";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

type StudentStoreSetter = (
  fn: (state: { data: StudentData }) => { data: StudentData },
) => void;

export const STUDENT_BASE_BOOTSTRAP_SECTIONS =
  DEFAULT_STUDENT_BOOTSTRAP_SECTIONS;

export const STUDENT_HOME_BOOTSTRAP_SECTIONS =
  [
    "user",
    "progress",
    "workoutHistory",
    "profile",
    "weightHistory",
    "weeklyPlan",
    "units",
    "dailyNutrition",
    "gymLocations",
  ] as const satisfies readonly StudentDataSection[];

export const STUDENT_LEARN_BOOTSTRAP_SECTIONS = [
  "weeklyPlan",
  "progress",
  "workoutHistory",
  "units",
] as const satisfies readonly StudentDataSection[];

export const STUDENT_DIET_BOOTSTRAP_SECTIONS = [
  "activeNutritionPlan",
  "dailyNutrition",
  "progress",
] as const satisfies readonly StudentDataSection[];

export const STUDENT_PROFILE_BOOTSTRAP_SECTIONS = [
  "user",
  "profile",
  "weightHistory",
  "progress",
  "personalRecords",
  "workoutHistory",
  "units",
] as const satisfies readonly StudentDataSection[];

export const STUDENT_GYMS_BOOTSTRAP_SECTIONS = [
  "gymLocations",
  "memberships",
  "dayPasses",
] as const satisfies readonly StudentDataSection[];

export const STUDENT_FINANCIAL_BOOTSTRAP_SECTIONS = [
  "subscription",
  "memberships",
  "payments",
  "paymentMethods",
  "referral",
] as const satisfies readonly StudentDataSection[];

function getComparableValue(value: Date | string | number | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value ?? null;
}

function hasCollectionDelta<T extends { id: string }>(
  remote: T[],
  store: T[],
  fields: Array<keyof T>,
) {
  if (remote.length !== store.length) {
    return true;
  }

  const remoteById = new Map(remote.map((item) => [item.id, item]));

  return store.some((item) => {
    const remoteItem = remoteById.get(item.id);

    if (!remoteItem) {
      return true;
    }

    return fields.some(
      (field) =>
        getComparableValue(
          remoteItem[field] as Date | string | number | null | undefined,
        ) !==
        getComparableValue(
          item[field] as Date | string | number | null | undefined,
        ),
    );
  });
}

function resolveCollectionBridge<T extends { id: string }>(
  remote: T[],
  store: T[],
  fields: Array<keyof T>,
) {
  if (remote.length === 0) {
    return store;
  }

  if (store.length === 0) {
    return remote;
  }

  return hasCollectionDelta(remote, store, fields) ? store : remote;
}

function resolveSubscriptionBridge(
  remote: SubscriptionData | null,
  store: StudentData["subscription"] | null | undefined,
) {
  if (!remote) {
    return (store as SubscriptionData | null | undefined) ?? null;
  }

  if (!store) {
    return remote;
  }

  const hasDelta =
    remote.id !== store.id ||
    remote.status !== store.status ||
    remote.cancelAtPeriodEnd !== store.cancelAtPeriodEnd ||
    getComparableValue(remote.currentPeriodEnd) !==
      getComparableValue(store.currentPeriodEnd) ||
    getComparableValue(remote.trialEnd) !==
      getComparableValue(store.trialEnd) ||
    remote.daysRemaining !== store.daysRemaining;

  return hasDelta ? (store as SubscriptionData) : remote;
}

function resolveReferralBridge(
  remote: StudentReferralData | null,
  store: StudentData["referral"] | null | undefined,
) {
  if (!remote) {
    return (store as StudentReferralData | null | undefined) ?? null;
  }

  if (!store) {
    return remote;
  }

  const hasDelta =
    remote.referralCode !== store.referralCode ||
    remote.pixKey !== store.pixKey ||
    remote.pixKeyType !== store.pixKeyType ||
    remote.balanceCents !== store.balanceCents ||
    remote.totalEarnedCents !== store.totalEarnedCents ||
    hasCollectionDelta(remote.withdraws, store.withdraws, [
      "status",
      "amount",
      "createdAt",
      "completedAt",
    ]);

  return hasDelta ? (store as StudentReferralData) : remote;
}

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

function selectStudentFinancialSnapshot(data?: Partial<StudentData>) {
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

function resolveStudentFinancialSnapshot(
  remote: ReturnType<typeof selectStudentFinancialSnapshot>,
  store: Pick<
    StudentData,
    "subscription" | "memberships" | "payments" | "paymentMethods" | "referral"
  >,
) {
  return {
    subscription: resolveSubscriptionBridge(
      remote.subscription,
      store.subscription,
    ),
    memberships: resolveCollectionBridge(
      remote.memberships,
      store.memberships,
      ["status", "planId", "amount", "gymId", "nextBillingDate"],
    ),
    payments: resolveCollectionBridge(remote.payments, store.payments, [
      "status",
      "amount",
      "date",
      "dueDate",
      "planName",
    ]),
    paymentMethods:
      remote.paymentMethods.length === 0
        ? store.paymentMethods
        : store.paymentMethods.length > 0 &&
            remote.paymentMethods.length !== store.paymentMethods.length
          ? store.paymentMethods
          : remote.paymentMethods,
    referral: resolveReferralBridge(remote.referral, store.referral),
  };
}

function useHydrateStudentSnapshot(
  sections: readonly StudentDataSection[] | undefined,
  snapshot: Partial<StudentData> | null | undefined,
  meta:
    | {
        requestId?: string | null;
        generatedAt?: string | null;
      }
    | null
    | undefined,
  options?: {
    initialize?: boolean;
  },
) {
  const setState =
    useStudentUnifiedStore.setState as unknown as StudentStoreSetter;
  const handleHydrate = useCallback(() => {
    if (!snapshot) {
      return;
    }

    if (options?.initialize) {
      hydrateStudentBootstrapData(setState, snapshot);
      return;
    }

    updateStoreWithSection(setState, snapshot);
  }, [options?.initialize, setState, snapshot]);

  useBootstrapHydrationEffect({
    domain: "student",
    sections,
    meta,
    ready: Boolean(snapshot),
    onHydrate: handleHydrate,
  });
}

export function useStudentBootstrap(
  sections?: readonly StudentDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const query = useDomainBootstrap({
    domain: "student",
    sections,
    enabled: options?.enabled,
    queryKey: queryKeys.studentBootstrap(sections),
    queryFn: () => getStudentBootstrapRequest(sections),
  });
  useBootstrapTelemetry({
    domain: "student",
    sections,
    data: query.data?.data,
    meta: query.data?.meta,
  });

  return query;
}

export function useStudentBootstrapBridge(
  sections?: readonly StudentDataSection[],
  options?: {
    enabled?: boolean;
    initialize?: boolean;
  },
) {
  const query = useStudentBootstrap(sections, options);
  useHydrateStudentSnapshot(sections, query.data?.data, query.data?.meta, {
    initialize: options?.initialize,
  });

  return query;
}

export function useStudentDefaultBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return useStudentBootstrapBridge(STUDENT_BASE_BOOTSTRAP_SECTIONS, {
    ...options,
    initialize: true,
  });
}

export function useStudentHomeBootstrapBridge(options?: { enabled?: boolean }) {
  return useStudentBootstrapBridge(STUDENT_HOME_BOOTSTRAP_SECTIONS, options);
}

export function useStudentLearnBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return useStudentBootstrapBridge(STUDENT_LEARN_BOOTSTRAP_SECTIONS, options);
}

export function useStudentDietBootstrapBridge(options?: { enabled?: boolean }) {
  return useStudentBootstrapBridge(STUDENT_DIET_BOOTSTRAP_SECTIONS, options);
}

export function useStudentProfileBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return useStudentBootstrapBridge(STUDENT_PROFILE_BOOTSTRAP_SECTIONS, options);
}

export function useStudentGymsBootstrapBridge(options?: { enabled?: boolean }) {
  return useStudentBootstrapBridge(STUDENT_GYMS_BOOTSTRAP_SECTIONS, options);
}

export function useStudentMemberships(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(["memberships"], options);
  const storeMemberships =
    (useStudent("memberships") as StudentGymMembership[] | undefined) ?? [];
  const memberships = useMemo(
    () =>
      resolveCollectionBridge(
        normalizeMemberships(query.data?.data.memberships),
        storeMemberships,
        ["status", "planId", "amount", "gymId", "nextBillingDate"],
      ),
    [query.data?.data.memberships, storeMemberships],
  );

  useHydrateStudentSnapshot(
    ["memberships"],
    query.data?.data
      ? {
          memberships,
        }
      : null,
    query.data?.meta,
  );

  return {
    ...query,
    memberships,
  };
}

export function useStudentReferralBootstrap(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(["referral"], options);
  const storeReferral = useStudent("referral") as
    | StudentReferralData
    | null
    | undefined;
  const referral = useMemo(
    () =>
      resolveReferralBridge(
        (query.data?.data.referral as StudentReferralData | null | undefined) ??
          null,
        storeReferral,
      ),
    [query.data?.data.referral, storeReferral],
  );

  useHydrateStudentSnapshot(
    ["referral"],
    query.data?.data
      ? {
          referral,
        }
      : null,
    query.data?.meta,
  );

  return {
    ...query,
    referral,
  };
}

export function useStudentFinancialBootstrap(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(
    STUDENT_FINANCIAL_BOOTSTRAP_SECTIONS,
    options,
  );
  const storeFinancial = useStudent(
    "subscription",
    "memberships",
    "payments",
    "paymentMethods",
    "referral",
  ) as Pick<
    StudentData,
    "subscription" | "memberships" | "payments" | "paymentMethods" | "referral"
  >;
  const financialData = useMemo(
    () =>
      resolveStudentFinancialSnapshot(
        selectStudentFinancialSnapshot(query.data?.data),
        storeFinancial,
      ),
    [query.data?.data, storeFinancial],
  );
  useHydrateStudentSnapshot(
    STUDENT_FINANCIAL_BOOTSTRAP_SECTIONS,
    query.data?.data ? financialData : null,
    query.data?.meta,
  );

  return {
    ...query,
    ...financialData,
  };
}
