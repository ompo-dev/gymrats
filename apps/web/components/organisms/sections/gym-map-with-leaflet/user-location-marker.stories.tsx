import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MapContainer, TileLayer } from "react-leaflet";
import { UserLocationMarker } from "./user-location-marker";

function UserLocationMarkerStory() {
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
        <UserLocationMarker position={{ lat: -23.5609, lng: -46.6564 }} />
      </MapContainer>
    </div>
  );
}

const meta = {
  title: "Organisms/Sections/GymMapWithLeaflet/UserLocationMarker",
  component: UserLocationMarkerStory,
} satisfies Meta<typeof UserLocationMarkerStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
