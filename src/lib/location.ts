import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import type { LatLng } from './geo';

/**
 * Capacitor does NOT patch navigator.geolocation, so the browser API silently
 * fails inside the native WebView. This adapter routes to the native plugin on
 * device and to the browser API on the web, and normalises the watch handle
 * (native ids are strings, browser ids are numbers).
 */
export type WatchHandle = { native: true; id: string } | { native: false; id: number };

export type GeoFailure = 'denied' | 'disabled' | 'timeout' | 'unsupported';

/**
 * Distinguishing the failures matters: collapsing them all to null is what let
 * a silent emulator timeout look like a working app sitting on a default city.
 */
export type GeoResult = { ok: true; pos: LatLng } | { ok: false; reason: GeoFailure };

const isNative = Capacitor.isNativePlatform();

const GEO_OPTS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };

function classify(e: unknown): GeoFailure {
  const msg = String((e as Error)?.message ?? e).toLowerCase();
  if (msg.includes('denied') || msg.includes('permission')) return 'denied';
  if (msg.includes('not enabled') || msg.includes('disabled') || msg.includes('unavailable')) {
    return 'disabled';
  }
  return 'timeout';
}

/** Requests permission only when it isn't already granted. */
async function ensureNativePermission(): Promise<GeoFailure | null> {
  let perm = await Geolocation.checkPermissions();
  if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
    perm = await Geolocation.requestPermissions();
  }
  const granted = perm.location === 'granted' || perm.coarseLocation === 'granted';
  return granted ? null : 'denied';
}

export async function getCurrentPosition(): Promise<GeoResult> {
  if (isNative) {
    try {
      const denied = await ensureNativePermission();
      if (denied) return { ok: false, reason: denied };
      const p = await Geolocation.getCurrentPosition(GEO_OPTS);
      return { ok: true, pos: { lat: p.coords.latitude, lon: p.coords.longitude } };
    } catch (e) {
      return { ok: false, reason: classify(e) };
    }
  }
  if (!navigator.geolocation) return { ok: false, reason: 'unsupported' };
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ ok: true, pos: { lat: p.coords.latitude, lon: p.coords.longitude } }),
      (err) => resolve({ ok: false, reason: err.code === err.PERMISSION_DENIED ? 'denied' : 'timeout' }),
      GEO_OPTS,
    );
  });
}

export async function watchPosition(
  onMove: (pos: LatLng) => void,
  onFail: (reason: GeoFailure) => void,
): Promise<WatchHandle | null> {
  if (isNative) {
    try {
      const denied = await ensureNativePermission();
      if (denied) {
        onFail(denied);
        return null;
      }
      const id = await Geolocation.watchPosition(GEO_OPTS, (p, err) => {
        if (err || !p) {
          onFail(err ? classify(err) : 'timeout');
          return;
        }
        onMove({ lat: p.coords.latitude, lon: p.coords.longitude });
      });
      return { native: true, id };
    } catch (e) {
      onFail(classify(e));
      return null;
    }
  }
  if (!navigator.geolocation) {
    onFail('unsupported');
    return null;
  }
  const id = navigator.geolocation.watchPosition(
    (p) => onMove({ lat: p.coords.latitude, lon: p.coords.longitude }),
    (err) => onFail(err.code === err.PERMISSION_DENIED ? 'denied' : 'timeout'),
    GEO_OPTS,
  );
  return { native: false, id };
}

export function clearWatch(h: WatchHandle | null): void {
  if (!h) return;
  if (h.native) void Geolocation.clearWatch({ id: h.id });
  else navigator.geolocation.clearWatch(h.id);
}
