import { createHash } from "node:crypto";
import { DomainError } from "@gymrats/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  accessDeviceFindUniqueMock,
  accessRawEventCreateMock,
  accessEventQueueAddMock,
  persistBusinessEventMock,
} = vi.hoisted(() => ({
  accessDeviceFindUniqueMock: vi.fn(),
  accessRawEventCreateMock: vi.fn(),
  accessEventQueueAddMock: vi.fn(),
  persistBusinessEventMock: vi.fn(),
}));

vi.mock("@gymrats/cache", () => ({
  accessEventQueue: {
    add: (...args: unknown[]) => accessEventQueueAddMock(...args),
  },
}));

vi.mock("@/lib/cache/resource-cache", () => ({
  deleteCacheKeysByPrefix: vi.fn(),
  getCachedJson: vi.fn(),
  setCachedJson: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    accessDevice: {
      findUnique: (...args: unknown[]) => accessDeviceFindUniqueMock(...args),
    },
    accessRawEvent: {
      create: (...args: unknown[]) => accessRawEventCreateMock(...args),
    },
  },
}));

vi.mock("@/lib/observability", () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  persistBusinessEvent: (...args: unknown[]) => persistBusinessEventMock(...args),
}));

import { AccessService } from "./access.service";

describe("AccessService integration secret hardening", () => {
  beforeEach(() => {
    accessDeviceFindUniqueMock.mockReset();
    accessRawEventCreateMock.mockReset();
    accessEventQueueAddMock.mockReset();
    persistBusinessEventMock.mockReset();
  });

  it("fails closed when integration has no secretHash configured", async () => {
    accessDeviceFindUniqueMock.mockResolvedValue({
      id: "device_1",
      gymId: "gym_1",
      status: "active",
      vendorKey: "vendor",
      secretHash: null,
    });

    await expect(
      AccessService.ingestDeviceEvent("ingestion_1", {}, {}, "127.0.0.1"),
    ).rejects.toMatchObject({
      code: "ACCESS_INTEGRATION_SECRET_NOT_CONFIGURED",
      status: 503,
    });

    expect(accessRawEventCreateMock).not.toHaveBeenCalled();
    expect(accessEventQueueAddMock).not.toHaveBeenCalled();
    expect(persistBusinessEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "access.integration.blocked",
        domain: "access",
        status: "failure",
      }),
    );
  });

  it("returns ACCESS_INTEGRATION_SECRET_INVALID when secret does not match", async () => {
    const validSecret = "secret-123";
    const secretHash = createHash("sha256").update(validSecret).digest("hex");

    accessDeviceFindUniqueMock.mockResolvedValue({
      id: "device_1",
      gymId: "gym_1",
      status: "active",
      vendorKey: "vendor",
      secretHash,
    });

    await expect(
      AccessService.ingestDeviceEvent(
        "ingestion_1",
        {},
        { "x-access-secret": "wrong-secret" },
        "127.0.0.1",
      ),
    ).rejects.toMatchObject({
      code: "ACCESS_INTEGRATION_SECRET_INVALID",
      status: 401,
    });

    expect(accessRawEventCreateMock).not.toHaveBeenCalled();
  });

  it("accepts request only when secret hash matches", async () => {
    const validSecret = "secret-123";
    const secretHash = createHash("sha256").update(validSecret).digest("hex");

    accessDeviceFindUniqueMock.mockResolvedValue({
      id: "device_1",
      gymId: "gym_1",
      status: "active",
      vendorKey: "vendor",
      secretHash,
    });
    accessRawEventCreateMock.mockResolvedValue({ id: "raw_1" });
    accessEventQueueAddMock.mockResolvedValue(undefined);

    const result = await AccessService.ingestDeviceEvent(
      "ingestion_1",
      { any: "payload" },
      { "x-access-secret": validSecret },
      "127.0.0.1",
    );

    expect(result).toEqual({
      rawEventId: "raw_1",
      deviceId: "device_1",
      accepted: true,
    });
    expect(accessRawEventCreateMock).toHaveBeenCalled();
    expect(accessEventQueueAddMock).toHaveBeenCalledWith(
      "process-access-event",
      { rawEventId: "raw_1" },
      { jobId: "raw_1" },
    );
  });
});