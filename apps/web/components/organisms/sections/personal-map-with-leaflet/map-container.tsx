"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { PersonalLocation } from "@/lib/types";
import type { StudentPersonalListItem } from "@/lib/types/student-discovery";
import { UserLocationMarker } from "../gym-map-with-leaflet/user-location-marker";
import { PersonalMarker } from "./personal-marker";

const _DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];
const _DEFAULT_ZOOM = 13;

type PersonalMapLocation = StudentPersonalListItem & {
  address?: string;
  coordinates?: PersonalLocation["coordinates"];
  activeCampaigns?: PersonalLocation["activeCampaigns"];
};

interface PersonalMapContainerProps {
  center: [number, number];
  zoom: number;
  userPosition: { lat: number; lng: number } | null;
  personals: Array<
    PersonalMapLocation & {
      coordinates: NonNullable<PersonalLocation["coordinates"]>;
    }
  >;
  selectedPersonalId: string | null;
  onPersonalClick: (personal: PersonalMapLocation) => void;
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
      {personals.map((personal) => (
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
