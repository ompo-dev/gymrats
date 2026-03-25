"use client";

import { MapPin, Navigation, Users } from "lucide-react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoSelect } from "@/components/duo";
import { PersonalListItemCard } from "@/components/organisms/sections/list-item-cards";
import {
  type PersonalMapFilter,
  usePersonalMapStore,
} from "@/hooks/use-personal-map-state";
import { useUserGeolocation } from "@/hooks/use-user-geolocation";
import type { PersonalLocation } from "@/lib/types";
import type { StudentPersonalListItem } from "@/lib/types/student-discovery";
import {
  getPersonalDirectoryCacheKey,
  useStudentDiscoveryStore,
} from "@/stores/student-discovery-store";

const PersonalMapContainerComponent = dynamic(
  () => import("./map-container").then((m) => m.PersonalMapContainerComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full rounded-2xl bg-duo-bg border-2 border-duo-border flex items-center justify-center">
        <MapPin className="h-12 w-12 text-duo-gray-dark" />
      </div>
    ),
  },
);

interface PersonalMapWithLeafletProps {
  onViewPersonal: (personalId: string) => void;
}

type PersonalMapLocation = StudentPersonalListItem & {
  address?: string;
  coordinates?: PersonalLocation["coordinates"];
  activeCampaigns?: PersonalLocation["activeCampaigns"];
};

function hasCoordinates(
  personal: PersonalMapLocation,
): personal is PersonalMapLocation & {
  coordinates: NonNullable<PersonalLocation["coordinates"]>;
} {
  return (
    personal.coordinates !== undefined &&
    personal.coordinates.lat !== 0 &&
    personal.coordinates.lng !== 0
  );
}

const FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "subscribed", label: "Onde estou inscrito" },
  { value: "near", label: "Próximos" },
  { value: "remote", label: "Atendimento remoto" },
];

export function PersonalMapWithLeaflet({
  onViewPersonal,
}: PersonalMapWithLeafletProps) {
  const { position, requestPermission } = useUserGeolocation();
  const {
    selectedPersonalId,
    mapCenter,
    mapZoom,
    filter,
    setSelectedPersonal,
    setMapCenter,
    setFilter,
  } = usePersonalMapStore();

  const [mounted, setMounted] = useState(false);
  const personalDirectory = useStudentDiscoveryStore(
    (state) => state.personalDirectory,
  );
  const resources = useStudentDiscoveryStore((state) => state.resources);
  const loadPersonalDirectory = useStudentDiscoveryStore(
    (state) => state.loadPersonalDirectory,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (position) {
      setMapCenter({ lat: position.lat, lng: position.lng });
    }
  }, [position, setMapCenter]);

  useEffect(() => {
    void loadPersonalDirectory({
      filter,
      lat:
        position && (filter === "all" || filter === "near")
          ? position.lat
          : undefined,
      lng:
        position && (filter === "all" || filter === "near")
          ? position.lng
          : undefined,
    });
  }, [filter, position?.lat, position?.lng]);

  const cacheKey = getPersonalDirectoryCacheKey({
    filter,
    lat:
      position && (filter === "all" || filter === "near")
        ? position.lat
        : undefined,
    lng:
      position && (filter === "all" || filter === "near")
        ? position.lng
        : undefined,
  });

  const personals: PersonalMapLocation[] = personalDirectory[cacheKey] ?? [];
  const loading = resources[cacheKey]?.status === "loading";

  const personalsWithCoords = personals.filter(hasCoordinates);

  const sortedPersonals = [...personals].sort(
    (a, b) => (a.distance ?? 999) - (b.distance ?? 999),
  );

  const selectedPersonal = selectedPersonalId
    ? (sortedPersonals.find((p) => p.id === selectedPersonalId) ?? null)
    : null;

  const centerTuple: [number, number] = [mapCenter.lat, mapCenter.lng];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">Personais</h1>
          <p className="text-sm text-duo-gray-dark">
            Encontre personais próximos ou com atendimento remoto
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Users
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Filtros</h2>
            </div>
          </DuoCard.Header>
          <DuoSelect.Simple
            options={FILTER_OPTIONS}
            value={filter}
            onChange={(v) => setFilter(v as PersonalMapFilter)}
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
              <PersonalMapContainerComponent
                center={centerTuple}
                zoom={mapZoom}
                userPosition={position}
                personals={personalsWithCoords}
                selectedPersonalId={selectedPersonalId}
                onPersonalClick={(p) => setSelectedPersonal(p.id)}
              />
            )}
            <div className="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold shadow-lg flex items-center gap-1 z-[1000]">
              <Navigation className="h-3 w-3" />
              {personalsWithCoords.length} personais no mapa
            </div>
          </div>
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.3}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Users
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Personais</h2>
            </div>
          </DuoCard.Header>
          {loading ? (
            <div className="py-12 text-center text-duo-gray-dark">
              Carregando...
            </div>
          ) : personals.length === 0 ? (
            <div className="py-12 text-center text-duo-gray-dark">
              Nenhum personal encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPersonals.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <PersonalListItemCard
                    image={p.avatar || "/placeholder.svg"}
                    name={p.name}
                    onClick={() => onViewPersonal(p.id)}
                    badge={p.isSubscribed ? { label: "Inscrito" } : undefined}
                    atendimentoPresencial={p.atendimentoPresencial}
                    atendimentoRemoto={p.atendimentoRemoto}
                    distance={p.distance ?? undefined}
                    subtitle={
                      p.gyms?.length
                        ? p.gyms.map((g) => g.name).join(", ")
                        : undefined
                    }
                    isSelected={selectedPersonal?.id === p.id}
                    hoverColor="duo-primary"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </DuoCard.Root>
      </SlideIn>
    </div>
  );
}
