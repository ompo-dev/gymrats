"use client";

import { useCallback, useEffect, useState } from "react";

export interface UserPosition {
  lat: number;
  lng: number;
}

interface UseUserGeolocationResult {
  position: UserPosition | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => void;
}

export function useUserGeolocation(): UseUserGeolocationResult {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Permissão de localização negada"
            : "Não foi possível obter sua localização",
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  return { position, loading, error, requestPermission };
}
