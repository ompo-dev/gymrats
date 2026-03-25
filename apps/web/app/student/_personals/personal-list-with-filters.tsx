"use client";

import { ChevronRight, MapPin, Monitor, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoSelect } from "@/components/duo";
import { useUserGeolocation } from "@/hooks/use-user-geolocation";
import type {
  PersonalFilter,
  StudentPersonalListItem,
} from "@/lib/types/student-discovery";
import { cn } from "@/lib/utils";
import {
  getPersonalDirectoryCacheKey,
  useStudentDiscoveryStore,
} from "@/stores/student-discovery-store";

interface PersonalListWithFiltersProps {
  onViewPersonal: (personalId: string) => void;
  onSubscribe?: (personalId: string, planId: string) => void;
}

const FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "subscribed", label: "Onde estou inscrito" },
  { value: "near", label: "Próximos" },
  { value: "remote", label: "Atendimento remoto" },
];

export function PersonalListWithFilters({
  onViewPersonal,
}: PersonalListWithFiltersProps) {
  const [filter, setFilter] = useState<PersonalFilter>("all");
  const { position, requestPermission } = useUserGeolocation();
  const cacheKey = useMemo(
    () =>
      getPersonalDirectoryCacheKey({
        filter,
        lat:
          position && (filter === "all" || filter === "near")
            ? position.lat
            : undefined,
        lng:
          position && (filter === "all" || filter === "near")
            ? position.lng
            : undefined,
      }),
    [filter, position, position?.lat, position?.lng],
  );
  const personals = useStudentDiscoveryStore(
    (state) =>
      state.personalDirectory[cacheKey] as
        | StudentPersonalListItem[]
        | undefined,
  );
  const resource = useStudentDiscoveryStore(
    (state) => state.resources[cacheKey],
  );
  const loadPersonalDirectory = useStudentDiscoveryStore(
    (state) => state.loadPersonalDirectory,
  );
  const loading = !personals && (!resource || resource.status === "loading");

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

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
  }, [filter, loadPersonalDirectory, position, position?.lat, position?.lng]);

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
            onChange={(v) => setFilter(v as PersonalFilter)}
            placeholder="Filtro"
          />
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <h2 className="font-bold text-duo-fg">Personais</h2>
          </DuoCard.Header>
          {loading ? (
            <div className="py-12 text-center text-duo-gray-dark">
              Carregando...
            </div>
          ) : (personals ?? []).length === 0 ? (
            <div className="py-12 text-center text-duo-gray-dark">
              Nenhum personal encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {(personals ?? []).map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-duo-border p-4 text-left transition-all hover:border-duo-primary/40 active:scale-[0.99]",
                  )}
                  onClick={() => onViewPersonal(p.id)}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-duo-border">
                    <Image
                      src={p.avatar || "/placeholder.svg"}
                      alt={p.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-duo-text truncate">{p.name}</p>
                    {p.bio && (
                      <p className="line-clamp-2 text-sm text-duo-gray-dark">
                        {p.bio}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-2">
                      {p.atendimentoPresencial && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-duo-blue/10 px-2 py-0.5 text-xs font-bold text-duo-blue">
                          <MapPin className="h-3 w-3" />
                          Presencial
                        </span>
                      )}
                      {p.atendimentoRemoto && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-duo-purple/10 px-2 py-0.5 text-xs font-bold text-duo-purple">
                          <Monitor className="h-3 w-3" />
                          Remoto
                        </span>
                      )}
                      {p.distance != null && (
                        <span className="text-xs text-duo-gray-dark">
                          {p.distance} km
                        </span>
                      )}
                      {p.isSubscribed && (
                        <span className="rounded-full bg-duo-green/10 px-2 py-0.5 text-xs font-bold text-duo-green">
                          Inscrito
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-duo-gray-dark" />
                </button>
              ))}
            </div>
          )}
        </DuoCard.Root>
      </SlideIn>
    </div>
  );
}
