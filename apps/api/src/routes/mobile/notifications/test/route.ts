import { z } from "zod";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { resolveAuthSessionFromRequest } from "@/lib/auth/session-resolver";
import { db } from "@/lib/db";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

const expoPushApiUrl = "https://exp.host/--/api/v2/push/send";

const testNotificationSchema = z.object({
  installationId: z.string().min(1).optional(),
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(280).optional(),
  route: z.string().min(1).max(200).optional(),
});

export async function POST(request: NextRequest) {
  const validation = await validateBody(request, testNotificationSchema);
  if (!validation.success) {
    return validation.response;
  }

  const auth = await resolveAuthSessionFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error.message },
      { status: auth.error.status },
    );
  }

  const isAdmin = auth.data.user.role === "ADMIN";
  const isDevelopment = process.env.NODE_ENV !== "production";
  if (!isAdmin && !isDevelopment) {
    return NextResponse.json(
      { error: "Somente admin pode enviar push de teste em producao." },
      { status: 403 },
    );
  }

  const body = validation.data;
  const installation = await db.mobileInstallation.findFirst({
    where: body.installationId
      ? {
          id: body.installationId,
          userId: auth.data.user.id,
          active: true,
        }
      : {
          userId: auth.data.user.id,
          active: true,
        },
    orderBy: {
      lastSeenAt: "desc",
    },
  });

  if (!installation?.expoPushToken) {
    return NextResponse.json(
      { error: "Nenhuma instalacao ativa com token de push foi encontrada." },
      { status: 404 },
    );
  }

  const route =
    body.route ||
    (auth.data.user.role === "PENDING"
      ? "/auth/register/user-type"
      : auth.data.user.role === "GYM"
        ? "/gym"
        : auth.data.user.role === "PERSONAL"
          ? "/personal"
          : "/student");

  const expoResponse = await fetch(expoPushApiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: installation.expoPushToken,
      title: body.title || "GymRats Mobile",
      body: body.body || "Push de teste enviado a partir da central nativa.",
      sound: "default",
      channelId: "gymrats-default",
      data: {
        route,
        source: "mobile-test",
        installationId: installation.id,
      },
    }),
  });

  const expoPayload = await expoResponse.json().catch(() => null);
  if (!expoResponse.ok) {
    return NextResponse.json(
      {
        error: "Falha ao enviar push de teste.",
        provider: expoPayload,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    provider: expoPayload,
    installationId: installation.id,
  });
}
