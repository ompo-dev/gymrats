import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  buildPersonalBootstrap,
  parsePersonalBootstrapSections,
} from "@/lib/bootstrap/personal-bootstrap";

export const GET = createSafeHandler(
  async ({ query, personalContext }) => {
    const sections = parsePersonalBootstrapSections(
      query.sections as string | undefined,
    );
    const response = await buildPersonalBootstrap({
      personalId: personalContext!.personalId,
      sections,
    });

    return NextResponse.json(response);
  },
  { auth: "personal" },
);
