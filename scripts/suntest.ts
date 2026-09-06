import { computeExposure, verdict } from '/Users/soham.dixit/personal/projects/sunny-side-down/src/lib/exposure';
import { sunPosition } from '/Users/soham.dixit/personal/projects/sunny-side-down/src/lib/sun';

// Straight route heading due NORTH through Bengaluru, ~9 km
const north = Array.from({ length: 20 }, (_, i) => ({ lat: 12.90 + i * 0.004, lon: 77.60 }));
// Straight route heading due EAST
const east = Array.from({ length: 20 }, (_, i) => ({ lat: 12.95, lon: 77.55 + i * 0.004 }));

const at = (h: number, m = 0) => { const d = new Date(Date.UTC(2026, 8, 6, h - 6, m + 30, 0)); return d; };

const cases: [string, typeof north, Date][] = [
  ['NORTH @ 9am (sun E => right side sunny, verdict LEFT)', north, at(9)],
  ['NORTH @ 5pm (sun W => left side sunny, verdict RIGHT)', north, at(17)],
  ['EAST  @ 9am (sun ahead => windshield, front worst)', east, at(9)],
  ['NORTH @ 12:30pm (sun high => weak side sun)', north, at(12, 30)],
  ['NORTH @ 8pm (night => all zero)', north, at(20)],
];

for (const [label, coords, dep] of cases) {
  const sun = sunPosition(dep, coords[0]);
  const e = computeExposure(coords, 1800, dep, 'cab');
  const v = verdict(e, 'cab');
  console.log(label);
  console.log(`  sun az=${sun.azimuth.toFixed(0)} elev=${sun.elevation.toFixed(0)} | fl=${e.seats.fl.pct}% rl=${e.seats.rl.pct}% rr=${e.seats.rr.pct}% | best=${v.best} side=${v.side} night=${e.night}`);
}
