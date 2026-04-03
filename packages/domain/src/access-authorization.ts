import type {
  AccessAuthorizationStatus,
  AccessFinancialStatus,
  AccessSubjectType,
} from "@gymrats/types";

export type AccessReasonCode =
  | "membership_paid_up"
  | "payment_pending_not_due"
  | "payment_in_grace"
  | "payment_overdue"
  | "payment_overdue_no_grace"
  | "membership_pending_activation"
  | "membership_suspended"
  | "membership_canceled"
  | "membership_not_found"
  | "personal_affiliation_active"
  | "personal_affiliation_inactive"
  | "not_evaluated";

export interface EligibilityDecision {
  authorizationStatus: AccessAuthorizationStatus;
  financialStatus: AccessFinancialStatus;
  reasonCode: AccessReasonCode;
  graceUntil: Date | null;
  isAllowed: boolean;
}

type StudentEligibilityInput = {
  membershipStatus?: string | null;
  paymentStatus?: string | null;
  dueDate?: Date | string | null;
  graceDays?: number | null;
  now?: Date;
};

type PersonalEligibilityInput = {
  affiliationStatus?: string | null;
};

export function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isAuthorizationAllowed(
  authorizationStatus: AccessAuthorizationStatus,
) {
  return (
    authorizationStatus === "eligible" || authorizationStatus === "grace"
  );
}

export function deriveOperationalPaymentStatus(input: {
  authorizationStatus?: AccessAuthorizationStatus | null;
  financialStatus?: AccessFinancialStatus | null;
}) {
  if (input.authorizationStatus === "blocked") {
    return "blocked" as const;
  }

  if (input.authorizationStatus === "grace") {
    return "grace" as const;
  }

  if (input.financialStatus === "overdue") {
    return "overdue" as const;
  }

  if (input.financialStatus === "pending") {
    return "pending" as const;
  }

  return "up_to_date" as const;
}

export function computeNextBillingDate(input: {
  now?: Date;
  previousNextBillingDate?: Date | string | null;
  durationDays: number;
}) {
  const now = input.now ?? new Date();
  const previous = toDate(input.previousNextBillingDate);
  const base =
    previous && previous.getTime() > now.getTime() ? previous : now;

  return addDays(base, Math.max(1, input.durationDays));
}

export function evaluateStudentAccessEligibility(
  input: StudentEligibilityInput,
): EligibilityDecision {
  const membershipStatus = (input.membershipStatus ?? "").toLowerCase();
  const paymentStatus = (input.paymentStatus ?? "").toLowerCase();
  const graceDays = Math.max(0, input.graceDays ?? 0);
  const now = input.now ?? new Date();
  const dueDate = toDate(input.dueDate);

  if (!membershipStatus) {
    return {
      authorizationStatus: "inactive",
      financialStatus: "not_applicable",
      reasonCode: "membership_not_found",
      graceUntil: null,
      isAllowed: false,
    };
  }

  if (membershipStatus === "pending") {
    return {
      authorizationStatus: "inactive",
      financialStatus: paymentStatus === "paid" ? "paid" : "pending",
      reasonCode: "membership_pending_activation",
      graceUntil: null,
      isAllowed: false,
    };
  }

  if (membershipStatus === "suspended") {
    return {
      authorizationStatus: "inactive",
      financialStatus:
        paymentStatus === "overdue"
          ? "overdue"
          : paymentStatus === "pending"
            ? "pending"
            : "not_applicable",
      reasonCode: "membership_suspended",
      graceUntil: null,
      isAllowed: false,
    };
  }

  if (membershipStatus === "canceled") {
    return {
      authorizationStatus: "inactive",
      financialStatus: "not_applicable",
      reasonCode: "membership_canceled",
      graceUntil: null,
      isAllowed: false,
    };
  }

  if (!paymentStatus || paymentStatus === "paid" || paymentStatus === "withdrawn") {
    return {
      authorizationStatus: "eligible",
      financialStatus: "paid",
      reasonCode: "membership_paid_up",
      graceUntil: null,
      isAllowed: true,
    };
  }

  if (paymentStatus === "overdue") {
    return {
      authorizationStatus: "blocked",
      financialStatus: "overdue",
      reasonCode: "payment_overdue",
      graceUntil: dueDate && graceDays > 0 ? addDays(dueDate, graceDays) : null,
      isAllowed: false,
    };
  }

  if (paymentStatus === "pending") {
    if (!dueDate || dueDate.getTime() >= now.getTime()) {
      return {
        authorizationStatus: "eligible",
        financialStatus: "pending",
        reasonCode: "payment_pending_not_due",
        graceUntil: dueDate && graceDays > 0 ? addDays(dueDate, graceDays) : null,
        isAllowed: true,
      };
    }

    if (graceDays > 0) {
      const graceUntil = addDays(dueDate, graceDays);
      if (now.getTime() <= graceUntil.getTime()) {
        return {
          authorizationStatus: "grace",
          financialStatus: "pending",
          reasonCode: "payment_in_grace",
          graceUntil,
          isAllowed: true,
        };
      }
    }

    return {
      authorizationStatus: "blocked",
      financialStatus: "overdue",
      reasonCode: "payment_overdue_no_grace",
      graceUntil: dueDate && graceDays > 0 ? addDays(dueDate, graceDays) : null,
      isAllowed: false,
    };
  }

  return {
    authorizationStatus: "unknown",
    financialStatus: "not_applicable",
    reasonCode: "not_evaluated",
    graceUntil: null,
    isAllowed: false,
  };
}

export function evaluatePersonalAccessEligibility(
  input: PersonalEligibilityInput,
): EligibilityDecision {
  if ((input.affiliationStatus ?? "").toLowerCase() === "active") {
    return {
      authorizationStatus: "eligible",
      financialStatus: "not_applicable",
      reasonCode: "personal_affiliation_active",
      graceUntil: null,
      isAllowed: true,
    };
  }

  return {
    authorizationStatus: "inactive",
    financialStatus: "not_applicable",
    reasonCode: "personal_affiliation_inactive",
    graceUntil: null,
    isAllowed: false,
  };
}

export function createUnknownEligibilityDecision(): EligibilityDecision {
  return {
    authorizationStatus: "unknown",
    financialStatus: "not_applicable",
    reasonCode: "not_evaluated",
    graceUntil: null,
    isAllowed: false,
  };
}

export function getAuthorizationSubjectKey(input: {
  gymId: string;
  subjectType: AccessSubjectType;
  subjectId: string;
}) {
  return `${input.gymId}:${input.subjectType}:${input.subjectId}`;
}
