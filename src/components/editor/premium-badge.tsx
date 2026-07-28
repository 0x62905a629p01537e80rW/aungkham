import { useState } from 'react'
import {
  BadgeCheck,
  Crown,
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

const BENEFITS = [
  { icon: ShieldOff, title: 'No ads', desc: 'Zero interruptions while you edit.' },
  { icon: TypeIcon, title: 'Premium fonts', desc: 'Full Myanmar + display font library.' },
  { icon: Wand2, title: 'Premium features', desc: 'Blur, square fit, advanced effects.' },
  { icon: Layers, title: 'Unlimited projects', desc: 'Save and reopen as many as you like.' },
  { icon: Sparkles, title: 'No watermark', desc: 'Export in full original quality.' },
]

export function PremiumBadge() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Premium"
        className="premium-shine relative flex h-8 shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-3 text-[11px] font-bold text-white shadow-md transition active:scale-95"
      >
        <Crown className="premium-float size-3.5" />
        Premium
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[22rem] overflow-hidden rounded-3xl p-0">
          <div className="premium-shine px-5 pb-6 pt-6 text-center text-white">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <Crown className="premium-float size-7" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center text-xl font-extrabold text-white">
                Go Premium
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
              <Crown className="size-4" />
              Unlock Lifetime Premium
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
