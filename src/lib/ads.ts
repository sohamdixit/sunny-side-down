import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

/**
 * Google's documented TEST ad unit. Safe to ship in development builds; showing
 * real ads to yourself gets an AdMob account suspended. Replace via
 * VITE_ADMOB_BANNER_ID before a production release - and note the App ID in
 * AndroidManifest.xml must be swapped at the same time.
 */
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const BANNER_ID = import.meta.env.VITE_ADMOB_BANNER_ID || TEST_BANNER;

const isNative = Capacitor.isNativePlatform();
let ready: Promise<boolean> | null = null;

/** Initialised once, lazily; resolves false when ads simply aren't available. */
function ensureReady(): Promise<boolean> {
  if (!isNative) return Promise.resolve(false);
  ready ??= AdMob.initialize()
    .then(() => true)
    .catch((e) => {
      console.error('AdMob init failed:', e);
      return false;
    });
  return ready;
}

/**
 * The banner is a NATIVE view overlaying the WebView, not a DOM node, so the
 * page must leave room for it - see `--ad-gap` in index.css.
 */
export async function showBanner(): Promise<void> {
  if (!(await ensureReady())) return;
  try {
    await AdMob.showBanner({
      adId: BANNER_ID,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    });
  } catch (e) {
    // No fill, no network, misconfigured unit: the app must not care.
    console.error('AdMob banner failed:', e);
  }
}

export async function hideBanner(): Promise<void> {
  if (!isNative) return;
  try {
    await AdMob.removeBanner();
  } catch {
    // Nothing showing - fine.
  }
}

/** True when a native banner may appear, so the UI can reserve space for it. */
export const bannerPossible = isNative;
