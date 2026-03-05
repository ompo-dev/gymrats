"use client";

import {
  ChevronRight,
  MapPin,
  Monitor,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoSelect } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { useUserGeolocation } from "@/hooks/use-user-geolocation";
import { cn } from "@/lib/utils";
import Image from "next/image";

export type PersonalFilter = "all" | "subscribed" | "near" | "remote";

export interface PersonalListItem {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
  distance: number | null;
  gyms: { id: string; name: string }[];
  isSubscribed: boolean;
}

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
  const [personals, setPersonals] = useState<PersonalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { position, requestPermission } = useUserGeolocation();

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

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
      .get<{ personals: PersonalListItem[] }>(
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
          ) : personals.length === 0 ? (
            <div className="py-12 text-center text-duo-gray-dark">
              Nenhum personal encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {personals.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-duo-border p-4 transition-all hover:border-duo-primary/40 active:scale-[0.99]",
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
                </div>
              ))}
            </div>
          )}
        </DuoCard.Root>
      </SlideIn>
    </div>
  );
}
