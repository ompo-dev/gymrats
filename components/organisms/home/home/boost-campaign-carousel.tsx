"use client";

import { useEffect, useState } from "react";
import { Sparkles, Dumbbell } from "lucide-react";
import { motion } from "motion/react";
import { DuoCard } from "@/components/duo";
import { getActiveBoostCampaigns } from "@/app/student/actions";
import type { BoostCampaign, GymLocation } from "@/lib/types";

interface BoostCampaignCarouselProps {
  gyms: GymLocation[];
  onViewGymProfile: (gymId: string, planId?: string, couponId?: string) => void;
}

export function BoostCampaignCarousel({
  gyms,
  onViewGymProfile,
}: BoostCampaignCarouselProps) {
  const [campaigns, setCampaigns] = useState<BoostCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        // Obtenha os anúncios que estão "active"
        const activeCampaigns = (await getActiveBoostCampaigns()) as unknown as BoostCampaign[];
        setCampaigns(activeCampaigns);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  if (loading || campaigns.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {campaigns.map((campaign) => {
          const gym = gyms.find((g) => g.id === campaign.gymId);
          // O card usa a cor primária da academia ou fallback
          const primaryColor = campaign.primaryColor || "var(--duo-primary)";

          return (
            <motion.div
              key={campaign.id}
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
                onClick={() =>
                  onViewGymProfile(
                    campaign.gymId,
                    campaign.linkedPlanId || undefined,
                    campaign.linkedCouponId || undefined
                  )
                }
              >
                <div className="p-5 flex-1 flex flex-col gap-4">
                  {/* Header: Logo + Gym Name + Sponsored Badge */}
                  <div className="flex items-center gap-3">
                    {gym?.logo ? (
                      <img
                        src={gym.logo}
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
                        {gym?.name || "Academias Parceiras"}
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
        })}
      </div>
    </div>
  );
}
