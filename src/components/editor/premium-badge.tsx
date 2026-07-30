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
import { usePricing } from '@/lib/pricing'

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
  const pricing = usePricing(open)

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
        <DialogContent className="glass-panel max-w-[22rem] overflow-hidden rounded-3xl border border-border bg-background p-0 text-foreground shadow-none">
          <div className="px-5 pb-6 pt-6 text-center">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#8b5cf6]">
              <ProGem className="premium-float size-8" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center text-xl font-extrabold text-foreground">
                {isPro ? 'Pro Active' : proPending ? 'Pro Pending' : 'Buy Pro'}
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-muted-foreground">
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
              <div className="mb-1 rounded-2xl border border-border bg-muted/50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-[#8b5cf6]">
                  <BadgeCheck className="size-4" />
                  Status: Active
                </p>
                <div className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                  {proSince && (
                    <p>
                      Activated on{' '}
                      <span className="font-semibold text-foreground">{formatDate(proSince)}</span>
                    </p>
                  )}
                  <p>
                    Expires:{' '}
                    <span className="font-semibold text-foreground">
                      {proExpiresAt ? formatDate(proExpiresAt) : 'Never · Lifetime access'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {!isPro && proPending && (
              <div className="mb-1 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
                  <Clock className="size-4" />
                  Status: Pending verification
                </p>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Your KBZPay transaction was submitted and is being checked manually. Pro unlocks
                  automatically once approved — usually within a few hours.
                </p>
              </div>
            )}

            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isPro ? 'Your benefits' : 'What you get'}
            </p>

            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6]">
                  <Icon className="size-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}

            {isPro || proPending ? (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background transition active:scale-[0.98]"
              >
                Done
              </button>
            ) : (
              <>
                <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#8b5cf6]/40 bg-muted/50 p-4 text-center">
                  {pricing.promoLabel && (
                    <span className="absolute left-0 top-0 rounded-br-xl bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] px-2 py-0.5 text-[10px] font-extrabold text-white">
                      {pricing.promoLabel}
                    </span>
                  )}
                  {pricing.originalMmk && (
                    <p className="text-[11px] font-medium text-muted-foreground line-through">
                      {pricing.originalMmk}
                    </p>
                  )}
                  <p className="text-2xl font-extrabold tracking-tight text-foreground">
                    {pricing.priceMmk}
                    {pricing.priceUsd && (
                      <span className="ml-1 text-[13px] font-bold text-muted-foreground">
                        OR {pricing.priceUsd}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
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
