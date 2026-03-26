import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MapContainer, TileLayer } from "react-leaflet";
import { PersonalMarker } from "./personal-marker";

function PersonalMarkerStory() {
  return (
    <div className="h-[420px] w-full">
      <MapContainer
        center={[-23.5624, -46.6541]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PersonalMarker
          personal={
            {
              id: "personal-1",
              name: "Rafa Moreira",
              address: "Rua dos Atletas, 45",
              distance: 2.1,
              coordinates: { lat: -23.5624, lng: -46.6541 },
              activeCampaigns: [{ primaryColor: "#50D5A1" }],
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
  title: "Organisms/Sections/PersonalMapWithLeaflet/PersonalMarker",
  component: PersonalMarkerStory,
} satisfies Meta<typeof PersonalMarkerStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
