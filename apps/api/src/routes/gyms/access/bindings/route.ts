import { accessCredentialBindingSchema } from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const bindings = await AccessService.listBindings(gymContext!.gymId);
    return NextResponse.json({ bindings });
  },
  { auth: "gym" },
);

export const POST = createSafeHandler(
  async ({ gymContext, body }) => {
    const binding = await AccessService.createBinding(gymContext!.gymId, body);
    return NextResponse.json({ success: true, binding }, { status: 201 });
  },
  {
    auth: "gym",
    schema: { body: accessCredentialBindingSchema },
  },
);
