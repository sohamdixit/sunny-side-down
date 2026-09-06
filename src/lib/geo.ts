export interface LatLng {
  lat: number;
  lon: number;
}

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function haversine(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Initial bearing from a to b, compass degrees 0-360 (0 = north). */
export function bearing(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

export interface RouteSample {
  point: LatLng;
  heading: number;
  /** Fraction of total route distance at this sample's midpoint, 0-1. */
  frac: number;
}

/**
 * Resample a polyline into n equal-distance slices (midpoint + heading each).
 * Timing model is constant speed along the route: crude, but sun azimuth moves
 * ~15°/hour, so even large timing errors barely move the verdict.
 */
export function sampleRoute(coords: LatLng[], n: number): RouteSample[] {
  if (coords.length < 2) return [];
  const cum: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
  }
  const total = cum[cum.length - 1];
  if (total === 0) return [];

  const samples: RouteSample[] = [];
  let seg = 0;
  for (let i = 0; i < n; i++) {
    const frac = (i + 0.5) / n;
    const target = frac * total;
    while (seg < coords.length - 2 && cum[seg + 1] < target) seg++;
    const segLen = cum[seg + 1] - cum[seg];
    const t = segLen > 0 ? (target - cum[seg]) / segLen : 0;
    const a = coords[seg];
    const b = coords[seg + 1];
    samples.push({
      point: {
        lat: a.lat + (b.lat - a.lat) * t,
        lon: a.lon + (b.lon - a.lon) * t,
      },
      heading: bearing(a, b),
      frac,
    });
  }
  return samples;
}

/** Fraction of the route (by distance) nearest to a given position. */
export function progressAlong(coords: LatLng[], pos: LatLng): number {
  if (coords.length < 2) return 0;
  const cum: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
  }
  const total = cum[cum.length - 1];
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = haversine(coords[i], pos);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return total > 0 ? cum[best] / total : 0;
}
