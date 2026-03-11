import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { featureFlags } from "@/lib/feature-flags";

const querySchema = z.object({
  q: z.string().max(100).default(""),
  limit: z.coerce.number().min(1).max(20).default(10),
  linkedOnly: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export const GET = createSafeHandler(
  async ({ gymContext, query }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const gymId = gymContext?.gymId || "";
    const { q, limit, linkedOnly } = query as z.infer<typeof querySchema>;
    const term = (q || "").trim();

    const linkedIds = linkedOnly
      ? (
          await db.gymPersonalAffiliation.findMany({
            where: { gymId, status: "active" },
            select: { personalId: true },
          })
        ).map((a) => a.personalId)
      : null;

    const where: Prisma.PersonalWhereInput = {};

    if (linkedIds && linkedIds.length === 0) {
      return NextResponse.json({ personals: [] });
    }
    if (!term && !linkedIds) {
      return NextResponse.json({ personals: [] });
    }

    if (linkedIds) {
      where.id = { in: linkedIds };
    }
    if (term) {
      const insensitive = "insensitive" as const;
      const searchFilter = {
        OR: [
          { name: { contains: term, mode: insensitive } },
          { email: { contains: term, mode: insensitive } },
        ],
      };
      if (linkedIds) {
        where.AND = [searchFilter];
      } else {
        where.OR = searchFilter.OR;
      }
    }

    const personals = await db.personal.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    const alreadyLinkedSet = new Set(
      (
        await db.gymPersonalAffiliation.findMany({
          where: { gymId, status: "active" },
          select: { personalId: true },
        })
      ).map((a) => a.personalId),
    );

    return NextResponse.json({
      personals: personals.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        alreadyLinked: alreadyLinkedSet.has(p.id),
      })),
    });
  },
  { auth: "gym", schema: { query: querySchema } },
);
