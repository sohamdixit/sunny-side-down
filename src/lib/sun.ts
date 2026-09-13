import * as SunCalc from 'suncalc';
import type { LatLng } from './geo';

export interface SunPos {
  /** Compass azimuth in degrees: 0 = north, 90 = east, 180 = south, 270 = west. */
  azimuth: number;
  /** Elevation above the horizon in degrees; negative = below horizon. */
  elevation: number;
}

/**
 * NOTE: suncalc 2.x already returns DEGREES, with azimuth as a compass
 * bearing (0 = north) - unlike the 1.x API (radians measured from south)
 * that @types/suncalc still describes. Verified against
 * node_modules/suncalc/index.js: azimuth is `(... / rad + 540) % 360`.
 */
export function sunPosition(date: Date, at: LatLng): SunPos {
  const p = SunCalc.getPosition(date, at.lat, at.lon);
  return { azimuth: p.azimuth, elevation: p.altitude };
}

/**
 * Sun below the horizon. This is the single night threshold in the app -
 * exposure.ts derives its own `night` flag from the same test so the home
 * screen and the result screen can never disagree.
 */
export function isNight(date: Date, at: LatLng): boolean {
  return sunPosition(date, at).elevation < 0;
}
