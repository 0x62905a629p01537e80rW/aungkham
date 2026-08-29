import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getBillingState,
  initBilling,
  purchasePro,
  restorePro,
  subscribeBilling,
  type BillingState,
} from '@/lib/billing'

type ProState = {
  /** true once Google Play has been queried (or is known unavailable) */
  loading: boolean
  isPro: boolean
  /** Play Billing reachable (Android app only) */
  available: boolean
  /** localised store price, empty until Play responds */
  price: string
  /** a purchase or restore is running */
  busy: boolean
  /** open the Google Play purchase sheet */
  purchase: () => Promise<void>
  /** re-query Play for an existing purchase */
  restore: () => Promise<boolean>
}

const ProContext = createContext<ProState>({
  loading: true,
  isPro: false,
  available: false,
  price: '',
  busy: false,
  purchase: async () => {},
  restore: async () => false,
})

export function usePro() {
  return useContext(ProContext)
}

/** Backwards-compatible alias — the app no longer has user accounts. */
export const useAuth = usePro

export function AuthProvider({ children }: { children: ReactNode }) {
  const [billing, setBilling] = useState<BillingState>(() => getBillingState())

  useEffect(() => {
    const unsub = subscribeBilling(setBilling)
    void initBilling()
    return unsub
  }, [])

  const purchase = useCallback(async () => {
    await purchasePro()
  }, [])

  const restore = useCallback(async () => restorePro(), [])

  const value = useMemo<ProState>(
    () => ({
      loading: !billing.ready,
      isPro: billing.isPro,
      available: billing.available,
      price: billing.price,
      busy: billing.busy,
      purchase,
      restore,
    }),
    [billing, purchase, restore],
  )

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>
}

/** Alias kept so existing mounts keep working. */
export const ProProvider = AuthProvider
