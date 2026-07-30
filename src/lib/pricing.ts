import { useEffect, useState } from 'react'

export type Pricing = {
  /** e.g. "30,000 MMK" */
  priceMmk: string
  /** e.g. "60,000 MMK" — empty when not configured */
  originalMmk: string
  /** e.g. "8.5 USD" — empty when not configured */
  priceUsd: string
  /** e.g. "50% OFF" — empty when not configured */
  promoLabel: string
}

export const DEFAULT_PRICING: Pricing = {
  priceMmk: '30,000 MMK',
  originalMmk: '60,000 MMK',
  priceUsd: '8.5 USD',
  promoLabel: '50% OFF',
}

function formatMmk(raw?: string): string {
  if (!raw) return ''
  const digits = String(raw).replace(/[^\d]/g, '')
  if (!digits) return String(raw).trim()
  return `${Number(digits).toLocaleString('en-US')} MMK`
}

function formatUsd(raw?: string): string {
  if (!raw) return ''
  const num = String(raw).replace(/[^\d.]/g, '')
  if (!num) return String(raw).trim()
  return `${num} USD`
}

function formatPromo(raw?: string): string {
  if (!raw) return ''
  const digits = String(raw).replace(/[^\d]/g, '')
  if (!digits) return String(raw).trim().toUpperCase()
  return `${digits}% OFF`
}

export function pricingFromDoc(d: Record<string, unknown>): Pricing {
  const get = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : undefined)
  return {
    priceMmk: formatMmk(get('price_mmk')) || DEFAULT_PRICING.priceMmk,
    originalMmk: formatMmk(get('original_price')),
    priceUsd: formatUsd(get('usdt_price')),
    promoLabel: formatPromo(get('promo_percent')),
  }
}

let cache: Pricing | null = null
let inflight: Promise<Pricing> | null = null

export async function fetchPricing(): Promise<Pricing> {
  if (cache) return cache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const { getDb } = await import('@/lib/firebase')
      const { collection, getDocs } = await import('firebase/firestore')
      const snap = await getDocs(collection(getDb(), 'payment_settings'))
      if (snap.empty) return DEFAULT_PRICING
      const p = pricingFromDoc((snap.docs[0].data() ?? {}) as Record<string, unknown>)
      cache = p
      return p
    } catch (err) {
      console.log('[pricing fetch failed]', err)
      return DEFAULT_PRICING
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/** Live pricing from Firestore `payment_settings`, with sensible fallbacks. */
export function usePricing(enabled = true): Pricing {
  const [pricing, setPricing] = useState<Pricing>(cache ?? DEFAULT_PRICING)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchPricing().then((p) => {
      if (!cancelled) setPricing(p)
    })
    return () => {
      cancelled = true
    }
  }, [enabled])
  return pricing
}
