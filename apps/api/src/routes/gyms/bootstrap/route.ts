import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  buildGymBootstrap,
  parseGymBootstrapSections,
} from "@/lib/bootstrap/gym-bootstrap";

export const GET = createSafeHandler(
  async ({ query, gymContext }) => {
    const sections = parseGymBootstrapSections(query.sections as string | undefined);
    const response = await buildGymBootstrap({
      gymId: gymContext!.gymId,
      sections,
    });

    return NextResponse.json(response);
  },
  { auth: "gym" },
);
