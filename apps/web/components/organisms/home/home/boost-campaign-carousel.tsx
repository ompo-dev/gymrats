"use client";

import { useEffect, useMemo, useRef } from "react";
import { Dumbbell, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { DuoCard } from "@/components/duo";
import { useUserGeolocation } from "@/hooks/use-user-geolocation";
import type { BoostCampaign, GymLocation } from "@/lib/types";
import {
  getBoostCampaignCacheKey,
  useBoostCampaignsStore,
} from "@/stores/boost-campaigns-store";

interface BoostCampaignCarouselProps {
  gyms: GymLocation[];
  onViewGymProfile: (gymId: string, planId?: string, couponId?: string) => void;
  onViewPersonalProfile?: (
    personalId: string,
    planId?: string,
    couponId?: string,
  ) => void;
}

function useImpressionTracker() {
  return useBoostCampaignsStore((state) => state.trackImpression);
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
  onImpression: (campaignId: string) => Promise<void>;
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
        if (entries[0]?.isIntersecting) {
          void onImpression(campaign.id);
        }
      },
      { threshold: 0.5, rootMargin: "0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [campaign.id, onImpression]);

  const handleClick = async () => {
    await useBoostCampaignsStore.getState().trackClick(campaign.id);

    const planId = campaign.linkedPlanId || undefined;
    const couponId = campaign.linkedCouponId || undefined;

    if (isPersonal && onViewPersonalProfile && campaign.personalId) {
      onViewPersonalProfile(campaign.personalId, planId, couponId);
      return;
    }

    if (campaign.gymId) {
      onViewGymProfile(campaign.gymId, planId, couponId);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="min-w-[280px] shrink-0 snap-center cursor-pointer sm:min-w-[320px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <DuoCard.Root
        variant="default"
        padding="none"
        className="flex h-full flex-col overflow-hidden ring-1 ring-black/5"
        onClick={handleClick}
      >
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt="Logo"
                className="h-12 w-12 rounded-full border border-duo-border object-cover ring-2 ring-transparent transition-all"
                style={{ outlineColor: primaryColor }}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-duo-border bg-duo-bg-elevated">
                <Dumbbell className="h-5 w-5 text-duo-gray-dark" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-duo-text">
                {displayName}
              </p>
              <div className="mt-0.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" style={{ color: primaryColor }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-duo-gray-dark">
                  Patrocinado
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h3
              className="mb-2 line-clamp-2 text-xl font-extrabold leading-snug"
              style={{ color: primaryColor }}
            >
              {campaign.title}
            </h3>
            <p className="line-clamp-2 text-sm font-medium text-duo-fg-muted">
              {campaign.description}
            </p>
          </div>

          <div className="mt-4 border-t border-duo-border/60 pt-4">
            <div
              className="w-full rounded-xl py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
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

export function BoostCampaignCarousel({
  gyms,
  onViewGymProfile,
  onViewPersonalProfile,
}: BoostCampaignCarouselProps) {
  const trackImpression = useImpressionTracker();
  const { position, loading: geoLoading, requestPermission } = useUserGeolocation();
  const campaignsByKey = useBoostCampaignsStore((state) => state.campaignsByKey);
  const resources = useBoostCampaignsStore((state) => state.resources);
  const loadCampaigns = useBoostCampaignsStore((state) => state.loadCampaigns);
  const lastFetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (geoLoading) return;

    const cacheKey = getBoostCampaignCacheKey({
      lat: position?.lat,
      lng: position?.lng,
    });

    if (lastFetchedKeyRef.current === cacheKey) {
      return;
    }

    lastFetchedKeyRef.current = cacheKey;
    void loadCampaigns({
      lat: position?.lat,
      lng: position?.lng,
    });
  }, [geoLoading, loadCampaigns, position?.lat, position?.lng]);

  const cacheKey = useMemo(
    () =>
      getBoostCampaignCacheKey({
        lat: position?.lat,
        lng: position?.lng,
      }),
    [position?.lat, position?.lng],
  );
  const fallbackKey = getBoostCampaignCacheKey();
  const campaigns =
    campaignsByKey[cacheKey] ?? campaignsByKey[fallbackKey] ?? [];
  const loading = resources[cacheKey]?.status === "loading";

  if (loading || campaigns.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {campaigns.map((campaign) => {
          const gym = campaign.gymId
            ? gyms.find((item) => item.id === campaign.gymId)
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
