import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    // Buscar academias parceiras (isPartner = true) ou ativas
    // Não precisa estar autenticado para ver academias
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const isPartner = searchParams.get("isPartner") === "true";

    // Construir filtros
    const where: any = {
      isActive: true,
    };

    // isPartner pode não existir ainda se migration não foi aplicada
    // Por enquanto, comentar até migration ser aplicada
    // if (isPartner) {
    //   where.isPartner = true;
    // }

    // Buscar academias
    const gyms = await db.gym.findMany({
      where: where,
      include: {
        plans: {
          where: {
            isActive: true,
          },
          orderBy: {
            price: "asc",
          },
        },
      },
      orderBy: {
        rating: "desc",
      },
    });

    // Transformar para formato esperado
    const formattedGyms = gyms.map((gym) => {
      // Parse amenities
      let amenities: string[] = [];
      if (gym.amenities) {
        try {
          amenities = JSON.parse(gym.amenities);
        } catch (e) {
          // Ignorar erro de parse
        }
      }

      // Parse openingHours
      let openingHours: { open: string; close: string; days?: string[] } | null =
        null;
      if (gym.openingHours) {
        try {
          openingHours = JSON.parse(gym.openingHours);
        } catch (e) {
          // Ignorar erro de parse
        }
      }

      // Parse photos
      let photos: string[] = [];
      if (gym.photos) {
        try {
          photos = JSON.parse(gym.photos);
        } catch (e) {
          // Ignorar erro de parse
        }
      }

      // Calcular distância se lat/lng fornecidos
      let distance: number | undefined = undefined;
      if (lat && lng && gym.latitude && gym.longitude) {
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          gym.latitude,
          gym.longitude
        );
      }

      // Calcular se está aberto agora (sempre true se não tiver horário definido)
      const openNow = openingHours ? calculateOpenNow(openingHours) : true;

      // Organizar plans por tipo
      const plansByType: {
        daily?: number;
        weekly?: number;
        monthly?: number;
      } = {};

      gym.plans.forEach((plan) => {
        if (plan.type === "daily") {
          plansByType.daily = plan.price;
        } else if (plan.type === "weekly") {
          plansByType.weekly = plan.price;
        } else if (plan.type === "monthly") {
          plansByType.monthly = plan.price;
        }
      });

      return {
        id: gym.id,
        name: gym.name,
        logo: gym.logo || undefined,
        address: gym.address,
        coordinates: {
          lat: gym.latitude || 0,
          lng: gym.longitude || 0,
        },
        distance: distance,
        rating: gym.rating || 0,
        totalReviews: gym.totalReviews || 0,
        plans: plansByType,
        amenities: amenities,
        openNow: openNow,
        openingHours: openingHours || undefined,
        photos: photos.length > 0 ? photos : undefined,
        isPartner: (gym as any).isPartner || false, // Type assertion temporário até migration ser aplicada
      };
    });

    // Ordenar por distância se fornecida
    if (lat && lng) {
      formattedGyms.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return NextResponse.json({ gyms: formattedGyms });
  } catch (error: any) {
    console.error("Erro ao buscar academias:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar academias" },
      { status: 500 }
    );
  }
}

// Função para calcular distância entre duas coordenadas (Haversine)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
}

// Função para calcular se está aberto agora
function calculateOpenNow(
  openingHours: { open: string; close: string; days?: string[] } | null
): boolean {
  if (!openingHours) return true; // Se não tem horário, assume que está aberto

  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDayName = dayNames[now.getDay()]; // "monday", "tuesday", etc
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutos desde meia-noite

  // Verificar se está no dia de funcionamento
  if (openingHours.days && openingHours.days.length > 0) {
    if (!openingHours.days.includes(currentDayName)) {
      return false;
    }
  }

  // Converter horários para minutos
  const [openHour, openMin] = openingHours.open.split(":").map(Number);
  const [closeHour, closeMin] = openingHours.close.split(":").map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
}

