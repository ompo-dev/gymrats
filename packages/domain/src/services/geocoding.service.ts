/**
 * Serviço de geocoding usando Nominatim (OpenStreetMap).
 * Converte endereço completo em latitude/longitude.
 * Rate limit Nominatim: 1 req/s — usamos delay entre chamadas se necessário.
 */
import { log } from "../log";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "GymRats/1.0 (contact@example.com)";

export interface GeocodeResult {
  lat: number;
  lng: number;
}

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100; // ~1 req/s

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Converte um endereço completo em coordenadas lat/lng.
 * Retorna null se não encontrar ou em caso de erro (academia continua funcionando sem lat/lng).
 */
export async function geocodeAddress(
  fullAddress: string,
): Promise<GeocodeResult | null> {
  const trimmed = fullAddress?.trim();
  if (!trimmed) return null;

  await throttle();

  try {
    const params = new URLSearchParams({
      format: "json",
      q: trimmed,
      limit: "1",
      addressdetails: "0",
    });
    const url = `${NOMINATIM_BASE}?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      log.warn("Nominatim returned a non-success status", {
        status: res.status,
      });
      return null;
    }

    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0];
    const lat = first?.lat ? parseFloat(first.lat) : NaN;
    const lon = first?.lon ? parseFloat(first.lon) : NaN;
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

    return { lat, lng: lon };
  } catch (error) {
    log.warn("Failed to geocode address", { error });
    return null;
  }
}
