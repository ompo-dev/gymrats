import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { useBoostCampaignsStore } from "@/stores/boost-campaigns-store";
import { BoostCampaignCarousel } from "./boost-campaign-carousel";

function BoostCampaignCarouselStory() {
  useEffect(() => {
    useBoostCampaignsStore.setState({
      campaignsByKey: {
        "boost:all": [
          {
            id: "campaign-1",
            gymId: "gym-1",
            title: "Open Week",
            description: "Semana promocional para novas matriculas.",
            primaryColor: "#E2FF38",
            durationHours: 24,
            amountCents: 6000,
            status: "active",
            clicks: 37,
            impressions: 840,
            radiusKm: 5,
            linkedCouponId: "coupon-1",
            linkedPlanId: "plan-1",
            abacatePayBillingId: "billing-1",
            startsAt: new Date("2026-03-26T08:00:00.000Z"),
            endsAt: new Date("2026-03-27T08:00:00.000Z"),
            createdAt: new Date("2026-03-25T08:00:00.000Z"),
            updatedAt: new Date("2026-03-25T08:00:00.000Z"),
          },
        ],
      },
      resources: {
        "boost:all": {
          status: "ready",
          lastStartedAt: new Date("2026-03-25T08:00:00.000Z"),
          lastFetchedAt: new Date("2026-03-25T08:00:00.000Z"),
          error: null,
        },
      },
    });
  }, []);

  return (
    <BoostCampaignCarousel
      gyms={[
        {
          id: "gym-1",
          name: "GymRats Paulista",
          logo: "/placeholder.svg",
          address: "Av. Paulista, 900",
          coordinates: {
            lat: -23.5614,
            lng: -46.6559,
          },
          rating: 4.8,
          totalReviews: 128,
          plans: {
            daily: 39.9,
            weekly: 89.9,
            monthly: 149.9,
          },
          amenities: ["Musculacao", "Cardio"],
          openingHours: {
            open: "06:00",
            close: "22:00",
          },
          isPartner: true,
          openNow: true,
        },
      ]}
      onViewGymProfile={() => undefined}
      onViewPersonalProfile={() => undefined}
    />
  );
}

const meta = {
  title: "Organisms/Home/BoostCampaignCarousel",
  component: BoostCampaignCarouselStory,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof BoostCampaignCarouselStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
