import { useEffect, useState } from 'react'

import { getBillingState, initBilling, subscribeBilling } from '@/lib/billing'

export type Pricing = {
  /** localised Google Play price, e.g. "MMK 30,000" — empty until Play responds */
  priceMmk: string
  /** kept for layout compatibility — Play has no "original price" concept here */
  originalMmk: string
  priceUsd: string
  promoLabel: string
  /** true once Play Billing has settled (or is known unavailable) */
  loaded: boolean
}

export const DEFAULT_PRICING: Pricing = {
  priceMmk: '',
  originalMmk: '',
  priceUsd: '',
  promoLabel: '',
  loaded: false,
}

function fromBilling(): Pricing {
  const b = getBillingState()
  return {
    priceMmk: b.price,
    originalMmk: '',
    priceUsd: '',
    promoLabel: '',
    loaded: b.ready,
  }
}

export async function fetchPricing(): Promise<Pricing> {
  await initBilling()
  return fromBilling()
}

/** Live price straight from the Google Play product. */
export function usePricing(_enabled = true): Pricing {
  const [pricing, setPricing] = useState<Pricing>(fromBilling)
  useEffect(() => {
    const unsub = subscribeBilling(() => setPricing(fromBilling()))
    void initBilling()
    return unsub
  }, [])
  return pricing
}
