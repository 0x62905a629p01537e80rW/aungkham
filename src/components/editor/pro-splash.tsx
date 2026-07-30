import { useEffect, useState } from 'react'
import { Loader2, X, Check, LogIn } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { usePricing } from '@/lib/pricing'
import { PaymentPage } from './payment-page'

const SEEN_KEY = 'pro-splash-seen'

const BENEFITS = [
  'Premium templates — Burmese & English designs',
  'Premium Myanmar + English pro typefaces',
  'Custom .woff & .woff2 font uploads',
  'Liquid glass text and element effects',
  'PDF and high quality (4K) exports',
  'Background blur, square fit & pro effects',
  'Unlimited saved projects',
  'No ads and no watermark',
]


function ProGem({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pro-splash-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b7cf6" />
          <stop offset="100%" stopColor="#5b4bd6" />
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
    <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto perf-scroll bg-[#07070c] text-white animate-fade-in">
      <div className="relative shrink-0 overflow-hidden px-5 pb-4 pt-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#22d3ee_0%,#0e7490_35%,#0b1120_70%,transparent_100%)] opacity-80" />
        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full bg-white/10 backdrop-blur transition active:scale-95"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={restoring}
            className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/90 transition active:scale-95 disabled:opacity-60"
          >
            {restoring && <Loader2 className="size-3.5 animate-spin" />}
            RESTORE
          </button>
        </div>

        <div className="relative mt-5 text-center">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight">Myan</h2>
            <span className="flex items-center gap-1 rounded-md bg-[#e11d74] px-2 py-0.5 text-[10px] font-bold">
              <ProGem className="size-3" />
              Pro
            </span>
          </div>
          <p className="mt-0.5 text-xs text-white/80">Unlock All Features</p>
        </div>
      </div>

      {/* Feature cards rail */}
      <div className="-mt-1 overflow-hidden pb-3 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="marquee-track gap-2">
          {[...CARDS, ...CARDS].map(({ icon: Icon, label, tint }, i) => (
            <div
              key={`${label}-${i}`}
              className={`relative flex h-16 w-16 shrink-0 flex-col justify-end rounded-lg bg-gradient-to-br ${tint} p-2`}
            >
              <Icon className="absolute left-2 top-2 size-4 text-white/90" />
              <p className="text-[9px] font-semibold leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-5">
        {BENEFITS.map((line) => (
          <div key={line} className="flex items-start gap-2">
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#7c5cff]">
              <Check className="size-3" />
            </span>
            <p className="text-[11px] font-medium leading-tight text-white/90">{line}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2 px-5 pb-5 pt-3">
        <div className="relative rounded-2xl border-2 border-[#7c5cff] bg-white/[0.06] p-3">
          {pricing.promoLabel && (
            <span className="absolute -top-2 left-3 rounded-md bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] px-2 py-0.5 text-[9px] font-extrabold">
              {pricing.promoLabel}
            </span>
          )}
          <span className="absolute -top-2 right-3 rounded-md bg-[#7c5cff] px-2 py-0.5 text-[9px] font-bold">
            Best value
          </span>
          <div className="flex items-center gap-3">
            <span className="grid size-5 place-items-center rounded-full bg-[#7c5cff]">
              <Check className="size-3.5" />
            </span>
            <div>
              {pricing.originalMmk && (
                <p className="text-[11px] text-white/60 line-through">{pricing.originalMmk}</p>
              )}
              <p className="text-base font-bold">
                {pricing.priceMmk}
                {pricing.priceUsd && (
                  <span className="text-[11px] font-semibold text-white/70"> OR {pricing.priceUsd}</span>
                )}
              </p>
              <p className="text-[10px] text-white/70">One-time payment · Lifetime access</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setPay(true)
          }}
          className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#3b82f6] py-3 text-sm font-bold shadow-lg transition active:scale-[0.98]"
        >
          Continue
        </button>

        <p className="text-center text-[9px] leading-relaxed text-white/55">
          The lifetime option is a one-time payment and does not auto-renew. Manage your purchase in Google Play.
        </p>
      </div>
      <PaymentPage open={pay} onClose={() => setPay(false)} />
    </div>
  )

}
