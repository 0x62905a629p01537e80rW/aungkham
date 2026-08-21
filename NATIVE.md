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

## Firebase native login

Google sign-in uses `@capacitor-firebase/authentication` on device (native
account picker) and falls back to the popup flow on the web — see
`src/components/auth-provider.tsx`.

Required native config:

1. In the Firebase console (`myan-photo-editor`) add an **Android app** with
   applicationId `com.nextlevelcreator.burmesetalk` and your debug + release SHA-1/SHA-256
   fingerprints, then download `google-services.json` into
   `android/app/google-services.json`.
2. For iOS add an **iOS app** with bundle id `com.nextlevelcreator.burmesetalk` and put
   `GoogleService-Info.plist` into `ios/App/App/`.
3. Android — in `android/variables.gradle` make sure
   `firebaseAuthenticationVersion` exists (the plugin adds it), and in
   `android/build.gradle` the `com.google.gms:google-services` classpath plus
   `apply plugin: 'com.google.gms.google-services'` at the bottom of
   `android/app/build.gradle`. `npx cap sync` normally does this for you.
4. iOS — add the reversed client id from `GoogleService-Info.plist` as a URL
   scheme in `ios/App/App/Info.plist`.

## Installed plugins

App, Filesystem, Share, Camera, StatusBar, SplashScreen, Preferences, Haptics,
Network, Browser, Keyboard, Firebase Authentication.
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
