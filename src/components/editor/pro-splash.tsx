import { useEffect, useState } from 'react'
import {
  Layers,
  LayoutTemplate,
  Loader2,
  Sparkles,
  Type as TypeIcon,
  Upload,
  Wand2,
  Droplets,
  FileDown,
  ShieldOff,
  X,
  Check,
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { usePricing } from '@/lib/pricing'
import { PaymentPage } from './payment-page'

const SEEN_KEY = 'pro-splash-seen'

const CARDS = [
  { icon: ShieldOff, label: 'No ads at all', tint: 'from-[#0ea5e9] to-[#1e3a8a]' },
  { icon: TypeIcon, label: 'Premium Myanmar fonts', tint: 'from-[#a855f7] to-[#3b0764]' },
  { icon: LayoutTemplate, label: 'Premium templates', tint: 'from-[#6366f1] to-[#1e1b4b]' },
  { icon: Upload, label: 'Woff & woff2 font upload', tint: 'from-[#14b8a6] to-[#134e4a]' },
  { icon: Droplets, label: 'Liquid text & element effects', tint: 'from-[#22d3ee] to-[#0c4a6e]' },
  { icon: FileDown, label: 'PDF & high quality export', tint: 'from-[#ef4444] to-[#450a0a]' },
  { icon: Wand2, label: 'Blur, square fit & effects', tint: 'from-[#f59e0b] to-[#7c2d12]' },
  { icon: Layers, label: 'Unlimited projects', tint: 'from-[#10b981] to-[#064e3b]' },
  { icon: Sparkles, label: 'No watermark exports', tint: 'from-[#f43f5e] to-[#4c0519]' },
]

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
  const { isPro, signIn } = useAuth()
  const pricing = usePricing(open)

  async function handleRestore() {
    setRestoring(true)
    try {
      await signIn()
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
      {/* Hero */}
      <div className="relative shrink-0 overflow-hidden px-5 pb-8 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#22d3ee_0%,#0e7490_35%,#0b1120_70%,transparent_100%)] opacity-80" />
        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full bg-white/10 backdrop-blur transition active:scale-95"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={restoring}
            className="flex items-center gap-1.5 text-sm font-semibold tracking-wide text-white/90 transition active:scale-95 disabled:opacity-60"
          >
            {restoring && <Loader2 className="size-4 animate-spin" />}
            RESTORE
          </button>
        </div>

        <div className="relative mt-10 text-center">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Myan</h2>
            <span className="flex items-center gap-1 rounded-md bg-[#e11d74] px-2 py-0.5 text-[11px] font-bold">
              <ProGem className="size-3" />
              Pro
            </span>
          </div>
          <p className="mt-1 text-sm text-white/80">Unlock All Features</p>
        </div>
      </div>

      {/* Feature cards rail — auto looping */}
      <div className="-mt-2 overflow-hidden pb-6 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="marquee-track gap-2.5">
          {[...CARDS, ...CARDS].map(({ icon: Icon, label, tint }, i) => (
            <div
              key={`${label}-${i}`}
              className={`relative flex h-24 w-24 shrink-0 flex-col justify-end rounded-xl bg-gradient-to-br ${tint} p-2.5`}
            >
              <Icon className="absolute left-2.5 top-2.5 size-5 text-white/90" />
              <p className="text-[10px] font-semibold leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-3 px-6">
        {[
          'Get access to all pro features',
          'Access premium fonts, styles and effects',
          'Remove all ads and watermark',
        ].map((line) => (
          <div key={line} className="flex items-start gap-3">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#7c5cff]">
              <Check className="size-3.5" />
            </span>
            <p className="text-sm font-medium leading-snug text-white/90">{line}</p>
          </div>
        ))}
      </div>


      <div className="mt-auto space-y-3 px-5 pb-6">
        <div className="relative rounded-2xl border-2 border-[#7c5cff] bg-white/[0.06] p-4">
          {pricing.promoLabel && (
            <span className="absolute -top-2.5 left-3 rounded-md bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] px-2 py-0.5 text-[10px] font-extrabold">
              {pricing.promoLabel}
            </span>
          )}
          <span className="absolute -top-2.5 right-3 rounded-md bg-[#7c5cff] px-2 py-0.5 text-[10px] font-bold">
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
                  <span className="text-[12px] font-semibold text-white/70"> OR {pricing.priceUsd}</span>
                )}
              </p>
              <p className="text-[11px] text-white/70">One-time payment · Pay once, keep forever</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setPay(true)
          }}
          className="flex h-13 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#3b82f6] py-4 text-base font-bold shadow-lg transition active:scale-[0.98]"
        >
          Continue
        </button>

        <p className="text-center text-[10px] leading-relaxed text-white/55">
          The lifetime option is a one-time payment and does not auto-renew. You can manage your
          purchase in Google Play.
        </p>
      </div>
      <PaymentPage open={pay} onClose={() => setPay(false)} />
    </div>
  )
}
