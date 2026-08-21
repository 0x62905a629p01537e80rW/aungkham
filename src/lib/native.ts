/**
 * Capacitor bridge helpers. Everything here is safe to import on the web —
 * the plugins are only loaded when running inside the native shell.
 */

export function isNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return cap?.isNativePlatform?.() === true
}

/** Status bar, splash screen, hardware back button. Called once at boot. */
export async function initNativeShell() {
  if (!isNative()) return
  document.documentElement.classList.add('is-native')
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    const dark = document.documentElement.classList.contains('dark')
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
    // Keep the webview below the status bar, and record its height so CSS
    // can add the matching inset on every page.
    await StatusBar.setOverlaysWebView({ overlay: false })
    try {
      await StatusBar.setBackgroundColor({ color: dark ? '#070a0d' : '#ffffff' })
    } catch {
      /* iOS has no background colour API */
    }
    const info = await StatusBar.getInfo()
    const h = (info as unknown as { height?: number }).height
    if (typeof h === 'number' && h > 0) {
      document.documentElement.style.setProperty('--status-bar-h', `${h}px`)
    }
  } catch {
    /* status bar unavailable */
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    /* no splash */
  }
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else App.exitApp()
    })
  } catch {
    /* no app plugin */
  }
}

/** Save a data URL / blob URL into the device gallery-visible Documents dir. */
export async function saveToDevice(dataUrl: string, fileName: string): Promise<string | null> {
  if (!isNative()) return null
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const res = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  })
  return res.uri
}

/** Native share sheet for an already-saved file URI. */
export async function shareFile(uri: string, title = 'Share image') {
  if (!isNative()) return
  const { Share } = await import('@capacitor/share')
  await Share.share({ title, url: uri })
}

/** Native connectivity check (falls back to navigator.onLine on web). */
export async function isOnline(): Promise<boolean> {
  if (!isNative()) return typeof navigator === 'undefined' ? true : navigator.onLine
  try {
    const { Network } = await import('@capacitor/network')
    return (await Network.getStatus()).connected
  } catch {
    return navigator.onLine
  }
}

/** Light haptic tap for tool buttons. */
export async function tapHaptic() {
  if (!isNative()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    /* ignore */
  }
}

/** Re-apply status bar colours after a light/dark theme change. */
export async function syncStatusBarTheme(dark: boolean) {
  if (!isNative()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
    try {
      await StatusBar.setBackgroundColor({ color: dark ? '#070a0d' : '#ffffff' })
    } catch {
      /* iOS */
    }
  } catch {
    /* no plugin */
  }
}
