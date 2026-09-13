import { computeExposure, verdict, type DriveSide } from '../src/lib/exposure';
import { sunPosition } from '../src/lib/sun';

const line = (lat: number, lon: number, dLat: number, dLon: number) =>
  Array.from({ length: 20 }, (_, i) => ({ lat: lat + i * dLat, lon: lon + i * dLon }));

// Straight 9km runs. Bengaluru (tropical) and London (high latitude).
const blrNorth = line(12.9, 77.6, 0.004, 0);
const blrEast = line(12.95, 77.55, 0, 0.004);
const lonNorth = line(51.5, -0.12, 0.004, 0);

/** Build an absolute instant from a local wall-clock hour in a given UTC offset. */
const at = (h: number, offsetHours: number, month = 8, day = 7) =>
  new Date(Date.UTC(2026, month, day, h - offsetHours, 0, 0));

interface Case {
  label: string;
  coords: { lat: number; lon: number }[];
  dep: Date;
  drive: DriveSide;
  expect: string;
}

const cases: Case[] = [
  {
    label: 'Bengaluru, N-bound, 9am  (sun E => right side sunny)',
    coords: blrNorth, dep: at(9, 5.5), drive: 'right',
    expect: 'rr hottest, verdict LEFT',
  },
  {
    label: 'Bengaluru, N-bound, 5pm  (sun W => left side sunny)',
    coords: blrNorth, dep: at(17, 5.5), drive: 'right',
    expect: 'rl hottest, verdict RIGHT',
  },
  {
    label: 'Bengaluru, E-bound, 9am  (sun ahead => windshield)',
    coords: blrEast, dep: at(9, 5.5), drive: 'right',
    expect: 'fp takes the windshield',
  },
  {
    label: 'Bengaluru, N-bound, 12:30 (sun overhead => roof problem)',
    coords: blrNorth, dep: at(12, 5.5), drive: 'right',
    expect: 'all seats low, no strong verdict',
  },
  {
    label: 'Bengaluru, N-bound, 8pm  (night)',
    coords: blrNorth, dep: at(20, 5.5), drive: 'right',
    expect: 'night, all zero',
  },
  // High latitude: the old tropical curve scored this near zero. Low winter
  // sun is the WORST case for side-window glare, so it must score high.
  {
    label: 'London, N-bound, Dec 1pm (low winter sun ~14 deg)',
    coords: lonNorth, dep: at(13, 0, 11, 1), drive: 'right',
    expect: 'strong exposure despite low sun',
  },
  // Same trip, same sun - only the driver moves. fp must swap sides.
  {
    label: 'London, N-bound, 9am, RIGHT-hand drive (fp on LEFT)',
    coords: lonNorth, dep: at(9, 1), drive: 'right',
    expect: 'sun E/right => fp (left) stays cool',
  },
  {
    label: 'London, N-bound, 9am, LEFT-hand drive  (fp on RIGHT)',
    coords: lonNorth, dep: at(9, 1), drive: 'left',
    expect: 'sun E/right => fp (right) gets cooked',
  },
];

for (const c of cases) {
  const sun = sunPosition(c.dep, c.coords[0]);
  const e = computeExposure(c.coords, 1800, c.dep, 'car', c.drive);
  const v = verdict(e, 'car', c.drive);
  console.log(c.label);
  console.log(`  expect: ${c.expect}`);
  console.log(
    `  sun az=${sun.azimuth.toFixed(0)} elev=${sun.elevation.toFixed(0)} | ` +
      `fp=${e.seats.fp.pct}% rl=${e.seats.rl.pct}% rr=${e.seats.rr.pct}% | ` +
      `best=${v.best} side=${v.side} night=${e.night}`,
  );
  console.log('');
}
