import { useState } from 'react'
import {
  BadgeCheck,
  Clock,
  Layers,
  Sparkles,
  Type as TypeIcon,
  Wand2,
  ShieldOff,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PaymentPage } from './payment-page'
import { useAuth } from '@/components/auth-provider'

const BENEFITS = [
  { icon: ShieldOff, title: 'No ads', desc: 'Zero interruptions while you edit.' },
  { icon: TypeIcon, title: 'Premium fonts', desc: 'Full Myanmar + display font library.' },
  { icon: Wand2, title: 'Premium features', desc: 'Blur, square fit, advanced effects.' },
  { icon: Layers, title: 'Unlimited projects', desc: 'Save and reopen as many as you like.' },
  { icon: Sparkles, title: 'No watermark', desc: 'Export in full original quality.' },
]


function ProGem({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pro-gem-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b7cf6" />
          <stop offset="100%" stopColor="#5b4bd6" />
        </linearGradient>
      </defs>
      <path d="M12 2 22 12 12 22 2 12z" fill="url(#pro-gem-grad)" />
      <path d="M12 6.5 14 10.5 18 12 14 13.5 12 17.5 10 13.5 6 12 10 10.5z" fill="#fff" fillOpacity="0.9" />
    </svg>
  )
}

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function PremiumBadge() {
  const [open, setOpen] = useState(false)
  const [pay, setPay] = useState(false)
  const { isPro, proPending, proExpiresAt, proSince } = useAuth()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isPro ? 'Pro active' : proPending ? 'Pro pending' : 'Buy Pro'}
        className="glass-tile relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold tracking-tight text-foreground transition active:scale-95"
      >
        <ProGem className="premium-float size-4" />
        {isPro ? 'Pro' : proPending ? 'Pending' : 'Buy Pro'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel border-0 bg-white shadow-none max-w-[22rem] overflow-hidden rounded-3xl p-0 text-black dark:bg-white dark:text-black">
          <div className="px-5 pb-6 pt-6 text-center">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#8b5cf6]">
              <ProGem className="premium-float size-8" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center text-xl font-extrabold text-black">
                {isPro ? 'Pro Active' : proPending ? 'Pro Pending' : 'Buy Pro'}
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-neutral-600">
                {isPro
                  ? 'Thanks for supporting Myan.'
                  : proPending
                    ? 'We received your payment info. Verifying now.'
                    : 'Unlock everything, forever.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-3 px-5 pb-5">
            {isPro && (
              <div className="mb-1 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-[#8b5cf6]">
                  <BadgeCheck className="size-4" />
                  Status: Active
                </p>
                <div className="mt-2 space-y-1 text-[12px] text-neutral-600">
                  {proSince && (
                    <p>
                      Activated on{' '}
                      <span className="font-semibold text-black">{formatDate(proSince)}</span>
                    </p>
                  )}
                  <p>
                    Expires:{' '}
                    <span className="font-semibold text-black">
                      {proExpiresAt ? formatDate(proExpiresAt) : 'Never · Lifetime access'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {!isPro && proPending && (
              <div className="mb-1 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-amber-600">
                  <Clock className="size-4" />
                  Status: Pending verification
                </p>
                <p className="mt-2 text-[12px] text-neutral-600">
                  Your KBZPay transaction was submitted and is being checked manually. Pro unlocks
                  automatically once approved — usually within a few hours.
                </p>
              </div>
            )}

            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              {isPro ? 'Your benefits' : 'What you get'}
            </p>

            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6]">
                  <Icon className="size-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-black">{title}</p>
                  <p className="text-[11px] text-neutral-600">{desc}</p>
                </div>
              </div>
            ))}

            {isPro || proPending ? (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl bg-black text-sm font-bold text-white transition active:scale-[0.98]"
              >
                Done
              </button>
            ) : (
              <>
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
                  <p className="text-2xl font-extrabold tracking-tight text-black">30,000 MMK</p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-medium text-neutral-600">
                    <BadgeCheck className="size-3.5 text-[#8b5cf6]" />
                    One-time payment · Lifetime access
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setPay(true)
                  }}
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#3b82f6] text-sm font-bold text-white shadow-lg transition active:scale-[0.98]"
                >
                  <ProGem className="size-4" />
                  Buy Pro · Lifetime
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PaymentPage open={pay} onClose={() => setPay(false)} />
    </>
  )
}
