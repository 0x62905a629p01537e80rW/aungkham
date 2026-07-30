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

function isNative() {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()
}

/** Opens the hosted checkout. Resolves once the in-app browser is closed (native). */
export async function openShieldzCheckout(url: string, onClosed?: () => void) {
  if (isNative()) {
    try {
      const { Browser } = await import('@capacitor/browser')
      const handle = await Browser.addListener('browserFinished', () => {
        handle.remove()
        onClosed?.()
      })
      await Browser.open({ url, presentationStyle: 'popover' })
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

  if (isNative()) {
    ;(async () => {
      try {
        const { App } = await import('@capacitor/app')
        const urlSub = await App.addListener('appUrlOpen', (e) => {
          if (e.url?.startsWith('myan://pay')) cb()
        })
        const stateSub = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) cb()
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
