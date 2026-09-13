# Working on Sunny Side Down

Things that cost time to discover and will cost it again if forgotten.

## The sun maths

`suncalc` 2.x returns **degrees**, with azimuth as a compass bearing — but the
DefinitelyTyped types still describe the 1.x API (radians, measured from south).
Convert them and you get nonsense: elevations of 4000°, night at noon. See the
note in `src/lib/sun.ts`.

Two knobs decide every verdict:

- **`elevationWeight`** — `cos(elevation)`, tapered below 5° where terrain and
  buildings usually block the sun anyway. Low sun matters most through a side
  window; overhead sun is a roof problem. An earlier banded version was tuned
  for tropical sun and scored a blinding London winter morning near zero.
- **`DriveSide`** — which side the *driver* sits on, which decides where the
  front passenger sits. Get it wrong and the app recommends the driver's seat.
  Guessed from the device timezone, flippable in one tap, persisted.

`npx tsx scripts/suntest.ts` checks both against synthetic routes at known times,
including a high-latitude winter case and both drive configurations. Run it after
touching anything in `exposure.ts`.

## Capacitor gotchas

**Geolocation.** Capacitor does *not* patch `navigator.geolocation`; calling the
browser API directly fails silently inside the native WebView. Everything goes
through `src/lib/location.ts`, which returns a typed result rather than `null` —
collapsing every failure into `null` is what once let a silent emulator timeout
look like a working app sitting on the wrong continent.

**Safe areas.** `targetSdk 35+` forces the window edge-to-edge, so the WebView
draws under the status bar. CSS `env(safe-area-inset-*)` does *not* fix this on
Android — it reports the display cutout, not the status bar, so a phone with a
status bar and no notch reports zero. `MainActivity` reads the real insets and
passes them to the page as `--safe-top` / `--safe-bottom`.

**Forced dark.** The page themes itself based on the sun, not the system setting.
Skins like MIUI will darken a WebView on top of that, and darkening an already
dark page leaves it unreadable. `MainActivity` opts out, and the page declares
`color-scheme`. Don't remove either.

**Old WebViews.** Vite targets `chrome77` because Android 10 shipped roughly
that, and a syntax error renders nothing at all — a black screen, not a degraded
one. `100dvh` has a `100vh` fallback for the same reason. WebView updates through
the Play Store independently of the OS, so most devices are far newer, but not
all of them.

## Storage

Keys are versioned (`ssd.commutes.v2`). Bump the version when the *meaning* of
stored data changes, not just its shape — v1 held `mode: 'cab'` (now `'car'`,
and a stale value would silently be scored as an auto-rickshaw) and times that
meant IST rather than device-local. Dropping stale records beats silently
misreading them.

## Building and releasing

Gradle runs on **JDK 21**, not the JDK 25 that Android Studio bundles for its own
use — on 25 it fails with *"unsupported class file major version 69"*. The path
is pinned in `android/gradle.properties` and is machine-specific.

After any web change, `npm run build && npx cap sync android`. Capacitor serves a
copied snapshot of `dist/`, so the device won't see edits otherwise.

For a release:

1. Bump `versionCode` in `android/app/build.gradle`. Play burns a version
   permanently once uploaded — it can never be reused, and a duplicate is
   rejected. `versionName` only changes when users should see a different label.
2. `./gradlew bundleRelease`
3. Upload `app/build/outputs/bundle/release/app-release.aab` to a track.

Signing reads from `android/keystore.properties`, which is gitignored along with
`*.jks`. Without it the release build is simply unsigned rather than failing, so
a fresh clone can still build debug.

## Things deliberately not done

- **No modelling of buildings, trees or cloud.** A 10x complexity jump for
  accuracy nobody can verify.
- **No ads.** The integration exists in history if it's ever worth the Data
  safety paperwork; the store listing and privacy policy both say there are none,
  so restoring it means updating those in the same change.
- **The OSRM fallback's peak-hour multiplier** is still tuned for Indian metros
  and applies worldwide. Moot when a Mapbox token is set.
