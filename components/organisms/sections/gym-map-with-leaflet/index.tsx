"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoSelect } from "@/components/duo";
import { useUserGeolocation } from "@/hooks/use-user-geolocation";
import { useGymMapStore, type GymMapFilter } from "@/hooks/use-gym-map-state";
import { useStudent } from "@/hooks/use-student";
import type { DayPass, GymLocation, StudentGymMembership } from "@/lib/types";

const MapContainerComponent = dynamic(
  () =>
    import("./map-container").then((m) => m.MapContainerComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full rounded-2xl bg-duo-bg border-2 border-duo-border flex items-center justify-center">
        <MapPin className="h-12 w-12 text-duo-gray-dark" />
      </div>
    ),
  },
);

interface GymMapWithLeafletProps {
  gyms: GymLocation[];
  dayPasses: DayPass[];
  memberships?: StudentGymMembership[];
  onPurchaseDayPass: (gymId: string) => void;
  onJoinPlan?: (gymId: string, planId: string, couponId?: string) => void;
  onChangePlan?: (membershipId: string, planId: string) => void;
  onViewGymProfile?: (
    gymId: string,
    planId?: string,
    couponId?: string,
  ) => void;
}

export function GymMapWithLeaflet({
  gyms,
  dayPasses,
  memberships = [],
  onPurchaseDayPass,
  onJoinPlan,
  onChangePlan,
  onViewGymProfile,
}: GymMapWithLeafletProps) {
  const { position, requestPermission } = useUserGeolocation();
  const { loadGymLocationsWithPosition } = useStudent("loaders");
  const {
    selectedGymId,
    mapCenter,
    mapZoom,
    filter,
    setSelectedGym,
    setMapCenter,
    setFilter,
  } = useGymMapStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (position) {
      loadGymLocationsWithPosition(position.lat, position.lng);
      setMapCenter({ lat: position.lat, lng: position.lng });
    }
  }, [position, loadGymLocationsWithPosition, setMapCenter]);

  const filteredGyms = gyms.filter((gym) => {
    if (filter === "open") return gym.openNow;
    if (filter === "near") return (gym.distance ?? 0) < 3;
    if (filter === "subscribed")
      return memberships.some(
        (m) => m.gymId === gym.id && m.status !== "canceled",
      );
    return true;
  });

  const sortedGyms = [...filteredGyms].sort(
    (a, b) => (a.distance || 0) - (b.distance || 0),
  );

  const filterOptions = [
    { value: "all", label: "Todas" },
    { value: "subscribed", label: "Onde estou inscrito" },
    { value: "near", label: "Próximas" },
    { value: "open", label: "Abertas" },
  ];

  const centerTuple: [number, number] = [
    mapCenter.lat,
    mapCenter.lng,
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Academias Parceiras
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Encontre academias próximas e compre diárias
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <MapPin
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Filtros</h2>
            </div>
          </DuoCard.Header>
          <DuoSelect.Simple
            options={filterOptions}
            value={filter}
            onChange={(value) =>
              setFilter(value as GymMapFilter)
            }
            placeholder="Filtro"
          />
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoCard.Root
          variant="default"
          size="default"
          className="relative overflow-hidden"
        >
          <div className="relative h-[280px] w-full">
            {mounted && (
              <MapContainerComponent
                center={centerTuple}
                zoom={mapZoom}
                userPosition={position}
                gyms={gyms}
                selectedGymId={selectedGymId}
                onGymClick={(gym) => {
                  setSelectedGym(gym.id);
                }}
              />
            )}
            <div className="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold shadow-lg flex items-center gap-1 z-[1000]">
              <Navigation className="h-3 w-3" />
              {sortedGyms.length} academias próximas
            </div>
          </div>
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.3}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <MapPin
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Academias Cadastradas</h2>
            </div>
          </DuoCard.Header>
          <p className="text-sm text-duo-gray-dark mb-3">
            Toque em um marcador no mapa ou na lista abaixo. Use os filtros para
            ver apenas próximas, abertas ou onde você está inscrito.
          </p>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {sortedGyms.map((gym) => (
              <DuoCard.Root
                key={gym.id}
                variant="default"
                size="default"
                onClick={() => {
                  setSelectedGym(gym.id);
                  onViewGymProfile?.(gym.id);
                }}
                className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-duo-border bg-gray-100">
                    <img
                      src={
                        gym.logo || gym.photos?.[0] || "/placeholder.svg"
                      }
                      alt={gym.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-duo-text">{gym.name}</h3>
                    <p className="text-xs text-duo-gray-dark mt-0.5 line-clamp-1">
                      {gym.address}
                    </p>
                    {gym.distance != null && (
                      <p className="text-xs font-medium text-duo-primary mt-1">
                        {gym.distance.toFixed(1)} km
                      </p>
                    )}
                  </div>
                </div>
              </DuoCard.Root>
            ))}
          </div>
        </DuoCard.Root>
      </SlideIn>
    </div>
  );
}
