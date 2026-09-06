import type { LatLng } from './geo';

export interface Place {
  name: string;
  detail: string;
  pos: LatLng;
}

/**
 * Photon (OSM) geocoding - free, no key, fine for a dev prototype.
 * Biased toward the given position so Indian localities rank first.
 */
export async function searchPlaces(query: string, near: LatLng): Promise<Place[]> {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
    `&limit=6&lat=${near.lat}&lon=${near.lon}`;
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
}

/**
 * OSRM public demo server - free, no key, dev use only (not for production
 * traffic). Durations are free-flow; we stretch them with a crude peak-hour
 * multiplier since the sun math only needs rough timing.
 */
export async function fetchRoute(from: LatLng, to: LatLng, departure: Date): Promise<Route> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lon},${from.lat};${to.lon},${to.lat}` +
    `?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`routing failed: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('no route found');
  const route = data.routes[0];
  const hour = departure.getHours();
  const peak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21) ? 1.6 : 1.25;
  return {
    coords: (route.geometry.coordinates as [number, number][]).map(([lon, lat]) => ({
      lon,
      lat,
    })),
    durationSec: route.duration * peak,
    distanceM: route.distance,
  };
}
