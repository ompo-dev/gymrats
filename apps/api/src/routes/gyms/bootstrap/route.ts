import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  buildBootstrapCacheKey,
  createCachedBootstrapResponse,
  getCachedBootstrap,
  setCachedBootstrap,
} from "@/lib/bootstrap/bootstrap-cache";
import {
  buildGymBootstrap,
  parseGymBootstrapSections,
} from "@/lib/bootstrap/gym-bootstrap";

export const GET = createSafeHandler(
  async ({ query, gymContext }) => {
    const sections = parseGymBootstrapSections(query.sections as string | undefined);
    const cacheKey = buildBootstrapCacheKey({
      domain: "gym",
      actorId: gymContext!.gymId,
      sections,
    });
    const cached = await getCachedBootstrap<Awaited<ReturnType<typeof buildGymBootstrap>>["data"]>(
      cacheKey,
    );

    if (cached) {
      return NextResponse.json(
        createCachedBootstrapResponse({
          data: cached.data,
          sectionTimings: cached.sectionTimings,
          strategy: "gym-bootstrap",
          ttlMs: 15_000,
          hit: true,
        }),
      );
    }

    const response = await buildGymBootstrap({
      gymId: gymContext!.gymId,
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
  { auth: "gym" },
);
