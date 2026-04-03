import { afterEach, describe, expect, it, vi } from "vitest";
import { getAuthSession } from "./middleware-auth";

const fetchMock = vi.fn<typeof fetch>();

describe("getAuthSession", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("returns null when the auth session endpoint rejects the request", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Nao autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await getAuthSession({
      url: "https://gym-rats-testes.vercel.app/student",
      headers: new Headers({ cookie: "auth_token=token-1" }),
    });

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://gym-rats-testes.vercel.app/api/auth/session");
    expect(init?.headers).toBeInstanceOf(Headers);
  });

  it("returns the normalized user when the auth session endpoint succeeds", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: "user-1",
            email: "user@example.com",
            name: "User",
            role: "STUDENT",
            hasGym: false,
            hasStudent: true,
          },
          session: {
            id: "session-1",
            token: "token-1",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const result = await getAuthSession({
      url: "https://gym-rats-testes.vercel.app/student",
      headers: new Headers({ cookie: "auth_token=token-1" }),
    });

    expect(result?.user.role).toBe("STUDENT");
    expect(result?.session?.token).toBe("token-1");
  });
});
