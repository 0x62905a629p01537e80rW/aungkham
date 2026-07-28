import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Aperture,
  Check,
  CircleDot,
  Contrast,
  Droplet,
  Layers,
  Palette,
  RotateCcw,
  Scan,
  Sparkles,
  Sun,
  SunDim,
  SunMedium,
  Thermometer,
  Triangle,
  Waves,
  X,
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { loadImage } from '@/lib/image-ops'
import {
  ADJUST_RANGES,
  DEFAULT_ADJUSTMENTS,
  renderAdjusted,
  type AdjustKey,
  type Adjustments,
} from '@/lib/image-adjust'

type Group = 'tone' | 'colors' | 'details'

interface Item {
  key: AdjustKey
  label: string
  icon: typeof Sun
  group: Group
}

const ITEMS: Item[] = [
  { key: 'exposure', label: 'Exposure', icon: CircleDot, group: 'tone' },
  { key: 'brightness', label: 'Brightness', icon: Sun, group: 'tone' },
  { key: 'contrast', label: 'Contrast', icon: Contrast, group: 'tone' },
  { key: 'lightness', label: 'Lightness', icon: SunMedium, group: 'tone' },
  { key: 'highlights', label: 'Highlights', icon: SunDim, group: 'tone' },
  { key: 'shadows', label: 'Shadows', icon: Aperture, group: 'tone' },
  { key: 'lightRange', label: 'Light range', icon: Layers, group: 'tone' },
  { key: 'darkRange', label: 'Dark range', icon: Layers, group: 'tone' },
  { key: 'curve', label: 'Curve', icon: Waves, group: 'tone' },

  { key: 'saturation', label: 'Saturation', icon: Palette, group: 'colors' },
  { key: 'vibrance', label: 'Vibrance', icon: Sparkles, group: 'colors' },
  { key: 'hue', label: 'HSL', icon: Palette, group: 'colors' },
  { key: 'posterize', label: 'Posterize', icon: CircleDot, group: 'colors' },
  { key: 'warmth', label: 'Warmth', icon: Thermometer, group: 'colors' },
  { key: 'tint', label: 'Tint', icon: Droplet, group: 'colors' },
  { key: 'fade', label: 'Fade', icon: SunDim, group: 'colors' },

  { key: 'sharpness', label: 'Sharpness', icon: Triangle, group: 'details' },
  { key: 'clarity', label: 'Clarity', icon: Scan, group: 'details' },
  { key: 'grain', label: 'Grain', icon: Sparkles, group: 'details' },
  { key: 'denoise', label: 'De-noise', icon: Waves, group: 'details' },
  { key: 'vignette', label: 'Vignette', icon: Aperture, group: 'details' },
  { key: 'dispersion', label: 'Dispersion', icon: Triangle, group: 'details' },
  { key: 'noise', label: 'Noise', icon: CircleDot, group: 'details' },
]

const GROUPS: { key: Group; label: string }[] = [
  { key: 'tone', label: 'Tone' },
  { key: 'colors', label: 'Colors' },
  { key: 'details', label: 'Details' },
]

interface Props {
  image: string
  onCancel: () => void
  onApply: (dataUrl: string) => void
}

export function AdjustEditor({ image, onCancel, onApply }: Props) {
  const [adj, setAdj] = useState<Adjustments>({ ...DEFAULT_ADJUSTMENTS })
  const [group, setGroup] = useState<Group>('tone')
  const [active, setActive] = useState<AdjustKey>('exposure')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(image)

  const sourceRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let alive = true
    loadImage(image).then((img) => {
      if (!alive) return
      sourceRef.current = img
    })
    return () => {
      alive = false
    }
  }, [image])

  // live preview (downscaled for speed)
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const img = sourceRef.current
      if (!img) return
      const canvas = renderAdjusted(img, adj, 900)
      setPreview(canvas.toDataURL('image/png'))
    })
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [adj])

  const items = useMemo(() => ITEMS.filter((i) => i.group === group), [group])
  const activeItem = ITEMS.find((i) => i.key === active)!
  const range = ADJUST_RANGES[active]

  function setValue(v: number) {
    setAdj((p) => ({ ...p, [active]: v }))
  }

  async function apply() {
    const img = sourceRef.current
    if (!img) return
    setBusy(true)
    try {
      const canvas = renderAdjusted(img, adj)
      onApply(canvas.toDataURL('image/png'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header
        className="flex h-14 shrink-0 items-center justify-between px-3"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="grid size-10 place-items-center rounded-full text-muted-foreground active:scale-95"
          aria-label="Cancel"
        >
          <X className="size-5" />
        </button>
        <p className="text-sm font-bold">Adjust</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAdj({ ...DEFAULT_ADJUSTMENTS })}
            className="grid size-10 place-items-center rounded-full text-muted-foreground active:scale-95"
            aria-label="Reset all"
          >
            <RotateCcw className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={busy}
            className="grid size-10 place-items-center rounded-full text-primary active:scale-95 disabled:opacity-50"
            aria-label="Apply"
          >
            <Check className="size-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-muted/30 p-3">
        <img src={preview} alt="Adjust preview" className="max-h-full max-w-full object-contain" />
      </div>

      <div
        className="glass-bar shrink-0 space-y-3 border-t border-border/40 px-3 pt-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {/* active slider */}
        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{activeItem.label}</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {adj[active]}
            </span>
          </div>
          <Slider
            value={[adj[active]]}
            min={range.min}
            max={range.max}
            step={range.step}
            onValueChange={(v) => setValue(v[0])}
          />
        </div>

        {/* items rail */}
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map(({ key, label, icon: Icon }) => {
            const changed = adj[key] !== DEFAULT_ADJUSTMENTS[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={cn(
                  'glass-tile flex w-[76px] shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition active:scale-95',
                  active === key ? 'ring-1 ring-primary text-primary' : 'text-foreground/80',
                )}
              >
                <span className="relative">
                  <Icon className="size-[18px]" />
                  {changed && (
                    <span className="absolute -right-1.5 -top-1 size-1.5 rounded-full bg-primary" />
                  )}
                </span>
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </div>

        {/* group tabs */}
        <div className="flex justify-center gap-6 pb-1">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => {
                setGroup(g.key)
                const first = ITEMS.find((i) => i.group === g.key)
                if (first) setActive(first.key)
              }}
              className={cn(
                'text-sm font-semibold transition',
                group === g.key ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
