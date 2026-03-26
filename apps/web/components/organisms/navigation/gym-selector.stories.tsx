import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { useGymsDataStore } from "@/stores/gyms-list-store";
import { GymSelector } from "./gym-selector";

function GymSelectorStory() {
  useEffect(() => {
    useGymsDataStore.setState({
      gymsData: {
        "gym-1": {
          id: "gym-1",
          name: "GymRats Paulista",
          address: "Av. Paulista, 900",
          email: "contato@gymrats.local",
          plan: "premium",
          hasActiveSubscription: true,
          isActive: true,
        },
        "gym-2": {
          id: "gym-2",
          name: "Arena Norte",
          address: "Rua Norte, 120",
          email: "arena@gymrats.local",
          plan: "basic",
          hasActiveSubscription: false,
          isActive: false,
        },
      },
      activeGymId: "gym-1",
      canCreateMultipleGyms: true,
      isLoading: false,
    });
  }, []);

  return <GymSelector.Simple />;
}

const meta = {
  title: "Organisms/Navigation/GymSelector",
  component: GymSelectorStory,
} satisfies Meta<typeof GymSelectorStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
