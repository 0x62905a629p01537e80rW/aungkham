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
  /** true once a Firestore snapshot (or an error) has settled */
  loaded: boolean
}

export const DEFAULT_PRICING: Pricing = {
  priceMmk: '30,000 MMK',
  originalMmk: '',
  priceUsd: '',
  promoLabel: '',
  loaded: false,
}


function raw(v: unknown): string | undefined {
  if (typeof v === 'string') return v.trim() || undefined
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return undefined
}

function formatMmk(v?: string): string {
  if (!v) return ''
  const digits = v.replace(/[^\d]/g, '')
  if (!digits) return v
  return `${Number(digits).toLocaleString('en-US')} MMK`
}

function formatUsd(v?: string): string {
  if (!v) return ''
  const num = v.replace(/[^\d.]/g, '')
  if (!num) return v
  return `${num} USD`
}

function formatPromo(v?: string): string {
  if (!v) return ''
  const digits = v.replace(/[^\d]/g, '')
  if (!digits) return v.toUpperCase()
  if (Number(digits) <= 0) return ''
  return `${digits}% OFF`
}

export function pricingFromDoc(d: Record<string, unknown>): Pricing {
  return {
    priceMmk: formatMmk(raw(d.price_mmk)) || DEFAULT_PRICING.priceMmk,
    originalMmk: formatMmk(raw(d.original_price)),
    priceUsd: formatUsd(raw(d.usdt_price)),
    promoLabel: formatPromo(raw(d.promo_percent)),
    loaded: true,
  }
}

let current: Pricing = DEFAULT_PRICING
const listeners = new Set<(p: Pricing) => void>()
let started = false

function emit(p: Pricing) {
  current = p
  listeners.forEach((fn) => fn(p))
}

/** Fast REST read — works even when the Firestore realtime channel is blocked/slow. */
async function fetchOnce() {
  try {
    const { FIREBASE_CONFIG } = await import('@/lib/firebase')
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/payment_settings?key=${FIREBASE_CONFIG.apiKey}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as {
      documents?: { fields?: Record<string, Record<string, unknown>> }[]
    }
    const fields = json.documents?.[0]?.fields
    if (!fields) {
      emit({ ...current, loaded: true })
      return
    }
    const flat: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(fields)) {
      flat[k] = Object.values(v ?? {})[0]
    }
    emit(pricingFromDoc(flat))
  } catch (err) {
    console.log('[pricing rest failed]', err)
    emit({ ...current, loaded: true })
  }
}

/** Subscribe live to Firestore `payment_settings` so admin edits appear instantly. */
async function start() {
  if (started) return
  started = true
  void fetchOnce()
  try {
    const { getDb } = await import('@/lib/firebase')
    const { collection, onSnapshot } = await import('firebase/firestore')
    onSnapshot(
      collection(getDb(), 'payment_settings'),
      (snap) => {
        if (snap.empty) {
          emit({ ...current, loaded: true })
          return
        }
        emit(pricingFromDoc((snap.docs[0].data() ?? {}) as Record<string, unknown>))
      },
      (err) => {
        console.log('[pricing subscribe failed]', err)
        emit({ ...current, loaded: true })
      },
    )
  } catch (err) {
    console.log('[pricing init failed]', err)
    emit({ ...current, loaded: true })
  }
}



export async function fetchPricing(): Promise<Pricing> {
  void start()
  return current
}

/** Live pricing from Firestore `payment_settings`, with sensible fallbacks. */
export function usePricing(_enabled = true): Pricing {
  const [pricing, setPricing] = useState<Pricing>(current)
  useEffect(() => {
    void start()
    setPricing(current)
    listeners.add(setPricing)
    return () => {
      listeners.delete(setPricing)
    }
  }, [])
  return pricing
}
