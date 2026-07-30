/**
 * Shieldz hosted checkout (no backend required).
 *
 * Flow:
 *  1. We create a `transactions` doc in Firestore with status `awaiting_payment`
 *     and a short reference code.
 *  2. We open the Shieldz hosted checkout page in the system browser
 *     (Capacitor Browser plugin when running natively, a new tab on the web),
 *     passing the reference + user email so the payment can be matched.
 *  3. When the user returns to the app — via the deep link, the browser being
 *     closed, or the app resuming — we flip the doc to `pending` so it shows up
 *     for manual verification and the app shows the "Pending" Pro state.
 */

export const SHIELDZ_CHECKOUT_URL = 'https://shieldz.cash/pay/pa90tNqDafpb4RhDw-GI'

/** Deep link the checkout can redirect back to (register in Capacitor config). */
export const SHIELDZ_RETURN_URL = 'myan://pay/return'

export function makeReference() {
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MYAN-${Date.now().toString(36).toUpperCase()}-${rnd}`
}

export function buildCheckoutUrl(opts: { reference: string; email?: string | null }) {
  const url = new URL(SHIELDZ_CHECKOUT_URL)
  url.searchParams.set('reference', opts.reference)
  if (opts.email) url.searchParams.set('email', opts.email)
  url.searchParams.set('redirect_url', SHIELDZ_RETURN_URL)
  return url.toString()
}

type Listener = { remove: () => void }
type BrowserPlugin = {
  open: (o: { url: string }) => Promise<void>
  addListener: (e: string, cb: () => void) => Promise<Listener> | Listener
}
type AppPlugin = {
  addListener: (e: string, cb: (data: any) => void) => Promise<Listener> | Listener
}

function cap() {
  return (globalThis as any).Capacitor
}

function isNative() {
  return !!cap()?.isNativePlatform?.()
}

/** Opens the hosted checkout. Uses the native in-app browser when available. */
export async function openShieldzCheckout(url: string, onClosed?: () => void) {
  const browser: BrowserPlugin | undefined = cap()?.Plugins?.Browser
  if (isNative() && browser && typeof browser.open === 'function') {
    try {
      const handle = await browser.addListener('browserFinished', () => {
        handle.remove()
        onClosed?.()
      })
      await browser.open({ url })
      return
    } catch (err) {
      console.log('[shieldz] capacitor browser unavailable', err)
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Fires `cb` when the user comes back to the app: deep-link redirect,
 * tab refocus, or app resume.
 */
export function onReturnFromCheckout(cb: () => void) {
  const cleanups: Array<() => void> = []

  const onVisible = () => {
    if (document.visibilityState === 'visible') cb()
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', cb)
  cleanups.push(() => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', cb)
  })

  const app: AppPlugin | undefined = cap()?.Plugins?.App
  if (isNative() && app && typeof app.addListener === 'function') {
    ;(async () => {
      try {
        const urlSub = await app.addListener('appUrlOpen', (e: { url?: string }) => {
          if (e?.url?.startsWith('myan://pay')) cb()
        })
        const stateSub = await app.addListener('appStateChange', (s: { isActive?: boolean }) => {
          if (s?.isActive) cb()
        })
        cleanups.push(() => {
          urlSub.remove()
          stateSub.remove()
        })
      } catch (err) {
        console.log('[shieldz] capacitor app listeners unavailable', err)
      }
    })()
  }

  return () => cleanups.forEach((fn) => fn())
}
