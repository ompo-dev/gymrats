import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  buildBootstrapCacheKey,
  createCachedBootstrapResponse,
  getCachedBootstrap,
  setCachedBootstrap,
} from "@/lib/bootstrap/bootstrap-cache";
import {
  buildStudentBootstrap,
  parseStudentBootstrapSections,
} from "@/lib/bootstrap/student-bootstrap";

export const GET = createSafeHandler(
  async ({ query, studentContext }) => {
    const sections = parseStudentBootstrapSections(query.sections as string | undefined);
    const cacheKey = buildBootstrapCacheKey({
      domain: "student",
      actorId: studentContext!.studentId,
      secondaryId: String(studentContext!.user.id),
      sections,
    });
    const cached = await getCachedBootstrap<Awaited<ReturnType<typeof buildStudentBootstrap>>["data"]>(
      cacheKey,
    );

    if (cached) {
      return NextResponse.json(
        createCachedBootstrapResponse({
          data: cached.data,
          sectionTimings: cached.sectionTimings,
          strategy: "student-bootstrap",
          ttlMs: 30_000,
          hit: true,
        }),
      );
    }

    const response = await buildStudentBootstrap({
      studentId: studentContext!.studentId,
      userId: String(studentContext!.user.id),
      sections,
    });

    await setCachedBootstrap(
      cacheKey,
      {
        data: response.data,
        sectionTimings: response.meta.sectionTimings,
      },
      30,
    );

    return NextResponse.json(response);
  },
  { auth: "student" },
);
