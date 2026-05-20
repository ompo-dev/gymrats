import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  dbTransactionMock,
  txQueryRawMock,
  txStudentFindUniqueMock,
  txReferralAggregateMock,
  txStudentWithdrawFindManyMock,
  txStudentWithdrawCreateMock,
  studentWithdrawUpdateMock,
  createWithdrawMock,
  logInfoMock,
  logWarnMock,
} = vi.hoisted(() => ({
  dbTransactionMock: vi.fn(),
  txQueryRawMock: vi.fn(),
  txStudentFindUniqueMock: vi.fn(),
  txReferralAggregateMock: vi.fn(),
  txStudentWithdrawFindManyMock: vi.fn(),
  txStudentWithdrawCreateMock: vi.fn(),
  studentWithdrawUpdateMock: vi.fn(),
  createWithdrawMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("../log", () => ({
  log: {
    info: (...args: unknown[]) => logInfoMock(...args),
    warn: (...args: unknown[]) => logWarnMock(...args),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@gymrats/db", () => ({
  db: {
    $transaction: (...args: unknown[]) => dbTransactionMock(...args),
    studentWithdraw: {
      update: (...args: unknown[]) => studentWithdrawUpdateMock(...args),
    },
  },
}));

vi.mock("@gymrats/api/abacatepay", () => ({
  abacatePay: {
    createWithdraw: (...args: unknown[]) => createWithdrawMock(...args),
  },
}));

import { ReferralService } from "./referral.service";

describe("ReferralService.createWithdraw", () => {
  beforeEach(() => {
    dbTransactionMock.mockReset();
    txQueryRawMock.mockReset();
    txStudentFindUniqueMock.mockReset();
    txReferralAggregateMock.mockReset();
    txStudentWithdrawFindManyMock.mockReset();
    txStudentWithdrawCreateMock.mockReset();
    studentWithdrawUpdateMock.mockReset();
    createWithdrawMock.mockReset();
    logInfoMock.mockReset();
    logWarnMock.mockReset();

    dbTransactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $queryRaw: (...args: unknown[]) => txQueryRawMock(...args),
        student: {
          findUnique: (...args: unknown[]) => txStudentFindUniqueMock(...args),
        },
        referral: {
          aggregate: (...args: unknown[]) => txReferralAggregateMock(...args),
        },
        studentWithdraw: {
          findMany: (...args: unknown[]) => txStudentWithdrawFindManyMock(...args),
          create: (...args: unknown[]) => txStudentWithdrawCreateMock(...args),
        },
      }),
    );
  });

  it("keeps transactional reservation and marks withdraw as failed on PSP error (PAY-04)", async () => {
    const createdAt = new Date("2026-05-18T10:00:00.000Z");

    txStudentFindUniqueMock.mockResolvedValue({
      pixKey: "student@gymrats.com",
      pixKeyType: "EMAIL",
    });
    txReferralAggregateMock.mockResolvedValue({
      _sum: { commissionAmountCents: 10_000 },
    });
    txStudentWithdrawFindManyMock.mockResolvedValue([]);
    txStudentWithdrawCreateMock.mockResolvedValue({
      id: "withdraw_1",
      amount: 3.5,
      pixKey: "student@gymrats.com",
      pixKeyType: "EMAIL",
      externalId: "student-withdraw-student_1-123",
      status: "pending",
      createdAt,
      completedAt: null,
    });
    createWithdrawMock.mockResolvedValue({
      error: "PSP indisponivel",
      data: null,
    });

    const result = await ReferralService.createWithdraw("student_1", {
      amountCents: 350,
      fake: false,
    });

    expect(txQueryRawMock).toHaveBeenCalled();
    expect(txStudentWithdrawCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: "student_1",
        status: "pending",
      }),
    });
    expect(createWithdrawMock).toHaveBeenCalledTimes(1);
    expect(studentWithdrawUpdateMock).toHaveBeenCalledWith({
      where: { id: "withdraw_1" },
      data: { status: "failed", completedAt: null },
    });
    expect(result).toEqual({
      ok: false,
      error: "PSP indisponivel",
    });
  });
});

