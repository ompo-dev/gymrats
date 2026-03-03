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
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-duo-yellow" />
        <h2 className="text-xl font-bold text-duo-text">Academias em Destaque</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {campaigns.map((campaign) => {
          const gym = gyms.find((g) => g.id === campaign.gymId);
          // O card usa a cor primária da academia ou fallback
          const primaryColor = campaign.primaryColor || "var(--duo-primary)";

          return (
            <motion.div
              key={campaign.id}
              className="min-w-[280px] sm:min-w-[320px] snap-center shrink-0 cursor-pointer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <DuoCard.Root
                className="relative overflow-hidden h-full flex flex-col border-2 transition-transform hover:scale-[1.02]"
                style={{ borderColor: primaryColor }}
                onClick={() =>
                  onViewGymProfile(
                    campaign.gymId,
                    campaign.linkedPlanId || undefined,
                    campaign.linkedCouponId || undefined
                  )
                }
              >
                {/* Linha colorida no topo */}
                <div
                  className="absolute top-0 left-0 w-full h-1.5"
                  style={{ backgroundColor: primaryColor }}
                />

                <div className="p-4 flex-1 flex flex-col">
                  {/* Badge de Patrocinado */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border text-duo-gray-dark border-duo-border bg-duo-bg-card">
                      Patrocinado
                    </span>
                    {gym?.logo ? (
                      <img
                        src={gym.logo}
                        alt="Logo"
                        className="w-8 h-8 rounded-lg object-cover border border-duo-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-duo-bg flex items-center justify-center border border-duo-border">
                        <Dumbbell className="w-4 h-4 text-duo-gray-dark" />
                      </div>
                    )}
                  </div>

                  <h3
                    className="font-bold text-lg mb-1 line-clamp-2"
                    style={{ color: primaryColor }}
                  >
                    {campaign.title}
                  </h3>
                  
                  <p className="text-sm text-duo-text line-clamp-2 mb-3 flex-1">
                    {campaign.description}
                  </p>

                  <div className="mt-auto pt-3 border-t border-duo-border flex items-center justify-between">
                    <span className="text-xs font-bold text-duo-gray-dark line-clamp-1 flex-1 mr-2">
                      {gym?.name || "Ver Academia"}
                    </span>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Ver Oferta
                    </button>
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
