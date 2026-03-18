import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  buildBootstrapCacheKey,
  createCachedBootstrapResponse,
  getCachedBootstrap,
  setCachedBootstrap,
} from "@/lib/bootstrap/bootstrap-cache";
import {
  buildPersonalBootstrap,
  parsePersonalBootstrapSections,
} from "@/lib/bootstrap/personal-bootstrap";

export const GET = createSafeHandler(
  async ({ query, personalContext }) => {
    const sections = parsePersonalBootstrapSections(
      query.sections as string | undefined,
    );
    const cacheKey = buildBootstrapCacheKey({
      domain: "personal",
      actorId: personalContext!.personalId,
      sections,
    });
    const cached = await getCachedBootstrap<
      Awaited<ReturnType<typeof buildPersonalBootstrap>>["data"]
    >(cacheKey);

    if (cached) {
      return NextResponse.json(
        createCachedBootstrapResponse({
          data: cached.data,
          sectionTimings: cached.sectionTimings,
          strategy: "personal-bootstrap",
          ttlMs: 15_000,
          hit: true,
        }),
      );
    }

    const response = await buildPersonalBootstrap({
      personalId: personalContext!.personalId,
      sections,
    });

    await setCachedBootstrap(
      cacheKey,
      {
        data: response.data,
        sectionTimings: response.meta.sectionTimings,
      },
      15,
    );

    return NextResponse.json(response);
  },
  { auth: "personal" },
);
