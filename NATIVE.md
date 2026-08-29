# Native app (Capacitor) — offline build

The native app runs the editor fully offline: no Lovable server, no SSR, no CDN.
`bun run build:native` emits a plain static SPA into `dist/` (`dist/index.html`
+ relative `./assets/...`), which Capacitor copies into the Android/iOS shell.

## One-time setup (in VS Code)

```bash
npm install

# 1. Pull Google Fonts + every Lovable-hosted asset into public/ (needs internet, once)
npm run vendor:fonts
npm run vendor:assets            # optional arg: your published URL

# 2. Build the offline bundle
npm run build:native

# 3. Add the native platforms
npx cap add android
npx cap add ios                  # macOS + Xcode only

# 4. Copy the web build into them
npx cap sync
```

## Every time you change the app

```bash
npm run native:fast   # build + cap sync (no re-downloads, fast)
npm run open:android  # or: npm run open:ios
```

Then press Run in Android Studio / Xcode.

**Only re-download offline assets when you add new fonts/images or after a fresh clone:**

```bash
npm run native:full   # vendor fonts + assets -> build -> cap sync
```

The vendor scripts cache everything in `public/`, so running them again is instant.
Use `--force` if you ever want to force a re-download:

```bash
npm run vendor:fonts -- --force
npm run vendor:assets -- --force https://aungkham.lovable.app
```

## In-app purchase (Google Play Billing)

Pro is a **one-time (non-consumable) product** sold through Google Play using
`cordova-plugin-purchase`. There are no user accounts — the entitlement belongs
to the buyer's Google account and is restored via **Restore purchase**.

Setup in the Play Console:

1. Upload at least one build (internal testing is enough) for
   `com.nextlevelcreator.burmesetalk`.
2. **Monetize > Products > In-app products > Create product**.
3. Product ID: `pro_lifetime` (must match `PRO_PRODUCT_ID` in
   `src/lib/billing.ts` — change one or the other so they match), set a name,
   description and price, then **Activate**.
4. Add your test Google accounts under **Setup > License testing** so purchases
   are free while testing.

Notes:

- Billing only exists inside the Play-installed app. In the web preview Pro is
  locked and the UI points users to the Android app.
- The entitlement is cached locally, so Pro keeps working offline.

## Installed plugins

App, Filesystem, Share, Camera, StatusBar, SplashScreen, Preferences, Haptics,
Network, Browser, Keyboard, Purchase (Google Play Billing).
Helpers live in `src/lib/native.ts` (`isNative`, `saveToDevice`, `shareFile`,
`isOnline`, `tapHaptic`).

## Offline notes

- Fonts, images and template assets are served from `public/` inside the app.
- Store / template / sticker downloads still need internet; they fail
  gracefully and the bundled content keeps working offline.
- The Lovable-only bits (SSR entry, MCP routes, server functions) are not part
  of the native bundle at all.

## App identity & version

| Field | Value |
| --- | --- |
| Package / bundle id | `com.nextlevelcreator.burmesetalk` |
| App name | Myan Add Text |
| versionName | `4.1` |
| versionCode | `410000000` |

Set the version in `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.nextlevelcreator.burmesetalk"
    versionCode 410000000
    versionName "4.1"
}
```

iOS (`ios/App/App.xcodeproj` → General): Bundle Identifier
`com.nextlevelcreator.burmesetalk`, Version `4.1`, Build `410000000`.

If `android/` was already generated with the old id, delete the folder and run
`npx cap add android` again (or rename the package in Android Studio).
