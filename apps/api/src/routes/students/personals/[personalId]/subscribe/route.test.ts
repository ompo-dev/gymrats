import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  studentPersonalAssignmentFindFirstMock,
  personalFindUniqueMock,
  personalMembershipPlanFindFirstMock,
  studentFindUniqueMock,
  personalCouponFindFirstMock,
  personalCouponFindUniqueMock,
  personalCouponUpdateManyMock,
  personalCouponUpdateMock,
  personalStudentPaymentCreateMock,
  personalStudentPaymentUpdateMock,
  createPixQrCodeMock,
} = vi.hoisted(() => ({
  studentPersonalAssignmentFindFirstMock: vi.fn(),
  personalFindUniqueMock: vi.fn(),
  personalMembershipPlanFindFirstMock: vi.fn(),
  studentFindUniqueMock: vi.fn(),
  personalCouponFindFirstMock: vi.fn(),
  personalCouponFindUniqueMock: vi.fn(),
  personalCouponUpdateManyMock: vi.fn(),
  personalCouponUpdateMock: vi.fn(),
  personalStudentPaymentCreateMock: vi.fn(),
  personalStudentPaymentUpdateMock: vi.fn(),
  createPixQrCodeMock: vi.fn(),
}));

vi.mock("@/lib/api/utils/api-wrapper", () => ({
  createSafeHandler:
    (handler: (ctx: unknown) => Promise<Response>) => async (ctx: unknown) =>
      handler(ctx),
}));

vi.mock("@/lib/db", () => ({
  db: {
    studentPersonalAssignment: {
      findFirst: (...args: unknown[]) =>
        studentPersonalAssignmentFindFirstMock(...args),
    },
    personal: {
      findUnique: (...args: unknown[]) => personalFindUniqueMock(...args),
    },
    personalMembershipPlan: {
      findFirst: (...args: unknown[]) =>
        personalMembershipPlanFindFirstMock(...args),
    },
    student: {
      findUnique: (...args: unknown[]) => studentFindUniqueMock(...args),
    },
    personalCoupon: {
      findFirst: (...args: unknown[]) => personalCouponFindFirstMock(...args),
      findUnique: (...args: unknown[]) => personalCouponFindUniqueMock(...args),
      updateMany: (...args: unknown[]) => personalCouponUpdateManyMock(...args),
      update: (...args: unknown[]) => personalCouponUpdateMock(...args),
    },
    personalStudentPayment: {
      create: (...args: unknown[]) => personalStudentPaymentCreateMock(...args),
      update: (...args: unknown[]) => personalStudentPaymentUpdateMock(...args),
    },
  },
}));

vi.mock("@gymrats/api/abacatepay", () => ({
  abacatePay: {
    createPixQrCode: (...args: unknown[]) => createPixQrCodeMock(...args),
  },
}));

import { POST } from "./route";

describe("POST /api/students/personals/[personalId]/subscribe", () => {
  const personalId = "ckpers0000000000000000001";
  const planId = "ckplnp0000000000000000001";
  const couponId = "ckcpnp0000000000000000001";
  const studentId = "ckstup0000000000000000001";
  const paymentId = "ckpayp0000000000000000001";

  beforeEach(() => {
    studentPersonalAssignmentFindFirstMock.mockReset();
    personalFindUniqueMock.mockReset();
    personalMembershipPlanFindFirstMock.mockReset();
    studentFindUniqueMock.mockReset();
    personalCouponFindFirstMock.mockReset();
    personalCouponFindUniqueMock.mockReset();
    personalCouponUpdateManyMock.mockReset();
    personalCouponUpdateMock.mockReset();
    personalStudentPaymentCreateMock.mockReset();
    personalStudentPaymentUpdateMock.mockReset();
    createPixQrCodeMock.mockReset();
  });

  function arrangeBaseEntities() {
    studentPersonalAssignmentFindFirstMock.mockResolvedValue(null);
    personalFindUniqueMock.mockResolvedValue({
      id: personalId,
      name: "Personal A",
      isActive: true,
      user: { email: "personal@gymrats.com" },
    });
    personalMembershipPlanFindFirstMock.mockResolvedValue({
      id: planId,
      personalId,
      isActive: true,
      name: "Plano Mensal",
      price: 100,
    });
    studentFindUniqueMock.mockResolvedValue({
      id: studentId,
      user: { name: "Aluno", email: "aluno@gymrats.com" },
    });
  }

  it("returns 409 when coupon atomic consume loses race (PAY-02)", async () => {
    arrangeBaseEntities();
    personalCouponFindFirstMock.mockResolvedValue({
      id: couponId,
      personalId,
      isActive: true,
      discountType: "percentage",
      discountValue: 10,
      currentUses: 0,
      maxUses: 10,
      expiresAt: new Date("2999-01-01T00:00:00.000Z"),
    });
    personalCouponUpdateManyMock.mockResolvedValueOnce({ count: 0 });

    const response = await POST({
      studentContext: { studentId },
      params: { personalId },
      body: { planId, couponId },
    } as never);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Cupom indisponivel. Atualize e tente novamente.",
    });
    expect(personalStudentPaymentCreateMock).not.toHaveBeenCalled();
    expect(createPixQrCodeMock).not.toHaveBeenCalled();
  });

  it("rolls back payment and coupon when PIX generation fails (PAY-02)", async () => {
    arrangeBaseEntities();
    personalCouponFindFirstMock.mockResolvedValue({
      id: couponId,
      personalId,
      isActive: true,
      discountType: "fixed",
      discountValue: 20,
      currentUses: 0,
      maxUses: 10,
      expiresAt: new Date("2999-01-01T00:00:00.000Z"),
    });
    personalCouponUpdateManyMock
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    personalCouponFindUniqueMock.mockResolvedValue({
      currentUses: 1,
      maxUses: 10,
    });
    personalStudentPaymentCreateMock.mockResolvedValue({
      id: paymentId,
      personalId,
      studentId,
      planId,
      amount: 80,
      status: "pending",
    });
    createPixQrCodeMock.mockResolvedValue({
      error: "PSP indisponivel",
      data: null,
    });

    const response = await POST({
      studentContext: { studentId },
      params: { personalId },
      body: { planId, couponId },
    } as never);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "PSP indisponivel",
    });
    expect(personalStudentPaymentUpdateMock).toHaveBeenCalledWith({
      where: { id: paymentId },
      data: { status: "canceled" },
    });
    expect(personalCouponUpdateManyMock).toHaveBeenCalledTimes(2);
    expect(personalCouponUpdateManyMock).toHaveBeenNthCalledWith(2, {
      where: { id: couponId, currentUses: { gt: 0 } },
      data: { currentUses: { decrement: 1 }, isActive: true },
    });
  });
});

