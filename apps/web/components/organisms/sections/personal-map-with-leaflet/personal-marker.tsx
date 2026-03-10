"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import type { PersonalLocation } from "@/lib/types";

function createPersonalIcon(primaryColor: string) {
  return new L.DivIcon({
    className: "personal-marker",
    html: `<div style="
      width: 32px;
      height: 32px;
      background: ${primaryColor};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

interface PersonalMarkerProps {
  personal: PersonalLocation;
  isSelected: boolean;
  onClick: () => void;
}

export function PersonalMarker({
  personal,
  isSelected,
  onClick,
}: PersonalMarkerProps) {
  const { coordinates, name, address, distance } = personal;
  const lat = coordinates?.lat ?? 0;
  const lng = coordinates?.lng ?? 0;
  if (lat === 0 && lng === 0) return null;

  const icon = createPersonalIcon(
    personal.activeCampaigns?.[0]?.primaryColor ??
      "var(--duo-secondary, #8b5cf6)",
  );

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="min-w-[160px]">
          <p className="font-bold text-sm">{name}</p>
          {address && (
            <p className="text-xs text-gray-600 mt-0.5">{address}</p>
          )}
          {distance != null && (
            <p className="text-xs text-gray-500 mt-1">
              {distance.toFixed(1)} km
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
