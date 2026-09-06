import type { Place } from './api';
import type { Mode } from './exposure';

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
  /** "HH:MM" 24h departure time it should be checked for. */
  departAt: string;
}

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

export const getRecents = () => read<Recent[]>('ssd.recents', []);

export function addRecent(r: Recent) {
  const rest = getRecents().filter((x) => x.place.name !== r.place.name);
  write('ssd.recents', [r, ...rest].slice(0, 4));
}

export const getCommutes = () => read<Commute[]>('ssd.commutes', []);

export function addCommute(c: Commute) {
  write('ssd.commutes', [...getCommutes(), c]);
}

export function removeCommute(id: string) {
  write('ssd.commutes', getCommutes().filter((c) => c.id !== id));
}
