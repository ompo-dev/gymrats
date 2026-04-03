import { describe, expect, it } from "vitest";
import {
  computeNextBillingDate,
  deriveOperationalPaymentStatus,
  evaluatePersonalAccessEligibility,
  evaluateStudentAccessEligibility,
  isAuthorizationAllowed,
} from "./access-authorization";

describe("access authorization domain", () => {
  it("allows active students with paid or not-yet-due billing", () => {
    const now = new Date("2026-04-01T12:00:00.000Z");

    expect(
      evaluateStudentAccessEligibility({
        membershipStatus: "active",
        paymentStatus: "paid",
        now,
      }),
    ).toMatchObject({
      authorizationStatus: "eligible",
      financialStatus: "paid",
      isAllowed: true,
    });

    expect(
      evaluateStudentAccessEligibility({
        membershipStatus: "active",
        paymentStatus: "pending",
        dueDate: "2026-04-05T12:00:00.000Z",
        graceDays: 3,
        now,
      }),
    ).toMatchObject({
      authorizationStatus: "eligible",
      financialStatus: "pending",
      reasonCode: "payment_pending_not_due",
      isAllowed: true,
    });
  });

  it("keeps pending students in grace and blocks after grace", () => {
    const inGrace = evaluateStudentAccessEligibility({
      membershipStatus: "active",
      paymentStatus: "pending",
      dueDate: "2026-03-30T12:00:00.000Z",
      graceDays: 3,
      now: new Date("2026-04-01T11:00:00.000Z"),
    });

    expect(inGrace.authorizationStatus).toBe("grace");
    expect(inGrace.financialStatus).toBe("pending");
    expect(inGrace.isAllowed).toBe(true);
    expect(inGrace.graceUntil?.toISOString()).toBe(
      "2026-04-02T12:00:00.000Z",
    );

    const blocked = evaluateStudentAccessEligibility({
      membershipStatus: "active",
      paymentStatus: "pending",
      dueDate: "2026-03-30T12:00:00.000Z",
      graceDays: 1,
      now: new Date("2026-04-02T12:01:00.000Z"),
    });

    expect(blocked.authorizationStatus).toBe("blocked");
    expect(blocked.financialStatus).toBe("overdue");
    expect(blocked.isAllowed).toBe(false);
  });

  it("evaluates personals separately and advances billing dates correctly", () => {
    expect(
      evaluatePersonalAccessEligibility({
        affiliationStatus: "active",
      }),
    ).toMatchObject({
      authorizationStatus: "eligible",
      financialStatus: "not_applicable",
      isAllowed: true,
    });

    expect(
      computeNextBillingDate({
        now: new Date("2026-04-10T10:00:00.000Z"),
        previousNextBillingDate: new Date("2026-04-15T10:00:00.000Z"),
        durationDays: 30,
      }).toISOString(),
    ).toBe("2026-05-15T10:00:00.000Z");

    expect(
      computeNextBillingDate({
        now: new Date("2026-04-20T10:00:00.000Z"),
        previousNextBillingDate: new Date("2026-04-15T10:00:00.000Z"),
        durationDays: 30,
      }).toISOString(),
    ).toBe("2026-05-20T10:00:00.000Z");
  });

  it("maps authorization to operational payment states", () => {
    expect(isAuthorizationAllowed("eligible")).toBe(true);
    expect(isAuthorizationAllowed("grace")).toBe(true);
    expect(isAuthorizationAllowed("blocked")).toBe(false);

    expect(
      deriveOperationalPaymentStatus({
        authorizationStatus: "eligible",
        financialStatus: "paid",
      }),
    ).toBe("up_to_date");
    expect(
      deriveOperationalPaymentStatus({
        authorizationStatus: "grace",
        financialStatus: "pending",
      }),
    ).toBe("grace");
    expect(
      deriveOperationalPaymentStatus({
        authorizationStatus: "blocked",
        financialStatus: "overdue",
      }),
    ).toBe("blocked");
  });
});
