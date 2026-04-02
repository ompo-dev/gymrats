import { beforeEach, describe, expect, it, vi } from "vitest";

const getCachedJsonMock = vi.fn();
const setCachedJsonMock = vi.fn();
const deleteCacheKeysMock = vi.fn();
const findManySessionsMock = vi.fn();

vi.mock("@/lib/cache/resource-cache", () => ({
  getCachedJson: getCachedJsonMock,
  setCachedJson: setCachedJsonMock,
  deleteCacheKeys: deleteCacheKeysMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    session: {
      findMany: findManySessionsMock,
    },
  },
}));

vi.mock("@/lib/runtime/request-context", () => ({
  recordCacheOperation: vi.fn(),
}));

describe("session cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCachedJsonMock.mockResolvedValue(null);
    setCachedJsonMock.mockResolvedValue(undefined);
    deleteCacheKeysMock.mockResolvedValue(undefined);
    findManySessionsMock.mockResolvedValue([]);
  });

  it("extracts and dedupes auth session tokens from headers", async () => {
    const { extractAuthSessionCacheTokens } = await import("./session-cache");
    const headers = new Headers({
      authorization: "Bearer token-1",
      cookie:
        "auth_token=token-1; better-auth.session_token=token-2; __Secure-auth_token=token-1",
    });

    expect(extractAuthSessionCacheTokens(headers)).toEqual([
      "token-1",
      "token-2",
    ]);
  });

  it("reads a successful auth resolution from the local cache before Redis", async () => {
    const {
      cacheAuthSessionResolution,
      getCachedAuthSessionResolution,
      invalidateAuthSessionCache,
    } = await import("./session-cache");
    const resolution = {
      ok: true,
      data: {
        sessionToken: "token-1",
        user: {
          id: "user-1",
        },
      },
    };

    await cacheAuthSessionResolution(["token-1"], resolution);
    const cached = await getCachedAuthSessionResolution(["token-1"]);

    expect(cached).toEqual(resolution);
    expect(getCachedJsonMock).not.toHaveBeenCalled();

    await invalidateAuthSessionCache(["token-1"]);
  });

  it("does not cache failed auth resolutions", async () => {
    const { cacheAuthSessionResolution, getCachedAuthSessionResolution } =
      await import("./session-cache");

    await cacheAuthSessionResolution(["token-1"], {
      ok: false,
      error: {
        message: "Sessao invalida",
      },
    });

    const cached = await getCachedAuthSessionResolution(["token-1"]);

    expect(cached).toBeNull();
    expect(setCachedJsonMock).not.toHaveBeenCalled();
  });

  it("invalidates all cached session keys for a user", async () => {
    const { invalidateAuthSessionCacheForUser } = await import("./session-cache");
    findManySessionsMock.mockResolvedValue([
      { token: "token-1", sessionToken: "token-1" },
      { token: "token-2", sessionToken: "legacy-token-2" },
    ]);

    await invalidateAuthSessionCacheForUser("user-1");

    expect(findManySessionsMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { token: true, sessionToken: true },
    });
    expect(deleteCacheKeysMock).toHaveBeenCalledTimes(1);
    const deletedKeys = deleteCacheKeysMock.mock.calls[0]?.[0] as string[];
    expect(deletedKeys).toHaveLength(3);
    expect(deletedKeys.every((cacheKey) => cacheKey.startsWith("auth:session:v1:"))).toBe(
      true,
    );
  });
});
