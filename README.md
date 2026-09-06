# Sunny Side Down

Tells cab and auto riders in India which side of the car stays out of the sun
for their trip. Web prototype — the Play Store build comes later.

## Run

```bash
npm install
npm run dev
```

## How it works

- **Solar position**: `suncalc` on-device — no API. NOTE: suncalc 2.x returns
  degrees with compass azimuth, not the 1.x radians the DefinitelyTyped types
  describe (see `src/lib/sun.ts`).
- **Routing**: OSRM public demo server. Free, no key, **dev use only** — swap
  for Ola Maps / Mapbox / self-hosted OSRM before shipping. Free-flow durations
  are stretched by a crude peak-hour multiplier; the sun math only needs rough
  timing (sun azimuth moves ~15°/hour).
- **Search**: Photon (OSM) autocomplete. Free, no key, dev-quality Indian POI
  coverage — production wants Ola Maps/Google autocomplete.
- **Engine** (`src/lib/exposure.ts`): resamples the route into 60 slices,
  computes sun-vs-heading per slice, weights by elevation (the 12–55° band is
  what roasts you through a side window), and aggregates per seat. Exposure
  factors (tint, windshield, B-pillar) are labeled heuristics.
- **Live progress**: browser geolocation snapped to the route polyline
  ("Track my trip live" on the result screen). Foreground-only by design.

## Dev/demo tricks

- `?dep=HH:MM` (IST) pretends the trip departs at that time today — for seeing
  daytime verdicts at night: `http://localhost:5180/?dep=09:00`
- `npx tsx scripts/suntest.ts` sanity-checks the solar geometry against
  synthetic north/east routes at known times.

## Known prototype limitations

- Times display in IST regardless of device timezone (India-first assumption).
- No modeling of buildings/trees/clouds — deliberately out of scope.
- Commute reminders are stored but nothing schedules notifications (that's an
  app-build feature).
- The ad slot is a placeholder box.
