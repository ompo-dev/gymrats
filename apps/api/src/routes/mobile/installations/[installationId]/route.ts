import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { resolveAuthSessionFromRequest } from "@/lib/auth/session-resolver";
import { db } from "@/lib/db";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  installationId: z.string().cuid("installationId deve ser um CUID valido"),
});

const updateInstallationSchema = z.object({
  expoPushToken: z.string().min(1).max(512).nullable().optional(),
  pushPermission: z
    .enum(["undetermined", "denied", "granted", "provisional", "unsupported"])
    .optional(),
  capabilities: z.record(z.unknown()).optional(),
  appVersion: z.string().max(120).nullable().optional(),
  deviceName: z.string().max(120).nullable().optional(),
  locale: z.string().max(40).nullable().optional(),
  timezone: z.string().max(80).nullable().optional(),
  active: z.boolean().optional(),
});

function toResponse(
  installation: Awaited<ReturnType<typeof db.mobileInstallation.update>>,
) {
  return {
    id: installation.id,
    platform: installation.platform,
    expoPushToken: installation.expoPushToken,
    pushPermission: installation.pushPermission,
    capabilities: installation.capabilities,
    appVersion: installation.appVersion,
    deviceName: installation.deviceName,
    locale: installation.locale,
    timezone: installation.timezone,
    active: installation.active,
    lastSeenAt: installation.lastSeenAt,
    createdAt: installation.createdAt,
    updatedAt: installation.updatedAt,
  };
}

async function requireOwnedInstallation(
  request: NextRequest,
  installationId: string,
) {
  const auth = await resolveAuthSessionFromRequest(request);
  if (!auth.ok) {
    return {
      errorResponse: NextResponse.json(
        { error: "Nao autenticado" },
        { status: auth.error.status },
      ),
    };
  }

  const installation = await db.mobileInstallation.findUnique({
    where: {
      id: installationId,
    },
  });

  if (!installation) {
    return {
      errorResponse: NextResponse.json(
        { error: "Instalacao nao encontrada" },
        { status: 404 },
      ),
    };
  }

  const isOwner = installation.userId === auth.data.user.id;
  const isAdmin = auth.data.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return {
      errorResponse: NextResponse.json(
        { error: "Instalacao nao encontrada" },
        { status: 404 },
      ),
    };
  }

  return {
    auth: auth.data,
    installation,
  };
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ installationId: string }> | { installationId: string };
  },
) {
  const validation = await validateBody(request, updateInstallationSchema);
  if (!validation.success) {
    return validation.response;
  }

  const rawParams = await Promise.resolve(context.params);
  const { installationId } = paramsSchema.parse(rawParams);
  const ownership = await requireOwnedInstallation(request, installationId);
  if ("errorResponse" in ownership) {
    return ownership.errorResponse;
  }

  const body = validation.data;
  const installation = await db.mobileInstallation.update({
    where: {
      id: ownership.installation.id,
    },
    data: {
      userId: ownership.auth.user.id,
      expoPushToken:
        body.expoPushToken === undefined ? undefined : body.expoPushToken,
      pushPermission:
        body.pushPermission === undefined ? undefined : body.pushPermission,
      capabilities:
        body.capabilities === undefined
          ? undefined
          : (body.capabilities as Prisma.InputJsonValue),
      appVersion: body.appVersion === undefined ? undefined : body.appVersion,
      deviceName: body.deviceName === undefined ? undefined : body.deviceName,
      locale: body.locale === undefined ? undefined : body.locale,
      timezone: body.timezone === undefined ? undefined : body.timezone,
      active: body.active === undefined ? undefined : body.active,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({
    installation: toResponse(installation),
  });
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ installationId: string }> | { installationId: string };
  },
) {
  const rawParams = await Promise.resolve(context.params);
  const { installationId } = paramsSchema.parse(rawParams);
  const ownership = await requireOwnedInstallation(request, installationId);
  if ("errorResponse" in ownership) {
    return ownership.errorResponse;
  }

  const installation = await db.mobileInstallation.update({
    where: {
      id: ownership.installation.id,
    },
    data: {
      active: false,
      expoPushToken: null,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    installation: toResponse(installation),
  });
}
