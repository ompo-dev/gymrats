"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { UserLocationMarker } from "../gym-map-with-leaflet/user-location-marker";
import { PersonalMarker } from "./personal-marker";
import type { PersonalLocation } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];
const DEFAULT_ZOOM = 13;

interface PersonalMapContainerProps {
  center: [number, number];
  zoom: number;
  userPosition: { lat: number; lng: number } | null;
  personals: PersonalLocation[];
  selectedPersonalId: string | null;
  onPersonalClick: (personal: PersonalLocation) => void;
}

export function PersonalMapContainerComponent({
  center,
  zoom,
  userPosition,
  personals,
  selectedPersonalId,
  onPersonalClick,
}: PersonalMapContainerProps) {
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
      {personals
        .filter(
          (p) =>
            p.coordinates.lat !== 0 && p.coordinates.lng !== 0,
        )
        .map((personal) => (
          <PersonalMarker
            key={personal.id}
            personal={personal}
            isSelected={selectedPersonalId === personal.id}
            onClick={() => onPersonalClick(personal)}
          />
        ))}
    </MapContainer>
  );
}
