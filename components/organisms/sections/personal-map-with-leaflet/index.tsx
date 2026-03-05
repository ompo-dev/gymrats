"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  MapPin,
  Monitor,
  Navigation,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoSelect } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { useUserGeolocation } from "@/hooks/use-user-geolocation";
import {
  usePersonalMapStore,
  type PersonalMapFilter,
} from "@/hooks/use-personal-map-state";
import type { PersonalLocation } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

const PersonalMapContainerComponent = dynamic(
  () =>
    import("./map-container").then((m) => m.PersonalMapContainerComponent),
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
  const [personals, setPersonals] = useState<PersonalLocation[]>([]);
  const [loading, setLoading] = useState(true);

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
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("filter", filter);
    if (position && (filter === "all" || filter === "near")) {
      params.set("lat", String(position.lat));
      params.set("lng", String(position.lng));
    }
    apiClient
      .get<{ personals: PersonalLocation[] }>(
        `/api/students/personals/nearby?${params}`,
      )
      .then((res) => {
        if (!cancelled) setPersonals(res.data.personals ?? []);
      })
      .catch(() => {
        if (!cancelled) setPersonals([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, position?.lat, position?.lng]);

  const personalsWithCoords = personals.filter(
    (p) =>
      p.coordinates &&
      p.coordinates.lat !== 0 &&
      p.coordinates.lng !== 0,
  );

  const sortedPersonals = [...personals].sort(
    (a, b) => (a.distance ?? 999) - (b.distance ?? 999),
  );

  const selectedPersonal = selectedPersonalId
    ? sortedPersonals.find((p) => p.id === selectedPersonalId) ?? null
    : null;

  const centerTuple: [number, number] = [mapCenter.lat, mapCenter.lng];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Personais
          </h1>
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
                  <DuoCard.Root
                    variant="default"
                    size="default"
                    onClick={() => onViewPersonal(p.id)}
                    className={cn(
                      "cursor-pointer transition-all hover:border-duo-primary/40 active:scale-[0.98]",
                      selectedPersonal?.id === p.id && "ring-2 ring-duo-primary",
                    )}
                  >
                      <div className="flex items-start gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-duo-border bg-gray-100">
                          <Image
                            src={p.avatar || "/placeholder.svg"}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-duo-text truncate">
                              {p.name}
                            </h3>
                            {p.isSubscribed && (
                              <span className="rounded-full bg-duo-green px-2 py-0.5 text-[10px] font-bold text-white">
                                Inscrito
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-duo-gray-dark">
                            {p.atendimentoPresencial && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-duo-blue/10 px-2 py-0.5 font-bold text-duo-blue">
                                <MapPin className="h-3 w-3" />
                                Presencial
                              </span>
                            )}
                            {p.atendimentoRemoto && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-duo-purple/10 px-2 py-0.5 font-bold text-duo-purple">
                                <Monitor className="h-3 w-3" />
                                Remoto
                              </span>
                            )}
                            {p.distance != null && (
                              <span className="font-bold">
                                {p.distance.toFixed(1)} km
                              </span>
                            )}
                          </div>
                          {p.gyms?.length > 0 && (
                            <p className="mt-1 text-xs text-duo-gray-dark">
                              {p.gyms.map((g) => g.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-5 w-5 shrink-0 text-duo-gray-dark transition-transform",
                            selectedPersonal?.id === p.id && "rotate-90",
                          )}
                        />
                      </div>
                    </DuoCard.Root>
                  </motion.div>
                ))}
            </div>
          )}
        </DuoCard.Root>
      </SlideIn>
    </div>
  );
}
