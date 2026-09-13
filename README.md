# Sunny Side Down

Tells passengers which side of a vehicle stays out of the sun for their trip.
Works anywhere: sun position, drive side and clock times all follow the device
and the trip's actual location.

## Run

```bash
npm install
npm run dev
```

## How it works

- **Solar position**: `suncalc` on-device — no API. NOTE: suncalc 2.x returns
  degrees with compass azimuth, not the 1.x radians the DefinitelyTyped types
  describe (see `src/lib/sun.ts`).
- **Routing**: **Mapbox Directions** (`driving-traffic` profile) when
  `VITE_MAPBOX_TOKEN` is set — traffic-aware durations, no fudge factor.
  Without a token it falls back to the **OSRM public demo server**, which is
  keyless but **dev only** (its usage policy forbids production traffic) and
  returns free-flow durations stretched by a crude peak-hour multiplier.
  Mapbox errors are not silently retried against OSRM — that would hide an
  expired token or a blown quota behind quietly worse data. Copy `.env.example`
  to `.env` and paste a public `pk.` token to enable Mapbox.
- **Search**: Photon (OSM) autocomplete. Free, no key, global. The `near`
  bias is optional so the *origin* search works before we know where you are.
  Autocomplete fires per keystroke, so it is the cost/quality risk to watch.
- **Engine** (`src/lib/exposure.ts`): resamples the route into 60 slices,
  computes sun-vs-heading per slice, weights by elevation, and aggregates per
  seat. The elevation weight is `cos(elevation)` with a taper below 5° — low
  sun comes in horizontally through a side window, overhead sun is a roof
  problem. That curve holds at any latitude; the earlier banded version was
  tuned for tropical sun and scored low winter sun near zero.
- **Drive side** (`DriveSide` in `exposure.ts`): which side the *driver* sits
  on decides where the front passenger sits, so it changes the verdict — get it
  wrong and the app recommends the driver's seat. Guessed from the device
  timezone, overridable with one tap on the result screen, persisted.
  Exposure factors (tint, windshield, B-pillar) are labeled heuristics.
- **Live progress**: browser geolocation snapped to the route polyline
  ("Track my trip live" on the result screen). Foreground-only by design.

## Dev/demo tricks

- `?dep=HH:MM` (device-local) pretends the trip departs at that time today —
  for seeing daytime verdicts at night: `http://localhost:5180/?dep=09:00`.
  Browser only: the Capacitor WebView loads without a query string.
- App icon: edit `assets/icon-source.svg`, then
  `node scripts/make_icon.mjs && npx @capacitor/assets generate --android`.
  The script rasterises the SVG (via sharp — macOS has no SVG CLI by default),
  strips the background plate for the Android adaptive foreground and scales it
  into the mask-safe zone, and writes `assets/icon-legibility.png` so the result
  can be judged at real launcher sizes rather than at 1024px.
- `npx tsx scripts/suntest.ts` sanity-checks the solar geometry against
  synthetic north/east routes at known times.

## Known prototype limitations

- No modeling of buildings/trees/clouds — deliberately out of scope.
- The OSRM fallback's peak-hour multiplier (1.6x at 08–11/17–21) is still tuned
  for Indian metros and applies worldwide. Moot when a Mapbox token is set,
  since `driving-traffic` gives real durations.
- Commute reminders are stored but nothing schedules notifications (that's an
  app-build feature).
- The ad slot is a placeholder box.

## Android app (Capacitor)

The web app is wrapped with Capacitor — same codebase, real `.aab`/`.apk` output.
`appId` is `com.sunnysidedown.app` (in `capacitor.config.ts`). **Change it before
the first Play upload if you want a different one — it is permanent once published.**

```bash
npm run build && npx cap sync android      # after any web change
cd android && ./gradlew assembleDebug      # debug APK
npx cap open android                       # open in Android Studio
```

Gradle is pinned to JDK 21 via `org.gradle.java.home` in `android/gradle.properties`
because Gradle cannot run on JDK 25 ("unsupported class file major version 69") —
Android Studio's bundled JDK 25 is for the IDE, not for Gradle. That path is
machine-specific; change it on another machine.

Storage keys are versioned (`ssd.commutes.v2`): v1 records held `mode: 'cab'`
and IST-relative `departAt`, both of which would now be silently misread.

Location uses `src/lib/location.ts`, which routes to the Capacitor Geolocation
plugin on device and `navigator.geolocation` on web. It returns a typed
`GeoResult` rather than null, because collapsing every failure into null is what
let a silent emulator timeout look like a working app sitting on a default city. Capacitor does **not** patch
`navigator.geolocation`, so calling the browser API directly fails silently inside
the native WebView. Only foreground location is declared —
`ACCESS_BACKGROUND_LOCATION` is deliberately absent to avoid Play's special
location review.

### Still needed before publishing

- Release signing (Play App Signing + an upload keystore); `assembleDebug` output is not publishable
- `./gradlew bundleRelease` to produce the `.aab`
- Splash screen (the icon is done — see `assets/icon-source.svg`)
- Privacy policy at a public URL (mandatory — the app uses location)
- Play Console: data safety form, content rating, store listing assets
