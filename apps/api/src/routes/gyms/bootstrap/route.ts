import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  buildBootstrapCacheKey,
  createCachedBootstrapResponse,
  getCachedBootstrap,
  getOrCreateBootstrapPayload,
  revalidateBootstrapInBackground,
  setCachedBootstrap,
} from "@/lib/bootstrap/bootstrap-cache";
import {
  buildGymBootstrap,
  parseGymBootstrapSections,
} from "@/lib/bootstrap/gym-bootstrap";
import { NextResponse } from "@/runtime/next-server";

const GYM_BOOTSTRAP_SOFT_TTL_SECONDS = 20;
const GYM_BOOTSTRAP_HARD_TTL_SECONDS = 180;
const STALE_BOOTSTRAP_RESPONSE_TTL_MS = 1_000;

export const GET = createSafeHandler(
  async ({ query, gymContext }) => {
    const sections = parseGymBootstrapSections(
      query.sections as string | undefined,
    );
    const gymId = gymContext!.gymId;
    const cacheKey = buildBootstrapCacheKey({
      domain: "gym",
      actorId: gymId,
      sections,
    });
    const loadBootstrapPayload = async () => {
      const response = await buildGymBootstrap({
        gymId,
        sections,
      });

      return {
        data: response.data,
        sectionTimings: response.meta.sectionTimings,
      };
    };
    const cached = await getCachedBootstrap<
      Awaited<ReturnType<typeof buildGymBootstrap>>["data"]
    >(
      cacheKey,
      GYM_BOOTSTRAP_SOFT_TTL_SECONDS,
      GYM_BOOTSTRAP_HARD_TTL_SECONDS,
    );

    if (cached) {
      if (cached.freshness === "stale") {
        revalidateBootstrapInBackground(cacheKey, {
          softTtlSeconds: GYM_BOOTSTRAP_SOFT_TTL_SECONDS,
          hardTtlSeconds: GYM_BOOTSTRAP_HARD_TTL_SECONDS,
          loader: loadBootstrapPayload,
        });
      }

      return NextResponse.json(
        createCachedBootstrapResponse({
          data: cached.payload.data,
          sectionTimings: cached.payload.sectionTimings,
          strategy:
            cached.freshness === "fresh"
              ? "gym-bootstrap:cache"
              : "gym-bootstrap:stale",
          ttlMs:
            cached.freshness === "fresh"
              ? GYM_BOOTSTRAP_SOFT_TTL_SECONDS * 1000
              : STALE_BOOTSTRAP_RESPONSE_TTL_MS,
          hit: true,
        }),
      );
    }

    const payload = await getOrCreateBootstrapPayload(
      cacheKey,
      loadBootstrapPayload,
    );

    await setCachedBootstrap(
      cacheKey,
      payload,
      GYM_BOOTSTRAP_SOFT_TTL_SECONDS,
      GYM_BOOTSTRAP_HARD_TTL_SECONDS,
    );

    return NextResponse.json(
      createCachedBootstrapResponse({
        data: payload.data,
        sectionTimings: payload.sectionTimings,
        strategy: "gym-bootstrap:origin",
        ttlMs: GYM_BOOTSTRAP_SOFT_TTL_SECONDS * 1000,
        hit: false,
      }),
    );
  },
  { auth: "gym" },
);
