"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoSelect } from "@/components/duo";
import { useUserGeolocation } from "@/hooks/use-user-geolocation";
import { useGymMapStore, type GymMapFilter } from "@/hooks/use-gym-map-state";
import { useStudent } from "@/hooks/use-student";
import type { DayPass, GymLocation, StudentGymMembership } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const [expandedPlanKey, setExpandedPlanKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedGymId) setExpandedPlanKey(null);
  }, [selectedGymId]);

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

  const selectedGym = selectedGymId
    ? sortedGyms.find((g) => g.id === selectedGymId) ?? null
    : null;

  const filterOptions = [
    { value: "all", label: "Todas" },
    { value: "subscribed", label: "Onde estou inscrito" },
    { value: "near", label: "Próximas" },
    { value: "open", label: "Abertas" },
  ];

  const planTypeLabel: Record<string, string> = {
    daily: "Diária",
    weekly: "Semanal",
    monthly: "Mensal",
    quarterly: "Trimestral",
    "semi-annual": "Semestral",
    annual: "Anual",
    trial: "Trial",
  };

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
          <div className="space-y-3">
            {/* Campanhas patrocinadas (ads) */}
            {sortedGyms.map((gym) => {
              if (!gym.activeCampaigns || gym.activeCampaigns.length === 0)
                return null;
              const activeAd = gym.activeCampaigns[0];
              return (
                <motion.div
                  key={`ad-${activeAd.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <div
                    className="border-2 rounded-2xl p-4 overflow-hidden relative group bg-duo-bg shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                    style={{ borderColor: activeAd.primaryColor }}
                    onClick={() => {
                      if (activeAd.linkedPlanId && onJoinPlan) {
                        onJoinPlan(
                          gym.id,
                          activeAd.linkedPlanId,
                          activeAd.linkedCouponId || undefined,
                        );
                      } else if (onViewGymProfile) {
                        onViewGymProfile(
                          gym.id,
                          activeAd.linkedPlanId || undefined,
                          activeAd.linkedCouponId || undefined,
                        );
                      }
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 w-full h-1"
                      style={{ backgroundColor: activeAd.primaryColor }}
                    />
                    <div className="flex justify-between mt-1 mb-2 items-center">
                      <span className="text-[10px] uppercase font-bold text-duo-text bg-duo-gray/20 px-2 py-0.5 rounded-md border border-duo-border flex items-center gap-1">
                        <Star className="w-3 h-3 fill-duo-text" /> Patrocinado
                      </span>
                      <span className="text-xs font-bold text-duo-gray-dark flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {gym.name}
                      </span>
                    </div>
                    <h5
                      className="font-bold text-lg"
                      style={{ color: activeAd.primaryColor }}
                    >
                      {activeAd.title}
                    </h5>
                    <p className="text-sm text-duo-text mt-1">
                      {activeAd.description}
                    </p>
                    <div className="mt-4 pt-3 border-t border-duo-border flex justify-end">
                      <DuoButton
                        size="sm"
                        className="flex items-center gap-2 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: activeAd.primaryColor, color: "var(--duo-bg)", borderColor: activeAd.primaryColor }}
                      >
                        Assinar Agora <ChevronRight className="w-4 h-4" />
                      </DuoButton>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {/* Lista normal de academias */}
            {sortedGyms.map((gym, index) => {
              const hasActivePass = dayPasses.some(
                (pass) => pass.gymId === gym.id && pass.status === "active",
              );
              return (
                <motion.div
                  key={gym.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard.Root
                    variant="default"
                    size="default"
                    onClick={() =>
                      setSelectedGym(selectedGym?.id === gym.id ? null : gym.id)
                    }
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
                          selectedGym?.id === gym.id && "rotate-90",
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
                            Planos disponíveis
                          </p>
                          {gym.membershipPlans &&
                          gym.membershipPlans.length > 0 ? (
                            <div className="space-y-2">
                              {gym.membershipPlans.map((plan) => {
                                const myMembership = memberships.find(
                                  (m) =>
                                    m.gymId === gym.id &&
                                    m.status !== "canceled",
                                );
                                const isMyPlan =
                                  myMembership?.planId === plan.id;
                                const isActive =
                                  myMembership?.status === "active";
                                const isPending =
                                  myMembership?.status === "pending";
                                const canContract = !myMembership;
                                const canChangePlan =
                                  myMembership &&
                                  isActive &&
                                  !isMyPlan &&
                                  !!onChangePlan;
                                const planKey = `${gym.id}-${plan.id}`;
                                const isExpanded = expandedPlanKey === planKey;
                                const isInteractive =
                                  canContract || canChangePlan;

                                return (
                                  <DuoCard.Root
                                    key={plan.id}
                                    variant="default"
                                    size="sm"
                                    className={cn(
                                      isInteractive &&
                                        "cursor-pointer transition-all hover:border-duo-blue",
                                      isExpanded && "ring-2 ring-duo-blue",
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isInteractive) return;
                                      if (isExpanded) {
                                        if (canContract)
                                          onJoinPlan?.(gym.id, plan.id);
                                        if (canChangePlan)
                                          onChangePlan?.(
                                            myMembership?.id,
                                            plan.id,
                                          );
                                      } else {
                                        setExpandedPlanKey(planKey);
                                      }
                                    }}
                                  >
                                    <div className="flex w-full min-w-0 flex-col gap-2">
                                      <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                          <p className="text-xs font-bold text-duo-fg truncate">
                                            {plan.name}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-duo-fg-muted">
                                            <span>{plan.duration} dias</span>
                                            <span>•</span>
                                            <span>
                                              {planTypeLabel[plan.type] ||
                                                plan.type}
                                            </span>
                                            {isMyPlan && isActive && (
                                              <>
                                                <span>•</span>
                                                <span className="font-bold text-duo-primary">
                                                  Plano ativo
                                                </span>
                                              </>
                                            )}
                                            {isMyPlan && isPending && (
                                              <>
                                                <span>•</span>
                                                <span className="font-bold text-duo-warning">
                                                  Matrícula pendente
                                                </span>
                                              </>
                                            )}
                                            {canContract && !isExpanded && (
                                              <>
                                                <span>•</span>
                                                <span>Clique para assinar</span>
                                              </>
                                            )}
                                            {canChangePlan && !isExpanded && (
                                              <>
                                                <span>•</span>
                                                <span className="font-bold text-duo-secondary">
                                                  Clique para trocar
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm font-bold text-duo-primary shrink-0">
                                          R$ {plan.price.toFixed(2)}
                                        </p>
                                      </div>
                                      {isExpanded && isInteractive && (
                                        <div className="flex gap-2 pt-1 border-t border-duo-border">
                                          <DuoButton
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpandedPlanKey(null);
                                            }}
                                          >
                                            Fechar
                                          </DuoButton>
                                          {canContract && (
                                            <DuoButton
                                              variant="primary"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onJoinPlan?.(gym.id, plan.id);
                                                setExpandedPlanKey(null);
                                              }}
                                              className="flex items-center gap-2"
                                            >
                                              <CreditCard className="h-4 w-4" />
                                              Assinar plano
                                            </DuoButton>
                                          )}
                                          {canChangePlan && (
                                            <DuoButton
                                              variant="primary"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onChangePlan?.(
                                                  myMembership?.id,
                                                  plan.id,
                                                );
                                                setExpandedPlanKey(null);
                                              }}
                                              className="flex items-center gap-2"
                                            >
                                              <CreditCard className="h-4 w-4" />
                                              Trocar para este plano
                                            </DuoButton>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </DuoCard.Root>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {gym.plans?.daily != null &&
                                gym.plans.daily > 0 && (
                                  <DuoCard.Root
                                    variant="yellow"
                                    size="sm"
                                    className="p-2 flex items-center justify-between gap-2"
                                  >
                                    <p className="text-[10px] font-bold text-duo-fg-muted">
                                      Diária
                                    </p>
                                    <p className="text-sm font-bold text-duo-warning">
                                      R$ {gym.plans.daily}
                                    </p>
                                  </DuoCard.Root>
                                )}
                              {gym.plans?.weekly != null &&
                                gym.plans.weekly > 0 && (
                                  <DuoCard.Root
                                    variant="orange"
                                    size="sm"
                                    className="p-2 flex items-center justify-between gap-2"
                                  >
                                    <p className="text-[10px] font-bold text-duo-fg-muted">
                                      Semanal
                                    </p>
                                    <p className="text-sm font-bold text-duo-accent">
                                      R$ {gym.plans.weekly}
                                    </p>
                                  </DuoCard.Root>
                                )}
                              {gym.plans?.monthly != null &&
                                gym.plans.monthly > 0 && (
                                  <DuoCard.Root
                                    variant="highlighted"
                                    size="sm"
                                    className="p-2 flex items-center justify-between gap-2"
                                  >
                                    <p className="text-[10px] font-bold text-duo-fg-muted">
                                      Mensal
                                    </p>
                                    <p className="text-sm font-bold text-duo-primary">
                                      R$ {gym.plans.monthly}
                                    </p>
                                  </DuoCard.Root>
                                )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {onViewGymProfile && (
                            <DuoButton
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewGymProfile(gym.id);
                              }}
                              className="flex items-center justify-center gap-2"
                            >
                              <MapPin className="h-4 w-4" />
                              Ver perfil
                            </DuoButton>
                          )}
                          <DuoButton
                            variant="outline"
                            size="sm"
                            disabled={!gym.phone}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (gym.phone)
                                window.open(`tel:${gym.phone}`, "_self");
                            }}
                            className="flex items-center justify-center gap-2"
                          >
                            <Phone className="h-4 w-4" />
                            Ligar
                          </DuoButton>

                          {hasActivePass ? (
                            <DuoButton
                              variant="primary"
                              size="sm"
                              disabled
                              className="col-span-2 flex items-center justify-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Passe Ativo
                            </DuoButton>
                          ) : gym.membershipPlans &&
                            gym.membershipPlans.length > 0 ? (
                            <DuoButton
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onJoinPlan?.(
                                  gym.id,
                                  gym.membershipPlans?.[0].id ?? "",
                                );
                              }}
                              className="col-span-2 flex items-center justify-center gap-2"
                            >
                              <CreditCard className="h-4 w-4" />
                              Assinar plano
                            </DuoButton>
                          ) : (
                            <DuoButton
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPurchaseDayPass(gym.id);
                              }}
                              disabled={
                                !(gym.plans?.daily && gym.plans.daily > 0)
                              }
                              className="col-span-2 flex items-center justify-center gap-2"
                            >
                              <CreditCard className="h-4 w-4" />
                              Diária
                            </DuoButton>
                          )}
                        </div>
                      </div>
                    )}
                  </DuoCard.Root>
                </motion.div>
              );
            })}
          </div>
        </DuoCard.Root>
      </SlideIn>
    </div>
  );
}
