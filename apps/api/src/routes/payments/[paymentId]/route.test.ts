import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock, updateMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("@/lib/api/utils/api-wrapper", () => ({
  createSafeHandler:
    (handler: (ctx: unknown) => Promise<Response>) => async (ctx: unknown) =>
      handler(ctx),
}));

vi.mock("@/lib/db", () => ({
  db: {
    payment: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

import { PATCH } from "./route";

describe("PATCH /api/payments/[paymentId]", () => {
  const studentId = "student_123";
  const paymentId = "ckpaym0000000000000000001";

  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
  });

  it("returns 409 with contract code when student tries to cancel pending payment", async () => {
    findFirstMock.mockResolvedValue({
      id: paymentId,
      status: "pending",
    });

    const response = await PATCH({
      studentContext: { studentId },
      params: { paymentId },
      body: { status: "canceled" },
    } as never);

    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload).toMatchObject({
      code: "PAYMENT_CANCEL_NOT_ALLOWED",
      error: "Cancelamento de cobranca nao e permitido para aluno",
      details: {
        paymentId,
        currentStatus: "pending",
      },
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 404 when payment does not belong to student", async () => {
    findFirstMock.mockResolvedValue(null);

    const response = await PATCH({
      studentContext: { studentId },
      params: { paymentId },
      body: { status: "canceled" },
    } as never);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Pagamento nao encontrado",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
