/** Today's absolute instant for a device-local wall-clock time. */
export function todayAt(hh: number, mm: number): Date {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

/** Device locale and device timezone — no region is assumed. */
export function fmtTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * 24h "HH:MM" for <input type="time"> and stored commute times. Formatted by
 * hand rather than via toLocaleTimeString('en-GB', {hour12: false}), which can
 * emit "24:05" for 00:05 on some ICU builds and break both consumers.
 */
export function hhmm(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Dev helper: `?dep=HH:MM` (device-local) pretends the trip leaves at that time
 * today, so daytime verdicts can be checked at night. Browser only - the
 * Capacitor WebView loads without a query string, so this is inert on device.
 */
export function departureOverride(): Date | null {
  const v = new URLSearchParams(window.location.search).get('dep');
  if (!v || !/^\d{1,2}:\d{2}$/.test(v)) return null;
  const [hh, mm] = v.split(':').map(Number);
  return todayAt(hh, mm);
}
