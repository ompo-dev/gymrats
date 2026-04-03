import { gymLocationsQuerySchema } from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { parseJsonArray, parseJsonSafe } from "@/lib/utils/json";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ query }) => {
    const { lat, lng } = query;
    const gyms = await db.gym.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        image: true,
        logo: true,
        address: true,
        phone: true,
        latitude: true,
        longitude: true,
        rating: true,
        totalReviews: true,
        amenities: true,
        openingHours: true,
        photos: true,
        isPartner: true,
        plans: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            duration: true,
          },
        },
      },
      orderBy: { rating: "desc" },
    });

    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const formattedGyms = gyms.map((gym) => {
      const amenities = parseJsonArray<string>(gym.amenities);
      const openingHours = parseJsonSafe<{
        open: string;
        close: string;
        days?: string[];
      }>(gym.openingHours);
      const photos = parseJsonArray<string>(gym.photos);

      let distance: number | undefined;
      if (lat && lng && gym.latitude && gym.longitude) {
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          gym.latitude,
          gym.longitude,
        );
      }

      const plansByType: { daily?: number; weekly?: number; monthly?: number } =
        {};
      const membershipPlans: Array<{
        id: string;
        name: string;
        type: string;
        price: number;
        duration: number;
      }> = [];

      gym.plans.forEach((plan) => {
        if (plan.type === "daily") plansByType.daily = plan.price;
        if (plan.type === "weekly") plansByType.weekly = plan.price;
        if (plan.type === "monthly") plansByType.monthly = plan.price;
        membershipPlans.push({
          id: plan.id,
          name: plan.name,
          type: plan.type,
          price: plan.price,
          duration: plan.duration,
        });
      });

      return {
        id: gym.id,
        name: gym.name,
        logo: gym.image || gym.logo || undefined,
        address: gym.address,
        phone: gym.phone || undefined,
        coordinates: {
          lat: gym.latitude || 0,
          lng: gym.longitude || 0,
        },
        distance,
        rating: gym.rating || 0,
        totalReviews: gym.totalReviews || 0,
        plans: plansByType,
        membershipPlans,
        amenities,
        openNow: true,
        openingHours: openingHours || undefined,
        photos: photos.length > 0 ? photos : undefined,
        isPartner: gym.isPartner ?? false,
      };
    });

    if (lat && lng) {
      formattedGyms.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return NextResponse.json({ gyms: formattedGyms });
  },
  {
    auth: "none",
    schema: { query: gymLocationsQuerySchema },
  },
);
