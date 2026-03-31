import { db } from "@gymrats/db";
import type { Prisma } from "@prisma/client";

export type ProvisionableRole = "STUDENT" | "GYM" | "PERSONAL" | "ADMIN";

export type ProvisionUserAccessInput = {
  userId: string;
  role: ProvisionableRole;
  userName?: string | null;
  userEmail?: string | null;
};

export type ProvisionUserAccessResult = {
  studentId?: string;
  gymId?: string;
  personalId?: string;
};

type PrismaTransaction = Prisma.TransactionClient;

function normalizeName(value?: string | null) {
  const nextValue = value?.trim();
  return nextValue && nextValue.length > 0 ? nextValue : "GymRats";
}

function normalizeEmail(value?: string | null, userId?: string) {
  const nextValue = value?.trim();
  return nextValue && nextValue.length > 0
    ? nextValue
    : `${userId ?? "user"}@gymrats.local`;
}

async function provisionStudentAccess(
  tx: PrismaTransaction,
  userId: string,
): Promise<string> {
  const student = await tx.student.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });

  return student.id;
}

async function provisionGymAccess(
  tx: PrismaTransaction,
  input: ProvisionUserAccessInput,
): Promise<string> {
  const user = await tx.user.findUnique({
    where: { id: input.userId },
    select: { activeGymId: true },
  });

  let gym = await tx.gym.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!gym) {
    gym = await tx.gym.create({
      data: {
        userId: input.userId,
        name: normalizeName(input.userName),
        address: "",
        phone: "",
        email: normalizeEmail(input.userEmail, input.userId),
        plan: "basic",
        isActive: true,
      },
      select: { id: true },
    });
  }

  await tx.gymProfile.upsert({
    where: { gymId: gym.id },
    update: {},
    create: { gymId: gym.id },
  });

  await tx.gymStats.upsert({
    where: { gymId: gym.id },
    update: {},
    create: { gymId: gym.id },
  });

  if (!user?.activeGymId) {
    await tx.user.update({
      where: { id: input.userId },
      data: { activeGymId: gym.id },
    });
  }

  return gym.id;
}

async function provisionPersonalAccess(
  tx: PrismaTransaction,
  input: ProvisionUserAccessInput,
): Promise<string> {
  const personal = await tx.personal.upsert({
    where: { userId: input.userId },
    update: {
      name: normalizeName(input.userName),
      email: normalizeEmail(input.userEmail, input.userId),
    },
    create: {
      userId: input.userId,
      name: normalizeName(input.userName),
      email: normalizeEmail(input.userEmail, input.userId),
    },
    select: { id: true },
  });

  return personal.id;
}

async function provisionUserAccessWithTx(
  tx: PrismaTransaction,
  input: ProvisionUserAccessInput,
): Promise<ProvisionUserAccessResult> {
  const result: ProvisionUserAccessResult = {};

  if (input.role === "STUDENT" || input.role === "ADMIN") {
    result.studentId = await provisionStudentAccess(tx, input.userId);
  }

  if (input.role === "GYM" || input.role === "ADMIN") {
    result.gymId = await provisionGymAccess(tx, input);
  }

  if (input.role === "PERSONAL") {
    result.personalId = await provisionPersonalAccess(tx, input);
  }

  return result;
}

export async function provisionUserAccess(
  input: ProvisionUserAccessInput,
): Promise<ProvisionUserAccessResult> {
  return db.$transaction((tx) => provisionUserAccessWithTx(tx, input));
}

export async function updateUserRoleAndProvisionAccess(
  input: ProvisionUserAccessInput,
): Promise<ProvisionUserAccessResult> {
  return db.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: input.userId },
      data: { role: input.role },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return provisionUserAccessWithTx(tx, {
      ...input,
      userName: updatedUser.name || input.userName,
      userEmail: updatedUser.email || input.userEmail,
    });
  });
}
