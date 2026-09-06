/** IST is UTC+5:30 with no DST, so a fixed offset is safe. */
const IST_OFFSET_MIN = 330;

/** Today's absolute instant for a given IST wall-clock time. */
export function istToday(hh: number, mm: number): Date {
  const now = new Date();
  const shift = (IST_OFFSET_MIN + now.getTimezoneOffset()) * 60000;
  const ist = new Date(now.getTime() + shift);
  ist.setHours(hh, mm, 0, 0);
  return new Date(ist.getTime() - shift);
}

/** Trips are India-first: display clock times in IST regardless of device timezone. */
export function fmtIST(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

export function istHHMM(d: Date): string {
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Dev/demo helper: `?dep=HH:MM` (IST) pretends the trip leaves at that time
 * today, so daytime verdicts can be tested at night.
 */
export function departureOverride(): Date | null {
  const v = new URLSearchParams(window.location.search).get('dep');
  if (!v || !/^\d{1,2}:\d{2}$/.test(v)) return null;
  const [hh, mm] = v.split(':').map(Number);
  return istToday(hh, mm);
}
