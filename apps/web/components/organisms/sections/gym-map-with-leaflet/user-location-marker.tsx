"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const userIcon = new L.DivIcon({
  className: "user-location-marker",
  html: `<div style="
    width: 20px;
    height: 20px;
    background: var(--duo-primary, #3b82f6);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface UserLocationMarkerProps {
  position: { lat: number; lng: number } | null;
}

export function UserLocationMarker({ position }: UserLocationMarkerProps) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom(), {
        animate: true,
      });
    }
  }, [position, map]);

  if (!position) return null;

  return (
    <Marker position={[position.lat, position.lng]} icon={userIcon}>
      <Popup>Sua localização</Popup>
    </Marker>
  );
}
