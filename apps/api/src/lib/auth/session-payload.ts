const TOKEN_EXPOSING_CLIENT_HEADER = "x-gymrats-client";
const TOKEN_EXPOSING_CLIENTS = new Set(["mobile-native"]);

type SessionPayload = {
  id: string;
  token?: string | null;
};

export function shouldExposeSessionToken(request: Request) {
  const clientType = request.headers
    .get(TOKEN_EXPOSING_CLIENT_HEADER)
    ?.trim()
    .toLowerCase();

  return clientType ? TOKEN_EXPOSING_CLIENTS.has(clientType) : false;
}

export function createSessionPayload(
  request: Request,
  session:
    | {
        id: string;
        token?: string | null;
      }
    | null
    | undefined,
): SessionPayload | null {
  if (!session) {
    return null;
  }

  if (shouldExposeSessionToken(request)) {
    return {
      id: session.id,
      token: session.token ?? null,
    };
  }

  return {
    id: session.id,
  };
}
