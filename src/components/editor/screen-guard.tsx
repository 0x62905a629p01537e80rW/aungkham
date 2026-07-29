import { useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { setScreenSecure } from '@/lib/secure-screen'
import type { TextLayer } from '@/lib/text-layer'
import { usesPremiumFont } from './premium-gate'

/**
 * Blocks screenshots / screen recording while the design uses premium
 * features without an active Pro plan.
 */
export function ScreenGuard({ layers }: { layers: TextLayer[] }) {
  const { isPro } = useAuth()
  const secure = !isPro && usesPremiumFont(layers)

  useEffect(() => {
    setScreenSecure(secure)
    return () => setScreenSecure(false)
  }, [secure])

  return null
}
