import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MapContainerComponent } from "./map-container";

const gyms = [
  {
    id: "gym-1",
    name: "GymRats Paulista",
    address: "Av. Paulista, 900",
    coordinates: { lat: -23.5614, lng: -46.6559 },
    rating: 4.8,
    totalReviews: 128,
    plans: { daily: 39.9, weekly: 89.9, monthly: 149.9 },
    amenities: ["Musculacao", "Cardio"],
    openingHours: { open: "06:00", close: "22:00" },
    isPartner: true,
    openNow: true,
  },
] as never;

const meta = {
  title: "Organisms/Sections/GymMapWithLeaflet/MapContainer",
  component: MapContainerComponent,
  args: {
    center: [-23.5614, -46.6559],
    zoom: 13,
    userPosition: { lat: -23.5609, lng: -46.6564 },
    gyms,
    selectedGymId: "gym-1",
    onGymClick: () => undefined,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MapContainerComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
