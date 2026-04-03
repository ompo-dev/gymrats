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
  buildStudentBootstrap,
  parseStudentBootstrapSections,
} from "@/lib/bootstrap/student-bootstrap";
import { NextResponse } from "@/runtime/next-server";

const STUDENT_BOOTSTRAP_SOFT_TTL_SECONDS = 20;
const STUDENT_BOOTSTRAP_HARD_TTL_SECONDS = 180;
const STALE_BOOTSTRAP_RESPONSE_TTL_MS = 1_000;

export const GET = createSafeHandler(
  async ({ query, studentContext }) => {
    const sections = parseStudentBootstrapSections(
      query.sections as string | undefined,
    );
    const studentId = studentContext!.studentId;
    const userId = String(studentContext!.user.id);
    const cacheKey = buildBootstrapCacheKey({
      domain: "student",
      actorId: studentId,
      secondaryId: userId,
      sections,
    });
    const loadBootstrapPayload = async () => {
      const response = await buildStudentBootstrap({
        studentId,
        userId,
        sections,
      });

      return {
        data: response.data,
        sectionTimings: response.meta.sectionTimings,
      };
    };
    const cached = await getCachedBootstrap<
      Awaited<ReturnType<typeof buildStudentBootstrap>>["data"]
    >(
      cacheKey,
      STUDENT_BOOTSTRAP_SOFT_TTL_SECONDS,
      STUDENT_BOOTSTRAP_HARD_TTL_SECONDS,
    );

    if (cached) {
      if (cached.freshness === "stale") {
        revalidateBootstrapInBackground(cacheKey, {
          softTtlSeconds: STUDENT_BOOTSTRAP_SOFT_TTL_SECONDS,
          hardTtlSeconds: STUDENT_BOOTSTRAP_HARD_TTL_SECONDS,
          loader: loadBootstrapPayload,
        });
      }

      return NextResponse.json(
        createCachedBootstrapResponse({
          data: cached.payload.data,
          sectionTimings: cached.payload.sectionTimings,
          strategy:
            cached.freshness === "fresh"
              ? "student-bootstrap:cache"
              : "student-bootstrap:stale",
          ttlMs:
            cached.freshness === "fresh"
              ? STUDENT_BOOTSTRAP_SOFT_TTL_SECONDS * 1000
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
      STUDENT_BOOTSTRAP_SOFT_TTL_SECONDS,
      STUDENT_BOOTSTRAP_HARD_TTL_SECONDS,
    );

    return NextResponse.json(
      createCachedBootstrapResponse({
        data: payload.data,
        sectionTimings: payload.sectionTimings,
        strategy: "student-bootstrap:origin",
        ttlMs: STUDENT_BOOTSTRAP_SOFT_TTL_SECONDS * 1000,
        hit: false,
      }),
    );
  },
  { auth: "student" },
);
