import {
  accessDeviceIdParamsSchema,
  updateAccessDeviceSchema,
} from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

export const PATCH = createSafeHandler(
  async ({ gymContext, params, body }) => {
    const { deviceId } = accessDeviceIdParamsSchema.parse(params);
    const device = await AccessService.updateDevice(
      gymContext!.gymId,
      deviceId,
      body,
    );
    return NextResponse.json({ device });
  },
  {
    auth: "gym",
    schema: {
      params: accessDeviceIdParamsSchema,
      body: updateAccessDeviceSchema,
    },
  },
);
