import { z } from "zod";
import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { resolveAuthSessionFromRequest } from "@/lib/auth/session-resolver";
import { db } from "@/lib/db";

const registerInstallationSchema = z.object({
  installationId: z.string().min(1, "installationId eh obrigatorio"),
  platform: z.string().min(1, "platform eh obrigatorio"),
  expoPushToken: z.string().min(1).max(512).nullable().optional(),
  pushPermission: z
    .enum(["undetermined", "denied", "granted", "provisional", "unsupported"])
    .default("undetermined"),
  capabilities: z.record(z.unknown()).optional(),
  appVersion: z.string().max(120).nullable().optional(),
  deviceName: z.string().max(120).nullable().optional(),
  locale: z.string().max(40).nullable().optional(),
  timezone: z.string().max(80).nullable().optional(),
  active: z.boolean().default(true),
});

function toResponse(
  installation: Awaited<ReturnType<typeof db.mobileInstallation.upsert>>,
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

export async function POST(request: NextRequest) {
  const validation = await validateBody(request, registerInstallationSchema);
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

  const body = validation.data;
  const installation = await db.mobileInstallation.upsert({
    where: {
      id: body.installationId,
    },
    update: {
      userId: auth.data.user.id,
      platform: body.platform,
      expoPushToken:
        body.expoPushToken === undefined ? undefined : body.expoPushToken,
      pushPermission: body.pushPermission,
      capabilities:
        body.capabilities === undefined ? undefined : body.capabilities,
      appVersion: body.appVersion === undefined ? undefined : body.appVersion,
      deviceName: body.deviceName === undefined ? undefined : body.deviceName,
      locale: body.locale === undefined ? undefined : body.locale,
      timezone: body.timezone === undefined ? undefined : body.timezone,
      active: body.active,
      lastSeenAt: new Date(),
    },
    create: {
      id: body.installationId,
      userId: auth.data.user.id,
      platform: body.platform,
      expoPushToken: body.expoPushToken ?? null,
      pushPermission: body.pushPermission,
      capabilities: body.capabilities,
      appVersion: body.appVersion ?? null,
      deviceName: body.deviceName ?? null,
      locale: body.locale ?? null,
      timezone: body.timezone ?? null,
      active: body.active,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({
    installation: toResponse(installation),
  });
}
