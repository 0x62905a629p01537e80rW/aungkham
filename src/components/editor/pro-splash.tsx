import { useEffect, useState } from 'react'
import { Loader2, X, Check, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { usePricing } from '@/lib/pricing'
import { PaymentPage } from './payment-page'
import { TemplateThumb } from './template-picker'
import { UPLOADED_TEMPLATES } from '@/lib/uploaded-templates'
import { useFloatingTemplates } from '@/lib/floating-templates'

const SEEN_KEY = 'pro-splash-seen'

const OFFLINE_TILES = UPLOADED_TEMPLATES

const BENEFITS = [
  'Premium templates — Burmese & English designs',
  'Premium Myanmar + English pro typefaces',
  'Custom .woff & .woff2 font uploads',
  'Liquid glass text and element effects',
  'PDF and high quality (4K) exports',
  'Background blur, square fit & pro effects',
  'Smart resize & batch export in every size',
  'No ads and no watermark',
]


function ProGem({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pro-splash-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c3f0" />
          <stop offset="100%" stopColor="#0b7fbf" />
        </linearGradient>
      </defs>
      <path d="M12 2 22 12 12 22 2 12z" fill="url(#pro-splash-gem)" />
      <path
        d="M12 6.5 14 10.5 18 12 14 13.5 12 17.5 10 13.5 6 12 10 10.5z"
        fill="#fff"
        fillOpacity="0.9"
      />
    </svg>
  )
}

export function ProSplash() {
  const [open, setOpen] = useState(false)
  const [pay, setPay] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [askLogin, setAskLogin] = useState(false)
  const { isPro, signIn, user } = useAuth()
  const pricing = usePricing(open)
  const TILES = useFloatingTemplates(OFFLINE_TILES).slice(0, 12)

  async function handleRestore() {
    setRestoring(true)
    try {
      await signIn()
      setAskLogin(false)
    } catch {
      /* ignore */
    } finally {
      setRestoring(false)
    }
  }

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(SEEN_KEY)) {
        sessionStorage.setItem(SEEN_KEY, '1')
        setOpen(true)
      }
    } catch {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    if (isPro) setOpen(false)
  }, [isPro])

  if (!open) return <PaymentPage open={pay} onClose={() => setPay(false)} />


  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#070a0d] text-white animate-fade-in">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38%] bg-[radial-gradient(110%_70%_at_50%_0%,#22c3f033_0%,transparent_70%)]" />

      {/* Header */}
      <div
        className="relative flex items-center justify-between px-5"
        style={{ paddingTop: 'calc(1rem + var(--safe-top))' }}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="grid size-8 place-items-center rounded-full bg-white/10 transition active:scale-95"
        >
          <X className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => (user ? void handleRestore() : setAskLogin(true))}
          className="text-[11px] font-semibold tracking-[0.14em] text-white/70 transition active:scale-95"
        >
          RESTORE
        </button>
      </div>

      {/* Title */}
      <div className="relative mt-6 px-5 text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight">Myan</h2>
          <span className="flex items-center gap-1 rounded-md bg-[#22c3f0] px-2 py-0.5 text-[10px] font-bold text-[#04121a]">
            <ProGem className="size-3" />
            Pro
          </span>
        </div>
        <p className="mt-1 text-xs text-white/55">One purchase. Every feature, forever.</p>
      </div>

      {/* Looping template tiles */}
      <div className="relative mt-5 space-y-2 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        {[0, 1].map((row) => (
          <div
            key={row}
            className="marquee-track gap-2"
            style={{
              animationDuration: row ? '30s' : '24s',
              animationDirection: row ? 'reverse' : 'normal',
            }}
          >
            {[...TILES, ...TILES].map((t, i) => (
              <div
                key={`${row}-${i}`}
                className="relative h-20 w-[142px] shrink-0 overflow-hidden rounded-xl border border-white/10"
              >
                <TemplateThumb template={t} bg="#0d0d14" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="relative mt-6 flex-1 overflow-y-auto perf-scroll px-5">
        <div className="space-y-2.5 pb-4">
          {BENEFITS.map((line) => (
            <div key={line} className="flex items-start gap-2.5">
              <span className="mt-[1px] grid size-4 shrink-0 place-items-center rounded-full bg-[#22c3f0]/20">
                <Check className="size-3 text-[#7fdcff]" />
              </span>
              <p className="text-[12px] font-medium leading-snug text-white/85">{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Price + CTA */}
      <div className="relative space-y-3 px-5 pb-6 pt-3">
        <div className="relative rounded-2xl border border-[#22c3f0]/60 bg-white/[0.04] p-4">
          {pricing.promoLabel && (
            <span className="absolute -top-2 left-4 rounded-md bg-[var(--primary)] px-2 py-0.5 text-[9px] font-bold">
              {pricing.promoLabel}
            </span>
          )}
          {pricing.originalMmk && (
            <p className="text-[11px] text-white/45 line-through">{pricing.originalMmk}</p>
          )}
          {pricing.loaded && pricing.priceMmk ? (
            <p className="text-lg font-bold">
              {pricing.priceMmk}
              {pricing.priceUsd && (
                <span className="text-[11px] font-semibold text-white/60"> OR {pricing.priceUsd}</span>
              )}
            </p>
          ) : pricing.loaded ? (
            <p className="text-xs font-semibold text-white/60">Price unavailable — try again later</p>
          ) : (
            <span className="flex items-center gap-2 py-1 text-white/50">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-xs font-semibold">Loading price…</span>
            </span>
          )}

          <p className="mt-0.5 text-[10px] text-white/55">One-time payment · Lifetime access</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setPay(true)
          }}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#22c3f0] text-sm font-bold text-[#04121a] transition active:scale-[0.98]"
        >
          Get Pro features
        </button>

        <p className="text-center text-[9px] leading-relaxed text-white/40">
          One-time payment, does not auto-renew.
        </p>
      </div>

      {/* Restore login dialog */}
      {askLogin && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/70 p-6 animate-fade-in">
          <div className="w-full max-w-[300px] rounded-2xl border border-white/10 bg-[#111820] p-5 text-center">
            <div className="mx-auto grid size-10 place-items-center rounded-full bg-[#22c3f0]/20">
              <LogIn className="size-5 text-[#7fdcff]" />
            </div>
            <h3 className="mt-3 text-sm font-bold">Sign in to restore</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-white/60">
              Log in with the account you used to purchase Pro to restore your purchase.
            </p>
            <button
              type="button"
              onClick={() => void handleRestore()}
              disabled={restoring}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#22c3f0] text-[#04121a] text-xs font-bold transition active:scale-[0.98] disabled:opacity-60"
            >
              {restoring && <Loader2 className="size-3.5 animate-spin" />}
              Log in with Google
            </button>
            <button
              type="button"
              onClick={() => setAskLogin(false)}
              className="mt-2 h-9 w-full rounded-full bg-white/5 text-xs font-semibold text-white/70 transition active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <PaymentPage open={pay} onClose={() => setPay(false)} />
    </div>

  )

}
