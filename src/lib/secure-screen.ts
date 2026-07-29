/**
 * Screenshot / screen-recording protection.
 *
 * On Android (Capacitor) this sets FLAG_SECURE through the privacy-screen
 * plugin when available, which blocks screenshots and recording entirely.
 * On the web there is no API to block screenshots, so we fall back to
 * masking the app while it is backgrounded / in the recents preview.
 */

type PrivacyPlugin = { enable: () => Promise<void>; disable: () => Promise<void> }

function plugin(): PrivacyPlugin | null {
  const cap = (globalThis as any).Capacitor
  const p = cap?.Plugins?.PrivacyScreen
  return p && typeof p.enable === 'function' ? (p as PrivacyPlugin) : null
}

let active = false

function onVisibility() {
  if (typeof document === 'undefined') return
  const hidden = document.visibilityState === 'hidden'
  document.documentElement.classList.toggle('screen-masked', active && hidden)
}

export function setScreenSecure(secure: boolean) {
  if (typeof document === 'undefined' || active === secure) return
  active = secure

  const p = plugin()
  if (p) void (secure ? p.enable() : p.disable()).catch(() => {})

  if (secure) {
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onVisibility)
  } else {
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('blur', onVisibility)
  }
  onVisibility()
}
