"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Star,
  Clock,
  Check,
  Navigation,
  Phone,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GymLocation, DayPass } from "@/lib/types";
import { OptionSelector } from "@/components/molecules/selectors/option-selector";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { Button } from "@/components/atoms/buttons/button";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";

interface GymMapProps {
  gyms: GymLocation[];
  dayPasses: DayPass[];
  onPurchaseDayPass: (gymId: string) => void;
}

export function GymMap({ gyms, dayPasses, onPurchaseDayPass }: GymMapProps) {
  const [selectedGym, setSelectedGym] = useState<GymLocation | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "near">("all");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: -23.5505, lng: -46.6333 });
        }
      );
    }
  }, []);

  const filteredGyms = gyms.filter((gym) => {
    if (filter === "open") return gym.openNow;
    if (filter === "near") return gym.distance! < 3;
    return true;
  });

  const sortedGyms = [...filteredGyms].sort(
    (a, b) => (a.distance || 0) - (b.distance || 0)
  );

  const filterOptions = [
    { value: "all", label: "Todas" },
    { value: "near", label: "Próximas" },
    { value: "open", label: "Abertas" },
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
        <SectionCard title="Filtros" icon={MapPin}>
          <OptionSelector
            options={filterOptions}
            value={filter}
            onChange={(value) => setFilter(value as "all" | "open" | "near")}
            layout="list"
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoCard variant="default" size="default" className="relative h-48">
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-blue-100 to-green-100 rounded-2xl">
            <MapPin className="h-16 w-16 text-duo-blue" />
          </div>
          <div className="absolute bottom-2 left-2 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-lg flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            {sortedGyms.length} academias próximas
          </div>
        </DuoCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        <SectionCard title="Academias Cadastradas" icon={MapPin}>
          <div className="space-y-3">
            {sortedGyms.map((gym, index) => {
              const hasActivePass = dayPasses.some(
                (pass) => pass.gymId === gym.id && pass.status === "active"
              );

              return (
                <motion.div
                  key={gym.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard
                    variant="default"
                    size="default"
                    onClick={() =>
                      setSelectedGym(selectedGym?.id === gym.id ? null : gym)
                    }
                    className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-duo-border bg-gray-100">
                        <img
                          src={gym.logo || "/placeholder.svg"}
                          alt={gym.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-duo-text">
                            {gym.name}
                          </h3>
                          {gym.openNow && (
                            <span className="rounded-full bg-duo-green px-2 py-0.5 text-[10px] font-bold text-white">
                              ABERTA
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-xs text-duo-gray-dark">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-duo-yellow text-duo-yellow" />
                            <span className="font-bold">{gym.rating}</span>
                            <span>({gym.totalReviews})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="font-bold">
                              {gym.distance?.toFixed(1)} km
                            </span>
                          </div>
                        </div>

                        <p className="mt-1 text-xs text-duo-gray-dark">
                          {gym.address}
                        </p>
                      </div>

                      <ChevronRight
                        className={cn(
                          "h-5 w-5 shrink-0 text-duo-gray-dark transition-transform",
                          selectedGym?.id === gym.id && "rotate-90"
                        )}
                      />
                    </div>

                    {selectedGym?.id === gym.id && (
                      <div className="mt-4 space-y-4 border-t-2 border-duo-border pt-4">
                        {gym.openingHours && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-duo-blue" />
                          <span className="font-bold text-duo-gray-dark">
                            {gym.openingHours.open === "24h"
                              ? "Aberto 24 horas"
                              : `${gym.openingHours.open} - ${gym.openingHours.close}`}
                          </span>
                        </div>
                        )}

                        {gym.amenities && gym.amenities.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-bold text-duo-gray-dark">
                            Comodidades:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {gym.amenities.map((amenity) => (
                              <span
                                key={amenity}
                                className="rounded-full border-2 border-duo-border bg-duo-blue/10 px-2 py-1 text-xs font-bold text-duo-blue"
                              >
                                <Check className="mr-1 inline h-3 w-3" />
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                        )}

                        <div>
                          <p className="mb-2 text-xs font-bold text-duo-gray-dark">
                            Planos disponíveis:
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <DuoCard
                              variant="yellow"
                              size="sm"
                              className="p-2 text-center"
                            >
                              <p className="text-[10px] font-bold text-duo-gray-dark">
                                Diária
                              </p>
                              <p className="mt-1 text-sm font-bold text-duo-yellow">
                                R$ {gym.plans.daily}
                              </p>
                            </DuoCard>
                            <DuoCard
                              variant="orange"
                              size="sm"
                              className="p-2 text-center"
                            >
                              <p className="text-[10px] font-bold text-duo-gray-dark">
                                Semanal
                              </p>
                              <p className="mt-1 text-sm font-bold text-duo-orange">
                                R$ {gym.plans.weekly}
                              </p>
                            </DuoCard>
                            <DuoCard
                              variant="highlighted"
                              size="sm"
                              className="p-2 text-center"
                            >
                              <p className="text-[10px] font-bold text-duo-gray-dark">
                                Mensal
                              </p>
                              <p className="mt-1 text-sm font-bold text-duo-green">
                                R$ {gym.plans.monthly}
                              </p>
                            </DuoCard>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${gym.address}`, "_self");
                            }}
                            className="flex items-center justify-center gap-2"
                          >
                            <Phone className="h-4 w-4" />
                            Ligar
                          </Button>

                          {hasActivePass ? (
                            <Button
                              variant="default"
                              size="sm"
                              disabled
                              className="flex items-center justify-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Passe Ativo
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPurchaseDayPass(gym.id);
                              }}
                              className="flex items-center justify-center gap-2"
                            >
                              <CreditCard className="h-4 w-4" />
                              Diária
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </DuoCard>
                </motion.div>
              );
            })}
          </div>
        </SectionCard>
      </SlideIn>
    </div>
  );
}
