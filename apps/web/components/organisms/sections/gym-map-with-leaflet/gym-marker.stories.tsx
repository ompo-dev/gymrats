import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MapContainer, TileLayer } from "react-leaflet";
import { GymMarker } from "./gym-marker";

function GymMarkerStory() {
  return (
    <div className="h-[420px] w-full">
      <MapContainer
        center={[-23.5614, -46.6559]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GymMarker
          gym={
            {
              id: "gym-1",
              name: "GymRats Paulista",
              address: "Av. Paulista, 900",
              coordinates: { lat: -23.5614, lng: -46.6559 },
              distance: 1.2,
              rating: 4.8,
              totalReviews: 128,
              plans: { daily: 39.9, weekly: 89.9, monthly: 149.9 },
              amenities: ["Musculacao"],
              openingHours: { open: "06:00", close: "22:00" },
              isPartner: true,
              openNow: true,
              activeCampaigns: [{ primaryColor: "#E2FF38" }],
            } as never
          }
          isSelected
          onClick={() => undefined}
        />
      </MapContainer>
    </div>
  );
}

const meta = {
  title: "Organisms/Sections/GymMapWithLeaflet/GymMarker",
  component: GymMarkerStory,
} satisfies Meta<typeof GymMarkerStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
