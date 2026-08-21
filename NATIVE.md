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
npm run native      # vendor fonts+assets -> build -> cap sync
npm run open:android    # or: npm run open:ios
```

Then press Run in Android Studio / Xcode.

## Firebase native login

Google sign-in uses `@capacitor-firebase/authentication` on device (native
account picker) and falls back to the popup flow on the web — see
`src/components/auth-provider.tsx`.

Required native config:

1. In the Firebase console (`myan-photo-editor`) add an **Android app** with
   applicationId `com.myan.photoeditor` and your debug + release SHA-1/SHA-256
   fingerprints, then download `google-services.json` into
   `android/app/google-services.json`.
2. For iOS add an **iOS app** with bundle id `com.myan.photoeditor` and put
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
