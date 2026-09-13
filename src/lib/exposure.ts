import { sampleRoute, type LatLng } from './geo';
import { sunPosition } from './sun';

/** Seats a passenger may actually choose. `fp` = front passenger. */
export type SeatId = 'fp' | 'rl' | 'rr';
export type Mode = 'car' | 'auto';
/** Which side the DRIVER sits on. Decides where the front passenger sits. */
export type DriveSide = 'left' | 'right';

export const MODE_LABELS: Record<Mode, string> = {
  car: 'Car',
  auto: 'Auto',
};

/** The physical side of the vehicle the front passenger sits on. */
export function frontPassengerSide(driveSide: DriveSide): 'L' | 'R' {
  return driveSide === 'right' ? 'L' : 'R';
}

/** Right-hand-drive regions, best-effort from the device timezone. */
const RHD_ZONES = new Set([
  'Europe/London', 'Europe/Dublin', 'Europe/Isle_of_Man', 'Europe/Jersey',
  'Europe/Guernsey', 'Europe/Malta',
  'Asia/Kolkata', 'Asia/Calcutta', 'Asia/Colombo', 'Asia/Karachi', 'Asia/Dhaka',
  'Asia/Kathmandu', 'Asia/Thimphu', 'Asia/Tokyo', 'Asia/Hong_Kong', 'Asia/Macau',
  'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Asia/Jakarta', 'Asia/Makassar',
  'Asia/Bangkok', 'Asia/Brunei', 'Asia/Nicosia',
  'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Port_Moresby',
  'Africa/Johannesburg', 'Africa/Nairobi', 'Africa/Kampala', 'Africa/Dar_es_Salaam',
  'Africa/Harare', 'Africa/Lusaka', 'Africa/Maputo', 'Africa/Gaborone',
  'Africa/Windhoek', 'Africa/Maseru', 'Africa/Mbabane', 'Africa/Kigali',
  'America/Guyana', 'America/Paramaribo', 'America/Port_of_Spain',
  'America/Jamaica', 'America/Barbados', 'Indian/Mauritius',
]);

/**
 * Guess from the device timezone; left-hand drive is the world majority, so
 * that is the fallback. Always overridable - the UI exposes a one-tap flip.
 */
export function detectDriveSide(): DriveSide {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith('Australia/') || RHD_ZONES.has(tz)) return 'right';
  } catch {
    // Intl unavailable - fall through to the majority default.
  }
  return 'left';
}

export interface Slice {
  /** Start of slice as offset from departure, seconds. */
  atSec: number;
  /** Which side of the car the sun is on for this slice. */
  side: 'L' | 'R' | 'ahead' | 'behind' | 'none';
  /** Per-seat exposure intensity 0-1 for this slice. */
  intensity: Record<SeatId, number>;
}

export interface SeatSummary {
  sunSeconds: number;
  pct: number;
}

export interface TripExposure {
  durationSec: number;
  departure: Date;
  slices: Slice[];
  seats: Record<SeatId, SeatSummary>;
  /** True when the sun is below the horizon for the whole trip. */
  night: boolean;
  /** Seconds into the trip when the sun first switches between L and R, or null. */
  flipAtSec: number | null;
}

/**
 * How much a given sun elevation matters through a SIDE window.
 * Low sun comes in horizontally and lands on you; overhead sun is a roof
 * problem no seat choice fixes - that is cos(elevation). The taper below 5
 * degrees is the only fudge: sun that low is usually behind buildings or
 * terrain. Works at any latitude, which the old tropical banding did not.
 */
function elevationWeight(elev: number): number {
  if (elev <= 0) return 0;
  const sideWindow = Math.cos((elev * Math.PI) / 180);
  const horizonTaper = elev < 5 ? elev / 5 : 1;
  return sideWindow * horizonTaper;
}

const SLICES = 60;

export function computeExposure(
  coords: LatLng[],
  durationSec: number,
  departure: Date,
  mode: Mode,
  driveSide: DriveSide,
): TripExposure {
  const samples = sampleRoute(coords, SLICES);
  const sliceDur = durationSec / SLICES;
  const slices: Slice[] = [];
  const fpSide = frontPassengerSide(driveSide);
  let anySun = false;

  const totals: Record<SeatId, number> = { fp: 0, rl: 0, rr: 0 };

  for (const s of samples) {
    const t = new Date(departure.getTime() + s.frac * durationSec * 1000);
    const sun = sunPosition(t, s.point);
    const w = elevationWeight(sun.elevation);
    const rel = (sun.azimuth - s.heading + 360) % 360;

    let side: Slice['side'] = 'none';
    const intensity: Record<SeatId, number> = { fp: 0, rl: 0, rr: 0 };

    if (sun.elevation >= 0) anySun = true;

    if (w > 0) {
      // Relative angle: 0 = dead ahead, 90 = off the right window,
      // 180 = behind, 270 = off the left window.
      if (rel > 20 && rel < 160) side = 'R';
      else if (rel > 200 && rel < 340) side = 'L';
      else if (rel >= 340 || rel <= 20) side = 'ahead';
      else side = 'behind';

      // Car: rear side windows are often tinted / behind the B-pillar (0.9);
      // windshield is never tinted, so sun-ahead hits front seats hard.
      // Auto-rickshaw: open sides, but a roof and a low windscreen - side
      // sun hits full, ahead/behind matter little.
      const sideFactorRear = mode === 'car' ? 0.9 : 1;
      const aheadFront = mode === 'car' ? 0.8 : 0.3;
      const aheadRear = mode === 'car' ? 0.15 : 0.1;
      const behindRear = mode === 'car' ? 0.6 : 0.1;

      if (side === 'L') {
        if (fpSide === 'L') intensity.fp = w;
        intensity.rl = w * sideFactorRear;
      } else if (side === 'R') {
        if (fpSide === 'R') intensity.fp = w;
        intensity.rr = w * sideFactorRear;
      } else if (side === 'ahead') {
        // The windshield faces forward whichever side you sit on.
        intensity.fp = w * aheadFront;
        intensity.rl = w * aheadRear;
        intensity.rr = w * aheadRear;
      } else {
        // Sun behind: front seats are shielded by their own seat backs.
        intensity.rl = w * behindRear;
        intensity.rr = w * behindRear;
      }
    }

    for (const id of ['fp', 'rl', 'rr'] as SeatId[]) {
      totals[id] += intensity[id] * sliceDur;
    }
    slices.push({ atSec: (s.frac - 0.5 / SLICES) * durationSec, side, intensity });
  }

  let flipAtSec: number | null = null;
  let lastLR: 'L' | 'R' | null = null;
  for (const sl of slices) {
    if (sl.side === 'L' || sl.side === 'R') {
      if (lastLR && sl.side !== lastLR) {
        flipAtSec = sl.atSec;
        break;
      }
      lastLR = sl.side;
    }
  }

  const seats = Object.fromEntries(
    (['fp', 'rl', 'rr'] as SeatId[]).map((id) => [
      id,
      {
        sunSeconds: totals[id],
        pct: durationSec > 0 ? Math.round((totals[id] / durationSec) * 100) : 0,
      },
    ]),
  ) as Record<SeatId, SeatSummary>;

  return {
    durationSec,
    departure,
    slices,
    seats,
    night: !anySun,
    flipAtSec,
  };
}

export interface Verdict {
  best: SeatId | 'either';
  side: 'left' | 'right' | 'either';
}

/** Rear seats are the real choice in a car; an auto has no front passenger seat. */
export function verdict(exp: TripExposure, mode: Mode, driveSide: DriveSide): Verdict {
  const rl = exp.seats.rl.sunSeconds;
  const rr = exp.seats.rr.sunSeconds;
  const margin = 0.08 * exp.durationSec;
  if (exp.night || Math.abs(rl - rr) < margin) {
    return { best: 'either', side: 'either' };
  }
  const best: SeatId = rl < rr ? 'rl' : 'rr';
  if (mode === 'car' && exp.seats.fp.sunSeconds < exp.seats[best].sunSeconds - margin) {
    return { best: 'fp', side: frontPassengerSide(driveSide) === 'L' ? 'left' : 'right' };
  }
  return { best, side: best === 'rl' ? 'left' : 'right' };
}
