/**
 * Google Play Billing — one-time (non-consumable) "Pro" purchase.
 *
 * Native only. On the web there is no Play Billing, so the store is reported
 * as unavailable and Pro stays locked (the UI tells the user to use the
 * Android app).
 *
 * The plugin (cordova-plugin-purchase) exposes `window.CdvPurchase` once the
 * native layer has loaded — nothing is imported at bundle time, so the web
 * build stays clean.
 */

/**
 * ⚠️ Product ID — must match the In-app product ID you create in
 * Google Play Console → Monetise → Products → In-app products.
 * Change this one line when your real product exists.
 */
export const PRO_PRODUCT_ID = 'pro_lifetime'

const OWNED_KEY = 'myan.pro.owned'

export type BillingState = {
  /** billing plugin initialised (or definitively unavailable) */
  ready: boolean
  /** true only inside the Android app with Play Billing present */
  available: boolean
  /** user owns the Pro product */
  isPro: boolean
  /** localised store price, e.g. "MMK 30,000" — empty until loaded */
  price: string
  /** a purchase / restore flow is running */
  busy: boolean
  error: string | null
}

let state: BillingState = {
  ready: false,
  available: false,
  isPro: readOwned(),
  price: '',
  busy: false,
  error: null,
}

const listeners = new Set<(s: BillingState) => void>()

function readOwned(): boolean {
  try {
    return localStorage.getItem(OWNED_KEY) === '1'
  } catch {
    return false
  }
}

function writeOwned(v: boolean) {
  try {
    if (v) localStorage.setItem(OWNED_KEY, '1')
    else localStorage.removeItem(OWNED_KEY)
  } catch {
    /* ignore */
  }
}

function set(patch: Partial<BillingState>) {
  state = { ...state, ...patch }
  if (patch.isPro !== undefined) writeOwned(patch.isPro)
  listeners.forEach((fn) => fn(state))
}

export function getBillingState(): BillingState {
  return state
}

export function subscribeBilling(fn: (s: BillingState) => void): () => void {
  listeners.add(fn)
  fn(state)
  return () => {
    listeners.delete(fn)
  }
}

/* ------------------------------------------------------------------ */
/* plugin plumbing                                                     */
/* ------------------------------------------------------------------ */

type AnyRec = Record<string, unknown>

// The plugin's own types aren't bundled (it's a Cordova plugin loaded at
// runtime), so this is intentionally loose.
type Cdv = {
  store: AnyRec & {
    register: (p: AnyRec[]) => void
    initialize: (platforms: unknown[]) => Promise<unknown>
    when: () => AnyRec
    get: (id: string, platform?: unknown) => AnyRec | undefined
    restorePurchases: () => Promise<unknown>
    verbosity?: number
    error?: (cb: (e: unknown) => void) => void
  }
  ProductType: AnyRec
  Platform: AnyRec
  LogLevel?: AnyRec
}

function cdv(): Cdv | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { CdvPurchase?: Cdv }).CdvPurchase ?? null
}

/** Wait for the Cordova plugin bridge to inject `CdvPurchase`. */
async function waitForPlugin(ms = 8000): Promise<Cdv | null> {
  const start = Date.now()
  for (;;) {
    const c = cdv()
    if (c) return c
    if (Date.now() - start > ms) return null
    await new Promise((r) => setTimeout(r, 150))
  }
}

function isOwnedTx(t: AnyRec): boolean {
  const products = (t.products as { id?: string }[] | undefined) ?? []
  return products.some((p) => p.id === PRO_PRODUCT_ID)
}

let started = false

/** Initialise Play Billing. Safe to call many times. */
export async function initBilling(): Promise<void> {
  if (started) return
  started = true

  const { isNative } = await import('@/lib/native')
  if (!isNative()) {
    set({ ready: true, available: false })
    return
  }

  const c = await waitForPlugin()
  if (!c) {
    set({ ready: true, available: false, error: 'Play Billing is not available on this device.' })
    return
  }

  try {
    const { store, ProductType, Platform } = c

    store.register([
      {
        id: PRO_PRODUCT_ID,
        type: ProductType.NON_CONSUMABLE,
        platform: Platform.GOOGLE_PLAY,
      },
    ])

    const when = store.when() as AnyRec & {
      productUpdated?: (cb: (p: AnyRec) => void) => AnyRec
      approved?: (cb: (t: AnyRec) => void) => AnyRec
      finished?: (cb: (t: AnyRec) => void) => AnyRec
      unverified?: (cb: (t: AnyRec) => void) => AnyRec
    }

    when.productUpdated?.(() => syncFromStore())
    // No server-side receipt validation: acknowledge the purchase locally so
    // Play does not auto-refund it after 3 days.
    when.approved?.((t) => {
      const fin = (t as AnyRec & { finish?: () => Promise<unknown> }).finish
      if (typeof fin === 'function') void fin.call(t)
      if (isOwnedTx(t)) set({ isPro: true, busy: false, error: null })
    })
    when.finished?.((t) => {
      if (isOwnedTx(t)) set({ isPro: true, busy: false, error: null })
    })

    store.error?.((e) => {
      const msg = (e as { message?: string } | undefined)?.message ?? String(e)
      // "cancelled" is a normal user action, not an error worth surfacing.
      if (/cancel/i.test(msg)) {
        set({ busy: false })
        return
      }
      console.log('[billing error]', e)
      set({ busy: false, error: msg })
    })

    await store.initialize([Platform.GOOGLE_PLAY])
    set({ ready: true, available: true })
    syncFromStore()
    // Play can take a moment to report products & existing entitlements.
    for (const delay of [1500, 4000, 8000]) setTimeout(syncFromStore, delay)
  } catch (err) {
    console.log('[billing init failed]', err)
    set({ ready: true, available: false, error: 'Could not connect to Google Play.' })
  }
}

function getProduct(): AnyRec | undefined {
  const c = cdv()
  if (!c) return undefined
  // v13: store.get(id) — platform arg is optional/ignored; try both.
  return (
    (c.store.get(PRO_PRODUCT_ID, c.Platform.GOOGLE_PLAY) as AnyRec | undefined) ??
    (c.store.get(PRO_PRODUCT_ID) as AnyRec | undefined)
  )
}

function syncFromStore() {
  const c = cdv()
  if (!c) return
  try {
    const product = getProduct() as
      | (AnyRec & {
          owned?: boolean
          canPurchase?: boolean
          pricing?: { price?: string }
          offers?: { pricingPhases?: { price?: string }[] }[]
        })
      | undefined
    if (!product) return
    const price =
      product.pricing?.price ?? product.offers?.[0]?.pricingPhases?.[0]?.price ?? state.price
    const owned = product.owned === true
    set({ price: price ?? '', isPro: owned || state.isPro })
  } catch (err) {
    console.log('[billing sync failed]', err)
  }
}

/** Launch the Google Play purchase sheet. */
export async function purchasePro(): Promise<void> {
  await initBilling()
  const c = cdv()
  if (!state.available || !c) {
    throw new Error('Google Play billing is only available in the Android app.')
  }
  set({ busy: true, error: null })
  try {
    const product = c.store.get(PRO_PRODUCT_ID, c.Platform.GOOGLE_PLAY) as
      | (AnyRec & { getOffer?: () => { order: () => Promise<unknown> } | undefined })
      | undefined
    const offer = product?.getOffer?.()
    if (!offer) throw new Error('Pro is not available in the store right now. Try again later.')
    const res = (await offer.order()) as { message?: string } | undefined
    if (res?.message) throw new Error(res.message)
    syncFromStore()
  } catch (err) {
    set({ busy: false })
    throw err instanceof Error ? err : new Error(String(err))
  }
  set({ busy: false })
}

/** Ask Google Play for previous purchases on this account. */
export async function restorePro(): Promise<boolean> {
  await initBilling()
  const c = cdv()
  if (!state.available || !c) {
    throw new Error('Google Play billing is only available in the Android app.')
  }
  set({ busy: true, error: null })
  try {
    await c.store.restorePurchases()
    await new Promise((r) => setTimeout(r, 800))
    syncFromStore()
  } finally {
    set({ busy: false })
  }
  return state.isPro
}
