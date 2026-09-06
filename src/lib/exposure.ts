import { sampleRoute, type LatLng } from './geo';
import { sunPosition } from './sun';

export type SeatId = 'fl' | 'rl' | 'rr';
export type Mode = 'cab' | 'auto';

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
 * Elevation weighting for side-window sun. Heuristics, not physics:
 * below ~3° the sun is buried behind buildings; 12-55° is the band that
 * actually roasts you through a side window; near-overhead sun is a roof
 * problem no seat choice fixes.
 */
function elevationWeight(elev: number): number {
  if (elev <= 3) return 0;
  if (elev < 12) return (elev - 3) / 9;
  if (elev <= 55) return 1;
  if (elev <= 70) return 1 - ((elev - 55) / 15) * 0.75;
  return 0.1;
}

const SLICES = 60;

export function computeExposure(
  coords: LatLng[],
  durationSec: number,
  departure: Date,
  mode: Mode,
): TripExposure {
  const samples = sampleRoute(coords, SLICES);
  const sliceDur = durationSec / SLICES;
  const slices: Slice[] = [];
  let anySun = false;

  const totals: Record<SeatId, number> = { fl: 0, rl: 0, rr: 0 };

  for (const s of samples) {
    const t = new Date(departure.getTime() + s.frac * durationSec * 1000);
    const sun = sunPosition(t, s.point);
    const w = elevationWeight(sun.elevation);
    const rel = (sun.azimuth - s.heading + 360) % 360;

    let side: Slice['side'] = 'none';
    const intensity: Record<SeatId, number> = { fl: 0, rl: 0, rr: 0 };

    if (w > 0) {
      anySun = true;
      // Relative angle: 0 = dead ahead, 90 = off the right window,
      // 180 = behind, 270 = off the left window.
      if (rel > 20 && rel < 160) side = 'R';
      else if (rel > 200 && rel < 340) side = 'L';
      else if (rel >= 340 || rel <= 20) side = 'ahead';
      else side = 'behind';

      // Cab: rear side windows are often tinted / behind the B-pillar (0.9);
      // windshield is never tinted, so sun-ahead hits front seats hard.
      // Auto-rickshaw: open sides, but a roof and a low windscreen - side
      // sun hits full, ahead/behind matter little.
      const sideFactorRear = mode === 'cab' ? 0.9 : 1;
      const aheadFront = mode === 'cab' ? 0.8 : 0.3;
      const aheadRear = mode === 'cab' ? 0.15 : 0.1;
      const behindRear = mode === 'cab' ? 0.6 : 0.1;

      if (side === 'L') {
        intensity.fl = w;
        intensity.rl = w * sideFactorRear;
      } else if (side === 'R') {
        intensity.rr = w * sideFactorRear;
      } else if (side === 'ahead') {
        intensity.fl = w * aheadFront;
        intensity.rl = w * aheadRear;
        intensity.rr = w * aheadRear;
      } else {
        intensity.rl = w * behindRear;
        intensity.rr = w * behindRear;
      }
    }

    for (const id of ['fl', 'rl', 'rr'] as SeatId[]) {
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
    (['fl', 'rl', 'rr'] as SeatId[]).map((id) => [
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

/** Rear seats are the real choice in a cab; auto has no front passenger seat. */
export function verdict(exp: TripExposure, mode: Mode): Verdict {
  const rl = exp.seats.rl.sunSeconds;
  const rr = exp.seats.rr.sunSeconds;
  const margin = 0.08 * exp.durationSec;
  if (exp.night || Math.abs(rl - rr) < margin) {
    return { best: 'either', side: 'either' };
  }
  const best: SeatId = rl < rr ? 'rl' : 'rr';
  if (mode === 'cab' && exp.seats.fl.sunSeconds < exp.seats[best].sunSeconds - margin) {
    return { best: 'fl', side: 'left' };
  }
  return { best, side: best === 'rl' ? 'left' : 'right' };
}
