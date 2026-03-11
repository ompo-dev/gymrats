/**
 * Use Cases: Gyms
 * listGyms, createGym, getGymProfile, setActiveGym, getGymLocations
 */

import { db } from "@/lib/db";
import {
  parseJsonArray,
  parseJsonSafe,
} from "@/lib/utils/json";

/* ─── List Gyms ─────────────────────────────────────────────────────────── */

export async function listGymsUseCase(userId: string) {
  const gyms = await db.gym.findMany({
    where: { userId },
    include: { subscription: true },
    orderBy: { createdAt: "asc" },
  });

  const hasPaidSubscription = gyms.some(
    (g) => g.subscription?.status === "active",
  );

  const gymsData = gyms.map((gym) => {
    const now = new Date();
    const hasActiveSubscription = gym.subscription
      ? gym.subscription.status === "active" ||
        (gym.subscription.status === "trialing" &&
          gym.subscription.trialEnd &&
          new Date(gym.subscription.trialEnd) > now)
      : false;

    return {
      id: gym.id,
      name: gym.name,
      logo: gym.logo,
      address: gym.address,
      email: gym.email,
      plan: gym.plan,
      isActive: gym.isActive,
      hasActiveSubscription,
    };
  });

  return {
    gyms: gymsData,
    canCreateMultipleGyms: hasPaidSubscription,
    totalGyms: gyms.length,
  };
}

/* ─── Create Gym ─────────────────────────────────────────────────────────── */

export interface CreateGymInput {
  userId: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
}

export async function createGymUseCase(input: CreateGymInput) {
  const { userId, name, address, phone, email, cnpj } = input;

  const existingGyms = await db.gym.findMany({
    where: { userId },
    include: { subscription: true },
  });

  if (existingGyms.length > 0) {
    const hasPaid = existingGyms.some(
      (g) => g.subscription?.status === "active",
    );
    if (!hasPaid) {
      throw new Error(
        "Para criar múltiplas academias, você precisa ter pelo menos uma academia com plano ativo (não trial)",
      );
    }
  }

  if (cnpj) {
    const existingCnpj = await db.gym.findUnique({ where: { cnpj } });
    if (existingCnpj) throw new Error("CNPJ já cadastrado");
  }

  const newGym = await db.gym.create({
    data: {
      userId,
      name,
      address: address ?? "",
      phone: phone ?? "",
      email: email ?? "",
      cnpj: cnpj ?? null,
      plan: "basic",
      isActive: true,
    },
  });

  await Promise.all([
    db.gymProfile.create({
      data: {
        gymId: newGym.id,
        totalStudents: 0,
        activeStudents: 0,
        equipmentCount: 0,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        currentStreak: 0,
        longestStreak: 0,
      },
    }),
    db.gymStats.create({ data: { gymId: newGym.id } }),
    db.user.update({ where: { id: userId }, data: { activeGymId: newGym.id } }),
    db.gymUserPreference.upsert({
      where: { userId },
      update: { lastActiveGymId: newGym.id, updatedAt: new Date() },
      create: { userId, lastActiveGymId: newGym.id },
    }),
  ]);

  return {
    gym: {
      id: newGym.id,
      name: newGym.name,
      address: newGym.address,
      email: newGym.email,
      plan: newGym.plan,
    },
  };
}

/* ─── Get Gym Profile ────────────────────────────────────────────────────── */

export async function getGymProfileUseCase(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { gyms: { include: { profile: true } } },
  });

  if (!user?.gyms?.length) return { hasProfile: false };

  const gym = user.gyms[0];
  const hasProfile =
    !!gym.profile &&
    gym.name !== null &&
    gym.address !== null &&
    gym.phone !== null &&
    gym.email !== null;

  return {
    hasProfile,
    profile: gym.profile
      ? {
          name: gym.name,
          address: gym.address,
          phone: gym.phone,
          email: gym.email,
          cnpj: gym.cnpj,
          equipmentCount: gym.profile.equipmentCount,
        }
      : null,
  };
}

/* ─── Set Active Gym ─────────────────────────────────────────────────────── */

export async function setActiveGymUseCase(userId: string, gymId: string) {
  const gym = await db.gym.findFirst({ where: { id: gymId, userId } });
  if (!gym) throw new Error("Academia não encontrada");

  await Promise.all([
    db.user.update({ where: { id: userId }, data: { activeGymId: gymId } }),
    db.gymUserPreference.upsert({
      where: { userId },
      update: { lastActiveGymId: gymId, updatedAt: new Date() },
      create: { userId, lastActiveGymId: gymId },
    }),
  ]);

  return { activeGymId: gymId };
}

/* ─── Get Gym Locations ──────────────────────────────────────────────────── */

export interface GetGymLocationsInput {
  lat?: string;
  lng?: string;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isOpenNow(
  openingHours: { open: string; close: string; days?: string[] } | null,
) {
  if (!openingHours) return true;
  const now = new Date();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDayName = dayNames[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  if (openingHours.days?.length && !openingHours.days.includes(currentDayName))
    return false;

  const [openHour, openMin] = openingHours.open.split(":").map(Number);
  const [closeHour, closeMin] = openingHours.close.split(":").map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  return currentTime >= openTime && currentTime <= closeTime;
}

export async function getGymLocationsUseCase(input: GetGymLocationsInput) {
  const { lat, lng } = input;

  const gyms = await db.gym.findMany({
    where: { isActive: true },
    include: {
      plans: { where: { isActive: true }, orderBy: { price: "asc" } },
      boostCampaigns: {
        where: { status: "active", endsAt: { gt: new Date() } },
        orderBy: { endsAt: "asc" },
      },
    },
    orderBy: { rating: "desc" },
  });

  const formattedGyms = gyms.map((gym) => {
    const amenities = parseJsonArray<string>(gym.amenities);
    const openingHours = parseJsonSafe<{
      open: string;
      close: string;
      days?: string[];
    }>(gym.openingHours);
    const photos = parseJsonArray<string>(gym.photos);

    const distance =
      lat && lng && gym.latitude && gym.longitude
        ? calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            gym.latitude,
            gym.longitude,
          )
        : undefined;

    const plansByType: { daily?: number; weekly?: number; monthly?: number } =
      {};
    gym.plans.forEach((p) => {
      if (p.type === "daily") plansByType.daily = p.price;
      if (p.type === "weekly") plansByType.weekly = p.price;
      if (p.type === "monthly") plansByType.monthly = p.price;
    });

    return {
      id: gym.id,
      name: gym.name,
      logo: gym.logo ?? undefined,
      address: gym.address,
      coordinates: { lat: gym.latitude ?? 0, lng: gym.longitude ?? 0 },
      distance,
      rating: gym.rating ?? 0,
      totalReviews: gym.totalReviews ?? 0,
      plans: plansByType,
      amenities,
      openNow: openingHours ? isOpenNow(openingHours) : true,
      openingHours: openingHours ?? undefined,
      photos: photos.length > 0 ? photos : undefined,
      isPartner: (gym as { isPartner?: boolean }).isPartner ?? false,
      activeCampaigns:
        gym.boostCampaigns?.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          primaryColor: c.primaryColor,
          linkedCouponId: c.linkedCouponId,
          linkedPlanId: c.linkedPlanId,
        })) || [],
    };
  });

  if (lat && lng) {
    formattedGyms.sort((a, b) => {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  }

  return { gyms: formattedGyms };
}
