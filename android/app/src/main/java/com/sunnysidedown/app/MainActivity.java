package com.sunnysidedown.app;

import android.os.Bundle;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.BridgeActivity;

/**
 * targetSdk 35+ forces the window edge-to-edge, so the WebView draws underneath
 * the status bar and the navigation bar. Left alone, the top of the page sits
 * under the clock and the back button becomes unreachable.
 *
 * CSS env(safe-area-inset-*) does not solve this on Android: it reports the
 * display cutout, not the status bar, so a phone with a status bar but no notch
 * still reports zero. Instead the real inset values are handed to the page as
 * CSS custom properties, which lets the page keep painting its background
 * full-bleed (so the theme still runs under the bars) while insetting content.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final WebView webView = getBridge().getWebView();

        // The page themes itself (it goes dark at night based on the sun, not on
        // the system setting), so the platform must not also darken it. Skins
        // like MIUI apply forced dark aggressively, and darkening an already-dark
        // page a second time leaves it unreadable - black on black.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.getSettings(), false);
        } else if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            // Pre-API 33 path - which is the Android 10 era where this bites.
            WebSettingsCompat.setForceDark(webView.getSettings(), WebSettingsCompat.FORCE_DARK_OFF);
        }

        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            float density = getResources().getDisplayMetrics().density;
            final int top = Math.round(bars.top / density);
            final int bottom = Math.round(bars.bottom / density);

            view.post(() -> webView.evaluateJavascript(
                    "document.documentElement.style.setProperty('--safe-top','" + top + "px');"
                  + "document.documentElement.style.setProperty('--safe-bottom','" + bottom + "px');",
                    null));

            return windowInsets;
        });
    }
}
