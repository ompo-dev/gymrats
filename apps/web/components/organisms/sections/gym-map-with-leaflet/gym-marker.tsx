"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import type { GymLocation } from "@/lib/types";

function createGymIcon(primaryColor: string) {
  return new L.DivIcon({
    className: "gym-marker",
    html: `<div style="
      width: 32px;
      height: 32px;
      background: ${primaryColor};
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

interface GymMarkerProps {
  gym: GymLocation;
  isSelected: boolean;
  onClick: () => void;
}

export function GymMarker({ gym, isSelected, onClick }: GymMarkerProps) {
  const { coordinates, name, address, distance } = gym;
  const lat = coordinates?.lat ?? 0;
  const lng = coordinates?.lng ?? 0;
  if (lat === 0 && lng === 0) return null;

  const icon = createGymIcon(
    gym.activeCampaigns?.[0]?.primaryColor ?? "var(--duo-primary, #3b82f6)",
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
