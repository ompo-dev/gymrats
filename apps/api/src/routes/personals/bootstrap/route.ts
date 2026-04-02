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
  buildPersonalBootstrap,
  parsePersonalBootstrapSections,
} from "@/lib/bootstrap/personal-bootstrap";
import { NextResponse } from "@/runtime/next-server";

const PERSONAL_BOOTSTRAP_SOFT_TTL_SECONDS = 20;
const PERSONAL_BOOTSTRAP_HARD_TTL_SECONDS = 180;
const STALE_BOOTSTRAP_RESPONSE_TTL_MS = 1_000;

export const GET = createSafeHandler(
  async ({ query, personalContext }) => {
    const sections = parsePersonalBootstrapSections(
      query.sections as string | undefined,
    );
    const personalId = personalContext!.personalId;
    const cacheKey = buildBootstrapCacheKey({
      domain: "personal",
      actorId: personalId,
      sections,
    });
    const loadBootstrapPayload = async () => {
      const response = await buildPersonalBootstrap({
        personalId,
        sections,
      });

      return {
        data: response.data,
        sectionTimings: response.meta.sectionTimings,
      };
    };
    const cached = await getCachedBootstrap<
      Awaited<ReturnType<typeof buildPersonalBootstrap>>["data"]
    >(
      cacheKey,
      PERSONAL_BOOTSTRAP_SOFT_TTL_SECONDS,
      PERSONAL_BOOTSTRAP_HARD_TTL_SECONDS,
    );

    if (cached) {
      if (cached.freshness === "stale") {
        revalidateBootstrapInBackground(cacheKey, {
          softTtlSeconds: PERSONAL_BOOTSTRAP_SOFT_TTL_SECONDS,
          hardTtlSeconds: PERSONAL_BOOTSTRAP_HARD_TTL_SECONDS,
          loader: loadBootstrapPayload,
        });
      }

      return NextResponse.json(
        createCachedBootstrapResponse({
          data: cached.payload.data,
          sectionTimings: cached.payload.sectionTimings,
          strategy:
            cached.freshness === "fresh"
              ? "personal-bootstrap:cache"
              : "personal-bootstrap:stale",
          ttlMs:
            cached.freshness === "fresh"
              ? PERSONAL_BOOTSTRAP_SOFT_TTL_SECONDS * 1000
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
      PERSONAL_BOOTSTRAP_SOFT_TTL_SECONDS,
      PERSONAL_BOOTSTRAP_HARD_TTL_SECONDS,
    );

    return NextResponse.json(
      createCachedBootstrapResponse({
        data: payload.data,
        sectionTimings: payload.sectionTimings,
        strategy: "personal-bootstrap:origin",
        ttlMs: PERSONAL_BOOTSTRAP_SOFT_TTL_SECONDS * 1000,
        hit: false,
      }),
    );
  },
  { auth: "personal" },
);
