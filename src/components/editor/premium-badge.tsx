import { useState } from 'react'
import {
  BadgeCheck,
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

export function PremiumBadge() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buy Pro"
        className="glass-tile relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold tracking-tight text-foreground transition active:scale-95"
      >
        <ProGem className="premium-float size-4" />
        Buy Pro
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel border-0 bg-transparent shadow-none max-w-[22rem] overflow-hidden rounded-3xl p-0">
          <div className="premium-shine px-5 pb-6 pt-6 text-center text-white">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <ProGem className="premium-float size-8" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center text-xl font-extrabold text-white">
                Buy Pro
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-white/85">
                Unlock everything, forever.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-3 px-5 pb-5">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}

            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-2xl font-extrabold tracking-tight">30,000 MMK</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
                <BadgeCheck className="size-3.5 text-primary" />
                One-time payment · Lifetime access
              </p>
            </div>

            <button
              type="button"
              className="premium-shine mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-lg transition active:scale-[0.98]"
            >
              <ProGem className="size-4" />
              Buy Pro · Lifetime
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
