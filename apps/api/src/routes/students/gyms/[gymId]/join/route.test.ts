import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  gymMembershipFindFirstMock,
  gymMembershipCreateMock,
  gymMembershipUpdateMock,
  membershipPlanFindUniqueMock,
  gymCouponFindFirstMock,
  gymCouponFindUniqueMock,
  gymCouponUpdateManyMock,
  gymCouponUpdateMock,
  createMembershipPaymentPixMock,
} = vi.hoisted(() => ({
  gymMembershipFindFirstMock: vi.fn(),
  gymMembershipCreateMock: vi.fn(),
  gymMembershipUpdateMock: vi.fn(),
  membershipPlanFindUniqueMock: vi.fn(),
  gymCouponFindFirstMock: vi.fn(),
  gymCouponFindUniqueMock: vi.fn(),
  gymCouponUpdateManyMock: vi.fn(),
  gymCouponUpdateMock: vi.fn(),
  createMembershipPaymentPixMock: vi.fn(),
}));

vi.mock("@/lib/api/utils/api-wrapper", () => ({
  createSafeHandler:
    (handler: (ctx: unknown) => Promise<Response>) => async (ctx: unknown) =>
      handler(ctx),
}));

vi.mock("@/lib/db", () => ({
  db: {
    gymMembership: {
      findFirst: (...args: unknown[]) => gymMembershipFindFirstMock(...args),
      create: (...args: unknown[]) => gymMembershipCreateMock(...args),
      update: (...args: unknown[]) => gymMembershipUpdateMock(...args),
    },
    membershipPlan: {
      findUnique: (...args: unknown[]) => membershipPlanFindUniqueMock(...args),
    },
    gymCoupon: {
      findFirst: (...args: unknown[]) => gymCouponFindFirstMock(...args),
      findUnique: (...args: unknown[]) => gymCouponFindUniqueMock(...args),
      updateMany: (...args: unknown[]) => gymCouponUpdateManyMock(...args),
      update: (...args: unknown[]) => gymCouponUpdateMock(...args),
    },
  },
}));

vi.mock("@/lib/services/gym/gym-membership-payment.service", () => ({
  createMembershipPaymentPix: (...args: unknown[]) =>
    createMembershipPaymentPixMock(...args),
}));

import { POST } from "./route";

describe("POST /api/students/gyms/[gymId]/join", () => {
  const gymId = "ckgymm0000000000000000001";
  const planId = "ckplan0000000000000000001";
  const couponId = "ckcpom0000000000000000001";
  const studentId = "ckstud0000000000000000001";
  const membershipId = "ckmems0000000000000000001";

  beforeEach(() => {
    gymMembershipFindFirstMock.mockReset();
    gymMembershipCreateMock.mockReset();
    gymMembershipUpdateMock.mockReset();
    membershipPlanFindUniqueMock.mockReset();
    gymCouponFindFirstMock.mockReset();
    gymCouponFindUniqueMock.mockReset();
    gymCouponUpdateManyMock.mockReset();
    gymCouponUpdateMock.mockReset();
    createMembershipPaymentPixMock.mockReset();
  });

  it("returns 409 when coupon atomic consume loses race (PAY-01)", async () => {
    gymMembershipFindFirstMock.mockResolvedValue(null);
    membershipPlanFindUniqueMock.mockResolvedValue({
      id: planId,
      gymId,
      isActive: true,
      name: "Mensal",
      price: 100,
      duration: 30,
    });
    gymCouponFindFirstMock.mockResolvedValue({
      id: couponId,
      gymId,
      isActive: true,
      discountType: "percentage",
      discountValue: 10,
      currentUses: 0,
      maxUses: 10,
      expiresAt: new Date("2999-01-01T00:00:00.000Z"),
    });
    gymCouponUpdateManyMock.mockResolvedValueOnce({ count: 0 });

    const response = await POST({
      studentContext: { studentId },
      params: { gymId },
      body: { planId, couponId },
    } as never);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Cupom indisponivel. Atualize e tente novamente.",
    });
    expect(gymMembershipCreateMock).not.toHaveBeenCalled();
    expect(createMembershipPaymentPixMock).not.toHaveBeenCalled();
  });

  it("rolls back membership and coupon when PIX generation fails (PAY-01)", async () => {
    gymMembershipFindFirstMock.mockResolvedValue(null);
    membershipPlanFindUniqueMock.mockResolvedValue({
      id: planId,
      gymId,
      isActive: true,
      name: "Mensal",
      price: 120,
      duration: 30,
    });
    gymCouponFindFirstMock.mockResolvedValue({
      id: couponId,
      gymId,
      isActive: true,
      discountType: "fixed",
      discountValue: 20,
      currentUses: 0,
      maxUses: 10,
      expiresAt: new Date("2999-01-01T00:00:00.000Z"),
    });
    gymCouponUpdateManyMock
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    gymCouponFindUniqueMock.mockResolvedValue({
      currentUses: 1,
      maxUses: 10,
    });
    gymMembershipCreateMock.mockResolvedValue({ id: membershipId });
    createMembershipPaymentPixMock.mockRejectedValue(
      new Error("PIX indisponivel"),
    );

    const response = await POST({
      studentContext: { studentId },
      params: { gymId },
      body: { planId, couponId },
    } as never);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "PIX indisponivel",
    });
    expect(gymMembershipUpdateMock).toHaveBeenCalledWith({
      where: { id: membershipId },
      data: { status: "canceled", autoRenew: false },
    });
    expect(gymCouponUpdateManyMock).toHaveBeenCalledTimes(2);
    expect(gymCouponUpdateManyMock).toHaveBeenNthCalledWith(2, {
      where: { id: couponId, currentUses: { gt: 0 } },
      data: { currentUses: { decrement: 1 }, isActive: true },
    });
  });
});

