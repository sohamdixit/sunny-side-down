import type { Place } from './api';
import type { DriveSide, Mode } from './exposure';
import { detectDriveSide } from './exposure';

export interface Recent {
  place: Place;
  mode: Mode;
}

export interface Commute {
  id: string;
  label: string;
  from: Place;
  to: Place;
  mode: Mode;
  /** "HH:MM" 24h DEVICE-LOCAL departure time it should be checked for. */
  departAt: string;
}

/**
 * v2: the v1 records meant something different - `mode` was 'cab' (now 'car',
 * and a stale 'cab' would silently be scored as an auto-rickshaw) and
 * `departAt` meant IST rather than device-local. Bumping the key drops them
 * instead of reinterpreting them wrongly.
 */
const RECENTS_KEY = 'ssd.recents.v2';
const COMMUTES_KEY = 'ssd.commutes.v2';
const DRIVE_SIDE_KEY = 'ssd.driveSide';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) - recents/commutes just don't persist
  }
}

export const getRecents = () => read<Recent[]>(RECENTS_KEY, []);

export function addRecent(r: Recent) {
  // Dedupe on rounded coordinates, not name: "Station" and "Main Street"
  // collide across cities once the app is used outside one metro.
  const key = (p: Place) => `${p.pos.lat.toFixed(3)},${p.pos.lon.toFixed(3)}`;
  const rest = getRecents().filter((x) => key(x.place) !== key(r.place));
  write(RECENTS_KEY, [r, ...rest].slice(0, 4));
}

export const getCommutes = () => read<Commute[]>(COMMUTES_KEY, []);

export function addCommute(c: Commute) {
  write(COMMUTES_KEY, [...getCommutes(), c]);
}

export function removeCommute(id: string) {
  write(COMMUTES_KEY, getCommutes().filter((c) => c.id !== id));
}

/** Stored override if the user has flipped it, else a guess from the timezone. */
export function getDriveSide(): DriveSide {
  const stored = read<DriveSide | null>(DRIVE_SIDE_KEY, null);
  return stored === 'left' || stored === 'right' ? stored : detectDriveSide();
}

export function setDriveSide(side: DriveSide) {
  write(DRIVE_SIDE_KEY, side);
}
