import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { recordDbQuery } from "@gymrats/domain";

const globalForPrisma = globalThis as { prisma?: PrismaClient };

let prismaClient: PrismaClient | null = null;

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured in the environment variables",
    );
  }

  const client = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "error" },
      ...(process.env.NODE_ENV === "development"
        ? ([{ emit: "stdout", level: "warn" }] as const)
        : []),
    ],
  });

  client.$on("query", (event: Prisma.QueryEvent) => {
    recordDbQuery({
      durationMs: event.duration,
      query: event.query,
      target: event.target,
    });
  });

  return client;
}

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  prismaClient ??= createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
  }

  return prismaClient;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
  set(_target, prop, value) {
    const client = getPrismaClient();

    return Reflect.set(client, prop, value, client);
  },
}) as PrismaClient;
