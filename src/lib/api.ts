import type { LatLng } from './geo';

export interface Place {
  name: string;
  detail: string;
  pos: LatLng;
}

/**
 * Photon (OSM) geocoding - free, no key, global, fine for a dev prototype.
 * `near` only biases the ranking; it is optional so the ORIGIN search still
 * works before we know where the user is.
 */
export async function searchPlaces(query: string, near?: LatLng): Promise<Place[]> {
  const bias = near ? `&lat=${near.lat}&lon=${near.lon}` : '';
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
    `&limit=6${bias}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocoding failed: ${res.status}`);
  const data = await res.json();
  interface PhotonFeature {
    geometry: { coordinates: [number, number] };
    properties: {
      name?: string;
      street?: string;
      district?: string;
      city?: string;
      state?: string;
    };
  }
  return (data.features as PhotonFeature[])
    .filter((f) => f.properties.name || f.properties.street)
    .map((f) => ({
      name: f.properties.name ?? f.properties.street ?? '',
      detail: [f.properties.district, f.properties.city, f.properties.state]
        .filter(Boolean)
        .join(', '),
      pos: { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
    }));
}

export interface Route {
  coords: LatLng[];
  durationSec: number;
  distanceM: number;
  /** Which provider answered, for display and debugging. */
  source: 'mapbox' | 'osrm';
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/** Both providers return the same shape: Mapbox Directions descends from OSRM. */
interface DirectionsResponse {
  code?: string;
  routes?: {
    geometry: { coordinates: [number, number][] };
    duration: number;
    distance: number;
  }[];
}

function toRoute(data: DirectionsResponse, source: Route['source'], durationScale = 1): Route {
  if (!data.routes?.length) throw new Error('no route found');
  const route = data.routes[0];
  return {
    coords: route.geometry.coordinates.map(([lon, lat]) => ({ lon, lat })),
    durationSec: route.duration * durationScale,
    distanceM: route.distance,
    source,
  };
}

/**
 * Mapbox Directions, driving-traffic profile: the duration already accounts
 * for live traffic, so no peak-hour fudge is applied. It reflects traffic
 * *now* rather than at a future planned departure, which is well inside the
 * tolerance of the sun math (azimuth moves ~15 deg/hour).
 */
async function fetchRouteMapbox(from: LatLng, to: LatLng, token: string): Promise<Route> {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
    `${from.lon},${from.lat};${to.lon},${to.lat}` +
    `?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const hint =
      res.status === 401
        ? ' (check VITE_MAPBOX_TOKEN)'
        : res.status === 429
          ? ' (Mapbox rate limit)'
          : '';
    throw new Error(`Mapbox routing failed: ${res.status}${hint}`);
  }
  return toRoute(await res.json(), 'mapbox');
}

/**
 * OSRM public demo server - free, no key, DEV ONLY: its usage policy forbids
 * production traffic. Durations are free-flow, so they get a crude peak-hour
 * multiplier; the sun math only needs rough timing.
 */
async function fetchRouteOSRM(from: LatLng, to: LatLng, departure: Date): Promise<Route> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lon},${from.lat};${to.lon},${to.lat}` +
    `?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`routing failed: ${res.status}`);
  const data: DirectionsResponse = await res.json();
  if (data.code !== 'Ok') throw new Error('no route found');
  const hour = departure.getHours();
  const peak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21) ? 1.6 : 1.25;
  return toRoute(data, 'osrm', peak);
}

/**
 * Uses Mapbox when a token is configured, else the keyless OSRM demo server.
 * Mapbox errors are NOT silently retried against OSRM - that would mask an
 * expired token or a blown quota behind quietly worse data.
 */
export async function fetchRoute(from: LatLng, to: LatLng, departure: Date): Promise<Route> {
  if (MAPBOX_TOKEN) return fetchRouteMapbox(from, to, MAPBOX_TOKEN);
  return fetchRouteOSRM(from, to, departure);
}

/**
 * Turns a thrown routing error into something a person wants to read. The raw
 * message stays available for the console - it is a diagnostic, not copy.
 */
export function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (raw.includes('no route found')) {
    return "We couldn't find a way there. Try a spot a bit closer to a road?";
  }
  if (raw.includes('401')) return 'Our map key is having a moment. This one is on us.';
  if (raw.includes('429')) return "We've asked the map too many questions. Give it a minute?";
  if (/Failed to fetch|NetworkError|network/i.test(raw)) {
    return 'No signal, it seems. Check your connection and try again.';
  }
  return 'The map went quiet on us. Try that again?';
}
