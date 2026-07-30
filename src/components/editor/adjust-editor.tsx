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

  const sourceRef = useRef<HTMLImageElement | null>(null)
  /** downscaled copies of the source, so live renders stay cheap */
  const fastRef = useRef<HTMLCanvasElement | null>(null)
  const fineRef = useRef<HTMLCanvasElement | null>(null)
  const viewRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const idleRef = useRef<number | null>(null)
  const draggingRef = useRef(false)
  const adjRef = useRef(adj)
  adjRef.current = adj

  function downscale(img: HTMLImageElement, max: number) {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(img.naturalWidth * k))
    c.height = Math.max(1, Math.round(img.naturalHeight * k))
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return c
  }

  const paint = (quality: 'fast' | 'fine') => {
    const src = quality === 'fast' ? fastRef.current : fineRef.current
    const view = viewRef.current
    if (!src || !view) return
    const out = renderAdjusted(src, adjRef.current)
    if (view.width !== out.width || view.height !== out.height) {
      view.width = out.width
      view.height = out.height
    }
    const ctx = view.getContext('2d')!
    ctx.clearRect(0, 0, view.width, view.height)
    ctx.drawImage(out, 0, 0)
  }

  useEffect(() => {
    let alive = true
    loadImage(image).then((img) => {
      if (!alive) return
      sourceRef.current = img
      fastRef.current = downscale(img, 420)
      fineRef.current = downscale(img, 1000)
      paint('fine')
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image])

  /** schedule a low-res paint now, and a crisp one once the user pauses */
  function schedulePreview() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => paint(draggingRef.current ? 'fast' : 'fine'))
    if (idleRef.current) clearTimeout(idleRef.current)
    idleRef.current = window.setTimeout(() => paint('fine'), 160)
  }

  // repaint on any adjustment change (incl. reset-all)
  useEffect(() => {
    schedulePreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adj])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (idleRef.current) clearTimeout(idleRef.current)
    }
  }, [])

  const items = useMemo(() => ITEMS.filter((i) => i.group === group), [group])
  const activeItem = ITEMS.find((i) => i.key === active)!
  const range = ADJUST_RANGES[active]

  /**
   * Cheap GPU-composited approximation of the active adjustment. Applied to
   * the preview canvas element while the finger is down so the live feedback
   * costs nothing on the main thread; the real pixel pipeline runs on release.
   */
  function previewFilter(key: AdjustKey, v: number, base: number) {
    const d = v - base
    if (!d) return ''
    switch (key) {
      case 'brightness':
      case 'exposure':
      case 'lightness':
        return `brightness(${1 + d / 120})`
      case 'contrast':
      case 'clarity':
        return `contrast(${1 + d / 120})`
      case 'saturation':
      case 'vibrance':
        return `saturate(${1 + d / 100})`
      case 'hue':
        return `hue-rotate(${d}deg)`
      case 'warmth':
        return `sepia(${Math.min(1, Math.abs(d) / 160)}) hue-rotate(${d < 0 ? 170 : 0}deg)`
      case 'fade':
        return `contrast(${1 - Math.min(0.4, Math.abs(d) / 250)}) brightness(${1 + Math.abs(d) / 500})`
      case 'sharpness':
      case 'denoise':
        return `contrast(${1 + d / 300})`
      default:
        return ''
    }
  }

  function livePreview(v: number) {
    const view = viewRef.current
    if (!view) return
    // relative to whatever is currently painted on the canvas
    view.style.filter = previewFilter(active, v, adjRef.current[active])
  }


  function setValue(v: number) {
    const view = viewRef.current
    if (view) view.style.filter = ''
    if (adjRef.current[active] === v) return
    adjRef.current = { ...adjRef.current, [active]: v }
    setAdj(adjRef.current)
    schedulePreview()
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
        <canvas
          ref={viewRef}
          aria-label="Adjust preview"
          className="max-h-full max-w-full object-contain"
        />
      </div>


      <div
        className="glass-bar shrink-0 space-y-3 border-t border-border/40 px-3 pt-4"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {/* active slider */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {activeItem.label}
            </span>
            {adj[active] !== DEFAULT_ADJUSTMENTS[active] && (
              <button
                type="button"
                onClick={() => setValue(DEFAULT_ADJUSTMENTS[active])}
                className="text-[11px] font-medium text-primary active:opacity-70"
              >
                Reset
              </button>
            )}
          </div>
          <Slider
            value={[adj[active]]}
            min={range.min}
            max={range.max}
            step={range.step}
            onPointerDown={() => {
              draggingRef.current = true
            }}
            onPointerUp={() => {
              draggingRef.current = false
              schedulePreview()
            }}
            onValueCommit={() => {
              draggingRef.current = false
              schedulePreview()
            }}
            onValueChange={(v) => setValue(v[0])}
          />
        </div>


        {/* items rail */}
        <div className="-mx-1 flex gap-1.5 overflow-x-auto perf-scroll px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map(({ key, label, icon: Icon }) => {
            const changed = adj[key] !== DEFAULT_ADJUSTMENTS[key]
            const isActive = active === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-medium transition active:scale-95',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-background/60 text-foreground/70',
                )}
              >
                <span className="relative">
                  <Icon className="size-[15px]" />
                  {changed && !isActive && (
                    <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-primary" />
                  )}
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </button>
            )
          })}
        </div>

        {/* group tabs */}
        <div className="flex gap-1 rounded-full bg-muted/60 p-1">
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
                'flex-1 rounded-full py-1.5 text-xs font-semibold transition',
                group === g.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground',
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
