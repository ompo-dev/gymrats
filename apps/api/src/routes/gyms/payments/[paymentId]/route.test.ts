import { beforeEach, describe, expect, it, vi } from "vitest";

const { updatePaymentStatusMock } = vi.hoisted(() => ({
  updatePaymentStatusMock: vi.fn(),
}));

vi.mock("@/lib/api/utils/api-wrapper", () => ({
  createSafeHandler:
    (handler: (ctx: unknown) => Promise<Response>) => async (ctx: unknown) => {
      try {
        return await handler(ctx);
      } catch (error) {
        const domainLike = error as {
          status?: number;
          code?: string;
          message?: string;
          details?: unknown;
        };

        if (
          typeof domainLike?.status === "number" &&
          typeof domainLike?.code === "string" &&
          typeof domainLike?.message === "string"
        ) {
          return new Response(
            JSON.stringify({
              error: domainLike.message,
              code: domainLike.code,
              details: domainLike.details ?? null,
            }),
            {
              status: domainLike.status,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        }

        throw error;
      }
    },
}));

vi.mock("@gymrats/domain/services/gym/gym-access-eligibility.service", () => ({
  GymAccessEligibilityService: {
    updatePaymentStatus: (...args: unknown[]) =>
      updatePaymentStatusMock(...args),
  },
}));

import { PATCH } from "./route";

describe("PATCH /api/gyms/payments/[paymentId]", () => {
  beforeEach(() => {
    updatePaymentStatusMock.mockReset();
  });

  it("blocks status=paid and instructs settle endpoint", async () => {
    const response = await PATCH({
      gymContext: { gymId: "gym_123" },
      params: { paymentId: "payment_123" },
      body: { status: "paid" },
    } as never);

    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload).toMatchObject({
      code: "PAYMENT_STATUS_REQUIRES_SETTLEMENT",
      error:
        "Liquidação deve ser feita via /api/gyms/payments/[paymentId]/settle",
    });
    expect(updatePaymentStatusMock).not.toHaveBeenCalled();
  });

  it("updates status for non-paid transitions", async () => {
    updatePaymentStatusMock.mockResolvedValue({
      id: "payment_123",
      status: "overdue",
    });

    const response = await PATCH({
      gymContext: { gymId: "gym_123" },
      params: { paymentId: "payment_123" },
      body: { status: "overdue" },
    } as never);

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      payment: {
        id: "payment_123",
        status: "overdue",
      },
    });
    expect(updatePaymentStatusMock).toHaveBeenCalledWith(
      "gym_123",
      "payment_123",
      "overdue",
    );
  });
});
