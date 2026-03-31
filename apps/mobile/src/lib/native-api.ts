import type {
  MobileInstallationPayload,
  MobileInstallationRecord,
} from "../store/types";
import { normalizeUrl } from "../utils/url";

type ApiErrorShape = {
  error?: string;
  message?: string;
};

type InstallationResponse = {
  installation: MobileInstallationRecord;
};

async function parseError(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as ApiErrorShape;
    return json.error || json.message || "Erro inesperado";
  } catch {
    return "Erro inesperado";
  }
}

async function requestJson<T>(
  apiUrl: string,
  path: string,
  init: RequestInit,
  token: string,
): Promise<T> {
  const normalizedApiUrl = normalizeUrl(apiUrl);
  if (!normalizedApiUrl) {
    throw new Error("A URL da API nao esta configurada.");
  }

  const response = await fetch(`${normalizedApiUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

export async function registerMobileInstallation(
  apiUrl: string,
  token: string,
  payload: MobileInstallationPayload,
) {
  const response = await requestJson<InstallationResponse>(
    apiUrl,
    "/api/mobile/installations/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );

  return response.installation;
}

export async function updateMobileInstallation(
  apiUrl: string,
  token: string,
  installationId: string,
  payload: Partial<
    Omit<MobileInstallationPayload, "installationId" | "platform">
  >,
) {
  const response = await requestJson<InstallationResponse>(
    apiUrl,
    `/api/mobile/installations/${encodeURIComponent(installationId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );

  return response.installation;
}

export async function deactivateMobileInstallation(
  apiUrl: string,
  token: string,
  installationId: string,
) {
  return requestJson<{ success: true; installation: MobileInstallationRecord }>(
    apiUrl,
    `/api/mobile/installations/${encodeURIComponent(installationId)}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export async function sendTestMobileNotification(
  apiUrl: string,
  token: string,
  installationId: string,
  payload?: {
    title?: string;
    body?: string;
    route?: string;
  },
) {
  return requestJson<{
    success: boolean;
    installationId: string;
    provider?: unknown;
  }>(
    apiUrl,
    "/api/mobile/notifications/test",
    {
      method: "POST",
      body: JSON.stringify({
        installationId,
        ...payload,
      }),
    },
    token,
  );
}

export async function signOutRemoteSession(apiUrl: string, token: string) {
  return requestJson<{ success: boolean }>(
    apiUrl,
    "/api/auth/sign-out",
    {
      method: "POST",
    },
    token,
  );
}
