import {
  accessDevicesQuerySchema,
  createAccessDeviceSchema,
} from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const devices = await AccessService.listDevices(gymContext!.gymId);
    return NextResponse.json({ devices });
  },
  {
    auth: "gym",
    schema: { query: accessDevicesQuerySchema },
  },
);

export const POST = createSafeHandler(
  async ({ gymContext, body }) => {
    const created = await AccessService.createDevice(gymContext!.gymId, body);
    return NextResponse.json(created, { status: 201 });
  },
  {
    auth: "gym",
    schema: { body: createAccessDeviceSchema },
  },
);
