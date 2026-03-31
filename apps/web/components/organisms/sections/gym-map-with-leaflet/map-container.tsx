"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { GymLocation } from "@/lib/types";
import { GymMarker } from "./gym-marker";
import { UserLocationMarker } from "./user-location-marker";

const _DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];
const _DEFAULT_ZOOM = 13;

interface MapContainerComponentProps {
  center: [number, number];
  zoom: number;
  userPosition: { lat: number; lng: number } | null;
  gyms: GymLocation[];
  selectedGymId: string | null;
  onGymClick: (gym: GymLocation) => void;
}

export function MapContainerComponent({
  center,
  zoom,
  userPosition,
  gyms,
  selectedGymId,
  onGymClick,
}: MapContainerComponentProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-2xl z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <UserLocationMarker position={userPosition} />
      {gyms.map((gym) => (
        <GymMarker
          key={gym.id}
          gym={gym}
          isSelected={selectedGymId === gym.id}
          onClick={() => onGymClick(gym)}
        />
      ))}
    </MapContainer>
  );
}
