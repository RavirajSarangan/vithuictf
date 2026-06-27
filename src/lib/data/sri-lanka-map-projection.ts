/** Simplemaps SVG viewBox (0–1000) projection calibrated from embedded reference points. */
export const SRI_LANKA_MAP_VIEWBOX = "0 0 1000 1000";

const LON_ORIGIN = 79.767;
const LAT_ORIGIN = 6.119;
const X_SCALE = 230.4;
const Y_SCALE = -232.3;
const SVG_X_ORIGIN = 268.2;
const SVG_Y_ORIGIN = 909.3;

/** District centroids for paper-center pin placement. */
export const SRI_LANKA_DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  jaffna: { lat: 9.6615, lon: 80.0255 },
  kilinochchi: { lat: 9.3803, lon: 80.376 },
  vavuniya: { lat: 8.7542, lon: 80.4985 },
  trincomalee: { lat: 8.5874, lon: 81.2152 },
  batticaloa: { lat: 7.7102, lon: 81.6924 },
  anuradhapura: { lat: 8.3114, lon: 80.4037 },
  kurunegala: { lat: 7.4863, lon: 80.3623 },
  kandy: { lat: 7.2906, lon: 80.6337 },
  matale: { lat: 7.4675, lon: 80.6234 },
  colombo: { lat: 6.9271, lon: 79.8612 },
  gampaha: { lat: 7.0873, lon: 80.0147 },
  kalutara: { lat: 6.5854, lon: 80.1813 },
  ratnapura: { lat: 6.6828, lon: 80.4037 },
  galle: { lat: 6.0535, lon: 80.221 },
  matara: { lat: 5.9549, lon: 80.555 },
  badulla: { lat: 6.9891, lon: 81.0557 },
  negombo: { lat: 7.2083, lon: 79.8358 },
  puttalam: { lat: 8.0362, lon: 79.8283 },
};

export function projectLatLonToMapPercent(lat: number, lon: number): { x: number; y: number } {
  const { x, y } = projectLatLonToSvg(lat, lon);
  return {
    x: Math.round((x / 10) * 10) / 10,
    y: Math.round((y / 10) * 10) / 10,
  };
}

/** Raw viewBox coordinates (0–1000) for inline SVG overlays. */
export function projectLatLonToSvg(lat: number, lon: number): { x: number; y: number } {
  const x = SVG_X_ORIGIN + (lon - LON_ORIGIN) * X_SCALE;
  const y = SVG_Y_ORIGIN + (lat - LAT_ORIGIN) * Y_SCALE;
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

export const HERO_FOUNDER_MAP_MARKERS = {
  jaffna: projectLatLonToSvg(
    SRI_LANKA_DISTRICT_COORDS.jaffna.lat,
    SRI_LANKA_DISTRICT_COORDS.jaffna.lon
  ),
  vavuniya: projectLatLonToSvg(
    SRI_LANKA_DISTRICT_COORDS.vavuniya.lat,
    SRI_LANKA_DISTRICT_COORDS.vavuniya.lon
  ),
  puttalam: projectLatLonToSvg(
    SRI_LANKA_DISTRICT_COORDS.puttalam.lat,
    SRI_LANKA_DISTRICT_COORDS.puttalam.lon
  ),
  colombo: projectLatLonToSvg(
    SRI_LANKA_DISTRICT_COORDS.colombo.lat,
    SRI_LANKA_DISTRICT_COORDS.colombo.lon
  ),
  galle: projectLatLonToSvg(
    SRI_LANKA_DISTRICT_COORDS.galle.lat,
    SRI_LANKA_DISTRICT_COORDS.galle.lon
  ),
} as const;

export type HeroFounderMapCityKey = keyof typeof HERO_FOUNDER_MAP_MARKERS;
