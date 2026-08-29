import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, BadgeCheck, Check, Loader2, RotateCcw, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { usePro } from '@/components/auth-provider'
import { BrandLogo } from '@/components/editor/pay-icons'

const BENEFITS = [
  'Premium templates — Burmese & English designs',
  'Premium Myanmar + English pro typefaces',
  'Custom .woff & .woff2 font uploads',
  'Liquid glass text and element effects',
  'PDF and high quality (4K) exports',
  'Ultra HD enhance, Shape Lab and pro effects',
  'No ads and no watermark',
]

function PlayMark({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#00D4FF" d="M3.6 1.8 14 12 3.6 22.2A2 2 0 0 1 3 20.8V3.2a2 2 0 0 1 .6-1.4z" />
      <path fill="#00F076" d="M3.6 1.8 17 9.2 14 12z" />
      <path fill="#FFC900" d="M17 9.2 21 11.4a1 1 0 0 1 0 1.7L17 15.3 14 12z" />
      <path fill="#FF3A44" d="M3.6 22.2 14 12l3 3.3-13.4 7.4a2 2 0 0 1 0-.5z" />
    </svg>
  )
}

export function PaymentPage({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isPro, loading, available, price, busy, purchase, restore } = usePro()
  const [error, setError] = useState<string | null>(null)

  async function handleBuy() {
    setError(null)
    try {
      await purchase()
      toast.success('Pro unlocked. Thank you!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purchase failed'
      if (!/cancel/i.test(msg)) setError(msg)
    }
  }

  async function handleRestore() {
    setError(null)
    try {
      const ok = await restore()
      if (ok) toast.success('Pro restored.')
      else toast.info('No previous purchase found on this Google account.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed')
    }
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto perf-scroll bg-background text-foreground animate-fade-in">
      <div
        className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-border/60 bg-background px-3 pb-3 pt-4"
        style={{ paddingTop: 'calc(var(--safe-top) + 0.75rem)' }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="grid size-10 shrink-0 place-items-center rounded-full transition active:scale-95"
        >
          <ArrowLeft className="size-6" />
        </button>
        <BrandLogo className="size-9 shrink-0" />
        <div className="min-w-0 leading-tight">
          <p className="text-[15px] font-bold tracking-tight">Myan Pro</p>
          <p className="truncate text-[11px] text-muted-foreground">One-time purchase</p>
        </div>
      </div>

      <div className="px-4 pb-14 pt-4">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-sm font-semibold">Myan Pro · Lifetime</p>
          <p className="mt-0.5 text-2xl font-extrabold tracking-tight">
            {price || (loading ? '···' : available ? '—' : 'Play Store')}
          </p>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <BadgeCheck className="size-3.5 text-primary" />
            Pay once, unlocked forever
          </p>
        </div>

        {isPro ? (
          <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
            <BadgeCheck className="mx-auto size-6 text-primary" />
            <p className="mt-1 text-sm font-bold">Pro is active</p>
            <p className="text-[11px] text-muted-foreground">
              Every premium feature is unlocked on this device.
            </p>
          </div>
        ) : !available && !loading ? (
          <div className="mt-5 rounded-2xl border border-border/60 bg-muted/40 p-4 text-center">
            <Smartphone className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-1 text-sm font-bold">Buy Pro in the Android app</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Pro is sold through Google Play in-app purchase. Open Myan Add Text on your Android
              phone to buy or restore it.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => void handleBuy()}
              disabled={busy || loading}
              className="premium-glass flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : <PlayMark className="size-5" />}
              Buy Pro{price ? ` · ${price}` : ''}
            </button>
            <button
              type="button"
              onClick={() => void handleRestore()}
              disabled={busy}
              className="glass-tile flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60"
            >
              <RotateCcw className="size-4" />
              Restore purchase
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              Billed once by Google Play. Restore works on any device signed in with the same Google
              account.
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-center text-[12px] text-destructive">{error}</p>}

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {isPro ? 'Your benefits' : 'What you get'}
        </p>
        <ul className="mt-2 space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[13px] text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
