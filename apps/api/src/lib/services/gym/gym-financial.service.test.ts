import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCachedJsonMock,
  setCachedJsonMock,
  dbTransactionMock,
  txQueryRawMock,
  txGymFindUniqueMock,
  txPaymentAggregateMock,
  txGymWithdrawFindManyMock,
  txGymWithdrawCreateMock,
  gymWithdrawUpdateMock,
  createWithdrawMock,
} = vi.hoisted(() => ({
  getCachedJsonMock: vi.fn(),
  setCachedJsonMock: vi.fn(),
  dbTransactionMock: vi.fn(),
  txQueryRawMock: vi.fn(),
  txGymFindUniqueMock: vi.fn(),
  txPaymentAggregateMock: vi.fn(),
  txGymWithdrawFindManyMock: vi.fn(),
  txGymWithdrawCreateMock: vi.fn(),
  gymWithdrawUpdateMock: vi.fn(),
  createWithdrawMock: vi.fn(),
}));

vi.mock("@/lib/cache/resource-cache", () => ({
  getCachedJson: (...args: unknown[]) => getCachedJsonMock(...args),
  setCachedJson: (...args: unknown[]) => setCachedJsonMock(...args),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: (...args: unknown[]) => dbTransactionMock(...args),
    gymWithdraw: {
      update: (...args: unknown[]) => gymWithdrawUpdateMock(...args),
    },
  },
}));

vi.mock("@gymrats/api/abacatepay", () => ({
  abacatePay: {
    createWithdraw: (...args: unknown[]) => createWithdrawMock(...args),
  },
}));

import { GymFinancialService } from "./gym-financial.service";

describe("GymFinancialService.createWithdraw", () => {
  beforeEach(() => {
    getCachedJsonMock.mockReset();
    setCachedJsonMock.mockReset();
    dbTransactionMock.mockReset();
    txQueryRawMock.mockReset();
    txGymFindUniqueMock.mockReset();
    txPaymentAggregateMock.mockReset();
    txGymWithdrawFindManyMock.mockReset();
    txGymWithdrawCreateMock.mockReset();
    gymWithdrawUpdateMock.mockReset();
    createWithdrawMock.mockReset();

    dbTransactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $queryRaw: (...args: unknown[]) => txQueryRawMock(...args),
        gym: {
          findUnique: (...args: unknown[]) => txGymFindUniqueMock(...args),
        },
        payment: {
          aggregate: (...args: unknown[]) => txPaymentAggregateMock(...args),
        },
        gymWithdraw: {
          findMany: (...args: unknown[]) => txGymWithdrawFindManyMock(...args),
          create: (...args: unknown[]) => txGymWithdrawCreateMock(...args),
        },
      }),
    );
  });

  it("keeps transactional reservation and marks withdraw as failed on PSP error (PAY-03)", async () => {
    const createdAt = new Date("2026-05-18T10:00:00.000Z");

    txGymFindUniqueMock.mockResolvedValue({
      pixKey: "academy@gymrats.com",
      pixKeyType: "EMAIL",
    });
    txPaymentAggregateMock.mockResolvedValue({
      _sum: { amount: 1000 },
      _count: { id: 1 },
    });
    txGymWithdrawFindManyMock.mockResolvedValue([]);
    txGymWithdrawCreateMock.mockResolvedValue({
      id: "withdraw_1",
      amount: 3.5,
      pixKey: "academy@gymrats.com",
      pixKeyType: "EMAIL",
      externalId: "gym-withdraw-gym_1-123",
      status: "pending",
      createdAt,
      completedAt: null,
    });
    createWithdrawMock.mockResolvedValue({
      error: "PSP indisponivel",
      data: null,
    });

    const result = await GymFinancialService.createWithdraw("gym_1", {
      amountCents: 350,
      fake: false,
    });

    expect(txQueryRawMock).toHaveBeenCalled();
    expect(txGymWithdrawCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        gymId: "gym_1",
        status: "pending",
      }),
    });
    expect(createWithdrawMock).toHaveBeenCalledTimes(1);
    expect(gymWithdrawUpdateMock).toHaveBeenCalledWith({
      where: { id: "withdraw_1" },
      data: { status: "failed", completedAt: null },
    });
    expect(result).toEqual({
      ok: false,
      error: "PSP indisponivel",
    });
  });
});

