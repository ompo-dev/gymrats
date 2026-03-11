"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Dumbbell } from "lucide-react";
import { motion } from "motion/react";
import { DuoCard } from "@/components/duo";
import { getActiveBoostCampaigns } from "@/app/student/actions";
import { apiClient } from "@/lib/api/client";
import { useUserGeolocation } from "@/hooks/use-user-geolocation";
import type { BoostCampaign, GymLocation } from "@/lib/types";

interface BoostCampaignCarouselProps {
  gyms: GymLocation[];
  onViewGymProfile: (gymId: string, planId?: string, couponId?: string) => void;
  onViewPersonalProfile?: (
    personalId: string,
    planId?: string,
    couponId?: string,
  ) => void;
}

/** Registra impressão quando o card entra na viewport (1x por campanha por sessão) */
function useImpressionTracker() {
  const sentImpressions = useRef<Set<string>>(new Set());

  const trackImpression = useCallback(async (campaignId: string) => {
    if (sentImpressions.current.has(campaignId)) return;
    sentImpressions.current.add(campaignId);
    try {
      await apiClient.post(`/api/boost-campaigns/${campaignId}/impression`, {});
    } catch {
      sentImpressions.current.delete(campaignId);
    }
  }, []);

  return trackImpression;
}

/** Registra clique (1x por campanha por aluno no backend) */
async function trackClick(campaignId: string) {
  try {
    await apiClient.post(`/api/boost-campaigns/${campaignId}/click`, {});
  } catch {
    // Silencioso: usuário não autenticado ou já contou
  }
}

function CampaignCard({
  campaign,
  gym,
  primaryColor,
  onViewGymProfile,
  onViewPersonalProfile,
  onImpression,
}: {
  campaign: BoostCampaign;
  gym: GymLocation | undefined;
  primaryColor: string;
  onViewGymProfile: (gymId: string, planId?: string, couponId?: string) => void;
  onViewPersonalProfile?: (
    personalId: string,
    planId?: string,
    couponId?: string,
  ) => void;
  onImpression: (campaignId: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isPersonal = !!campaign.personalId;
  const displayName =
    gym?.name || campaign.personal?.name || "Academias Parceiras";
  const displayLogo = gym?.logo ?? campaign.personal?.avatar ?? null;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onImpression(campaign.id);
      },
      { threshold: 0.5, rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [campaign.id, onImpression]);

  const handleClick = async () => {
    await trackClick(campaign.id);
    const planId = campaign.linkedPlanId || undefined;
    const couponId = campaign.linkedCouponId || undefined;
    if (isPersonal && onViewPersonalProfile && campaign.personalId) {
      onViewPersonalProfile(campaign.personalId, planId, couponId);
    } else if (campaign.gymId) {
      onViewGymProfile(campaign.gymId, planId, couponId);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="min-w-[280px] sm:min-w-[320px] snap-center shrink-0 cursor-pointer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <DuoCard.Root
        variant="default"
        padding="none"
        className="h-full flex flex-col overflow-hidden ring-1 ring-black/5"
        onClick={handleClick}
      >
                <div className="p-5 flex-1 flex flex-col gap-4">
                  {/* Header: Logo + Name + Sponsored Badge */}
                  <div className="flex items-center gap-3">
                    {displayLogo ? (
                      <img
                        src={displayLogo}
                        alt="Logo"
                        className="w-12 h-12 rounded-full object-cover border border-duo-border ring-2 ring-transparent transition-all"
                        style={{ outlineColor: primaryColor }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-duo-bg-elevated flex items-center justify-center border border-duo-border">
                        <Dumbbell className="w-5 h-5 text-duo-gray-dark" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-duo-text truncate">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Sparkles
                          className="w-3 h-3"
                          style={{ color: primaryColor }}
                        />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-duo-gray-dark">
                          Patrocinado
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body: Offer Text */}
                  <div className="flex-1">
                    <h3
                      className="font-extrabold text-xl leading-snug mb-2 line-clamp-2"
                      style={{ color: primaryColor }}
                    >
                      {campaign.title}
                    </h3>
                    <p className="text-sm font-medium text-duo-fg-muted line-clamp-2">
                      {campaign.description}
                    </p>
                  </div>

                  {/* Footer: Single bold Call to Action */}
                  <div className="mt-4 pt-4 border-t border-duo-border/60">
                    <div
                      className="w-full py-3 rounded-xl text-sm font-bold text-white text-center transition-opacity hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Aproveitar Oferta
                    </div>
                  </div>
                </div>
      </DuoCard.Root>
    </motion.div>
  );
}

/** Chave estável para posição (evita refetch por flutuação mínima) */
function positionKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function BoostCampaignCarousel({
  gyms,
  onViewGymProfile,
  onViewPersonalProfile,
}: BoostCampaignCarouselProps) {
  const [campaigns, setCampaigns] = useState<BoostCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchedKeyRef = useRef<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const trackImpression = useImpressionTracker();
  const { position, loading: geoLoading, requestPermission } = useUserGeolocation();

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (geoLoading) return;

    const key = position
      ? positionKey(position.lat, position.lng)
      : "no-position";
    if (lastFetchedKeyRef.current === key && hasLoadedOnceRef.current) {
      return;
    }
    lastFetchedKeyRef.current = key;

    async function fetchCampaigns() {
      const isInitialLoad = !hasLoadedOnceRef.current;
      if (isInitialLoad) setLoading(true);
      try {
        if (position) {
          const res = await apiClient.get<{ campaigns: BoostCampaign[] }>(
            "/api/boost-campaigns/nearby",
            { params: { lat: position.lat, lng: position.lng } },
          );
          const next = res.data.campaigns ?? [];
          setCampaigns((prev) => {
            if (next.length > 0) return next;
            if (prev.length > 0) return prev;
            return next;
          });
          if (next.length === 0) {
            try {
              const fallback = (await getActiveBoostCampaigns()) as unknown as BoostCampaign[];
              if (fallback.length > 0) setCampaigns(fallback);
            } catch {
              // mantém prev ou []
            }
          }
        } else {
          const activeCampaigns = (await getActiveBoostCampaigns()) as unknown as BoostCampaign[];
          setCampaigns(activeCampaigns);
        }
      } catch (error) {
        try {
          const fallback = (await getActiveBoostCampaigns()) as unknown as BoostCampaign[];
          setCampaigns(fallback);
        } catch {
          setCampaigns((prev) => prev);
        }
      } finally {
        hasLoadedOnceRef.current = true;
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, [position?.lat, position?.lng, geoLoading]);

  if (loading || campaigns.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {campaigns.map((campaign) => {
          const gym = campaign.gymId
            ? gyms.find((g) => g.id === campaign.gymId)
            : undefined;
          const primaryColor = campaign.primaryColor || "var(--duo-primary)";
          return (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              gym={gym}
              primaryColor={primaryColor}
              onViewGymProfile={onViewGymProfile}
              onViewPersonalProfile={onViewPersonalProfile}
              onImpression={trackImpression}
            />
          );
        })}
      </div>
    </div>
  );
}
