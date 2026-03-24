import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  type WebViewMessageEvent,
  WebView,
} from "react-native-webview";
import { colors, radius } from "../theme";

type Marker = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  subtitle?: string;
  accent?: string;
};

type LeafletMapProps = {
  markers: Marker[];
  onSelectMarker?: (id: string) => void;
  selectedMarkerId?: string | null;
  userLocation?: {
    lat: number;
    lng: number;
  } | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildMapHtml(options: {
  markers: Marker[];
  selectedMarkerId?: string | null;
  userLocation?: {
    lat: number;
    lng: number;
  } | null;
}) {
  const validMarkers = options.markers.filter(
    (marker) =>
      Number.isFinite(marker.lat) &&
      Number.isFinite(marker.lng) &&
      Math.abs(marker.lat) <= 90 &&
      Math.abs(marker.lng) <= 180,
  );

  const mapCenter = (() => {
    if (options.userLocation) {
      return options.userLocation;
    }

    if (validMarkers[0]) {
      return { lat: validMarkers[0].lat, lng: validMarkers[0].lng };
    }

    return { lat: -23.55052, lng: -46.633308 };
  })();

  const markerPayload = JSON.stringify(
    validMarkers.map((marker) => ({
      accent: marker.accent || colors.primary,
      id: marker.id,
      label: escapeHtml(marker.label),
      lat: marker.lat,
      lng: marker.lng,
      selected: marker.id === options.selectedMarkerId,
      subtitle: marker.subtitle ? escapeHtml(marker.subtitle) : "",
    })),
  );

  const userLocationPayload = options.userLocation
    ? JSON.stringify(options.userLocation)
    : "null";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: ${colors.surfaceMuted};
      }

      .popup-title {
        color: ${colors.foreground};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 800;
        margin-bottom: 4px;
      }

      .popup-subtitle {
        color: ${colors.foregroundMuted};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
        line-height: 16px;
      }

      .marker-button {
        align-items: center;
        background: ${colors.primary};
        border: 2px solid rgba(255,255,255,0.95);
        border-radius: 999px;
        box-shadow: 0 8px 18px rgba(0,0,0,0.18);
        color: white;
        display: flex;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 11px;
        font-weight: 800;
        height: 26px;
        justify-content: center;
        padding: 0 10px;
        white-space: nowrap;
      }

      .marker-button.selected {
        transform: scale(1.08);
      }

      .user-marker {
        background: ${colors.blue};
        border: 3px solid rgba(255,255,255,0.98);
        border-radius: 999px;
        box-shadow: 0 0 0 8px rgba(28, 176, 246, 0.18);
        height: 18px;
        width: 18px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const markers = ${markerPayload};
      const userLocation = ${userLocationPayload};
      const map = L.map("map", {
        zoomControl: false,
      }).setView([${mapCenter.lat}, ${mapCenter.lng}], markers.length > 1 ? 12 : 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      if (userLocation) {
        L.marker([userLocation.lat, userLocation.lng], {
          icon: L.divIcon({
            className: "",
            html: '<div class="user-marker"></div>',
            iconAnchor: [9, 9],
            iconSize: [18, 18],
          }),
        }).addTo(map);
      }

      const bounds = [];

      markers.forEach((marker) => {
        const leafletMarker = L.marker([marker.lat, marker.lng], {
          icon: L.divIcon({
            className: "",
            html: '<div class="marker-button' + (marker.selected ? " selected" : "") + '" style="background:' + marker.accent + ';">' + marker.label + '</div>',
            iconAnchor: [24, 13],
          }),
        }).addTo(map);

        leafletMarker.bindPopup(
          '<div class="popup-title">' + marker.label + '</div>' +
            (marker.subtitle
              ? '<div class="popup-subtitle">' + marker.subtitle + '</div>'
              : ""),
        );

        leafletMarker.on("click", () => {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                id: marker.id,
                type: "select-marker",
              }),
            );
          }
        });

        bounds.push([marker.lat, marker.lng]);
      });

      if (userLocation) {
        bounds.push([userLocation.lat, userLocation.lng]);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, {
          padding: [28, 28],
        });
      }
    </script>
  </body>
</html>`;
}

export function LeafletMap({
  markers,
  onSelectMarker,
  selectedMarkerId,
  userLocation,
}: LeafletMapProps) {
  const html = useMemo(
    () =>
      buildMapHtml({
        markers,
        selectedMarkerId,
        userLocation,
      }),
    [markers, selectedMarkerId, userLocation],
  );

  return (
    <View style={styles.wrapper}>
      <WebView
        originWhitelist={["*"]}
        onMessage={(event: WebViewMessageEvent) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as {
              id?: string;
              type?: string;
            };

            if (payload.type === "select-marker" && payload.id) {
              onSelectMarker?.(payload.id);
            }
          } catch {
            // Ignore malformed bridge messages from the map.
          }
        }}
        source={{ html }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    height: 280,
    overflow: "hidden",
  },
  webview: {
    backgroundColor: colors.surfaceMuted,
    flex: 1,
  },
});
