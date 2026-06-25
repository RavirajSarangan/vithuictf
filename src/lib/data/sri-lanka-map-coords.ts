import {
  projectLatLonToMapPercent,
  SRI_LANKA_DISTRICT_COORDS,
} from "@/lib/data/sri-lanka-map-projection";

/** Percentage positions on the Sri Lanka map viewBox (0–100). */
export const SRI_LANKA_CENTER_COORDS: Record<string, { x: number; y: number }> = Object.fromEntries(
  Object.entries(SRI_LANKA_DISTRICT_COORDS).map(([district, { lat, lon }]) => [
    district,
    projectLatLonToMapPercent(lat, lon),
  ])
);

export function getPaperCenterMapPosition(
  district: string,
  mapX?: number | null,
  mapY?: number | null
): { x: number; y: number } {
  if (mapX != null && mapY != null) {
    return { x: mapX, y: mapY };
  }
  const key = district.trim().toLowerCase();
  const coords = SRI_LANKA_DISTRICT_COORDS[key];
  if (coords) {
    return projectLatLonToMapPercent(coords.lat, coords.lon);
  }
  return SRI_LANKA_CENTER_COORDS[key] ?? { x: 48.4, y: 57 };
}
