import { useEffect, useState } from 'react'
import { Droplets, Image as ImageIcon, Scissors, Type as TypeIcon, Undo2, X } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { FONTS, type TextLayer } from '@/lib/text-layer'
import { isProCustomFontKey } from '@/lib/custom-fonts'
import { listInstalledRemoteFonts, remoteFontNameFromKey } from '@/lib/remote-fonts'
import { PaymentPage } from './payment-page'

const PREMIUM_KEYS = new Set(FONTS.filter((f) => f.category === 'Myanmar Pro' || f.category === 'English Pro').map((f) => f.key))

function isPremiumFontKey(key: string) {
  const remote = remoteFontNameFromKey(key)
  if (remote) {
    return listInstalledRemoteFonts().some((f) => f.name === remote && f.tier === 'premium')
  }
  return PREMIUM_KEYS.has(key) || isProCustomFontKey(key)
}

export function usesPremiumFont(layers: TextLayer[]) {
  return layers.some((l) => isPremiumFontKey(l.fontKey))
}

export function usesPremiumLiquid(layers: TextLayer[]) {
  return layers.some((l) => !!l.liquidOn)
}

export function usesPremiumTexture(layers: TextLayer[]) {
  return layers.some((l) => l.fillType === 'texture' && !!(l.textureImage || l.textureSrc))
}

export function usesPremiumCutout(layers: TextLayer[]) {
  return layers.some((l) => !!l.graphic?.cutout)
}

export function usesPremiumFeature(layers: TextLayer[]) {
  return (
    usesPremiumFont(layers) ||
    usesPremiumLiquid(layers) ||
    usesPremiumTexture(layers) ||
    usesPremiumCutout(layers)
  )
}

export function stripPremiumFonts(layers: TextLayer[]): TextLayer[] {
  return layers.map((l) => {
    const next = { ...l }
    if (isPremiumFontKey(l.fontKey)) next.fontKey = 'pyidaungsu'
    if (l.liquidOn) next.liquidOn = false
    if (l.fillType === 'texture') next.fillType = 'solid'
    if (l.graphic?.cutout) {
      next.graphic = {
        ...l.graphic,
        src: l.graphic.originalSrc ?? l.graphic.src,
        cutout: false,
      }
    }
    return next
  })
}

function ProGem({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gate-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b7cf6" />
          <stop offset="100%" stopColor="#5b4bd6" />
        </linearGradient>
      </defs>
      <path d="M12 2 22 12 12 22 2 12z" fill="url(#gate-gem)" />
      <path d="M12 6.5 14 10.5 18 12 14 13.5 12 17.5 10 13.5 6 12 10 10.5z" fill="#fff" fillOpacity="0.9" />
    </svg>
  )
}

/**
 * Intercepts "Next" for free users whose design uses premium fonts.
 * They can buy Pro, or undo the premium fonts and continue.
 */
export function PremiumGate({
  requested,
  layers,
  onClear,
  onProceed,
  onUndoPremiumFonts,
}: {
  requested: boolean
  layers: TextLayer[]
  onClear: () => void
  onProceed: () => void
  onUndoPremiumFonts: () => void
}) {
  const { isPro } = useAuth()
  const [open, setOpen] = useState(false)
  const [pay, setPay] = useState(false)
  const [confirmUndo, setConfirmUndo] = useState(false)

  useEffect(() => {
    if (!requested) return
    onClear()
    if (isPro || !usesPremiumFeature(layers)) {
      onProceed()
      return
    }
    setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested])

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-t-3xl border-t border-border bg-background p-5 pb-8">
            <div className="mb-3 flex items-start justify-between">
              <p className="flex items-center gap-1.5 text-sm font-extrabold text-[var(--primary)]">
                <ProGem className="size-4" /> Premium
              </p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-foreground/10 text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              You're using premium features
            </h2>

            <div className="mt-4 space-y-2">
              {usesPremiumFont(layers) && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <TypeIcon className="size-5" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-foreground">Premium Fonts</p>
                    <p className="text-[11px] text-muted-foreground">
                      Purchase Premium to export with these fonts.
                    </p>
                  </div>
                </div>
              )}
              {usesPremiumLiquid(layers) && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Droplets className="size-5" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-foreground">Liquid Glass</p>
                    <p className="text-[11px] text-muted-foreground">
                      Purchase Premium to export with the liquid glass effect.
                    </p>
                  </div>
                </div>
              )}
              {usesPremiumTexture(layers) && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <ImageIcon className="size-5" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-foreground">Image Texture</p>
                    <p className="text-[11px] text-muted-foreground">
                      Purchase Premium to export with image-filled text or shapes.
                    </p>
                  </div>
                </div>
              )}
              {usesPremiumCutout(layers) && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Scissors className="size-5" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-foreground">Background Removal</p>
                    <p className="text-[11px] text-muted-foreground">
                      Purchase Premium to export with the removed background.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setPay(true)
              }}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-white shadow-lg transition active:scale-[0.98]"
            >
              <ProGem className="size-4" />
              Purchase Premium To Unlock
            </button>

            <p className="my-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              or
            </p>

            <button
              type="button"
              onClick={() => setConfirmUndo(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-foreground/5 text-sm font-bold text-foreground transition active:scale-[0.98]"
            >
              <Undo2 className="size-4" />
              Undo the premium features
            </button>
          </div>
        </div>
      )}

      {confirmUndo && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xs rounded-3xl border border-border bg-background p-5">
            <h3 className="text-base font-extrabold text-foreground">Undo premium features?</h3>
            <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">
              Premium fonts, liquid glass, textures and background removal will be reverted on your design.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmUndo(false)}
                className="h-11 flex-1 rounded-2xl border border-border bg-foreground/5 text-sm font-bold text-foreground transition active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUndoPremiumFonts()
                  setConfirmUndo(false)
                  setOpen(false)
                }}
                className="h-11 flex-1 rounded-2xl bg-foreground text-sm font-bold text-background transition active:scale-[0.98]"
              >
                Undo
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentPage open={pay} onClose={() => setPay(false)} />

    </>
  )
}
