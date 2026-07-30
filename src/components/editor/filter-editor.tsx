import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { LiveSlider } from './live-slider'
import { cn } from '@/lib/utils'
import { loadImage } from '@/lib/image-ops'
import { renderAdjusted } from '@/lib/image-adjust'
import {
  FILTERS,
  FILTER_GROUPS,
  filterAdjustments,
  type FilterGroup,
  type FilterPreset,
} from '@/lib/filters'

interface Props {
  image: string
  onCancel: () => void
  onApply: (dataUrl: string) => void
}

export function FilterEditor({ image, onCancel, onApply }: Props) {
  const [group, setGroup] = useState<FilterGroup>('classic')
  const [selected, setSelected] = useState<FilterPreset | null>(null)
  const [intensity, setIntensity] = useState(100)
  const [preview, setPreview] = useState(image)
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const sourceRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const readoutRef = useRef<HTMLSpanElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)


  useEffect(() => {
    let alive = true
    loadImage(image).then((img) => {
      if (!alive) return
      sourceRef.current = img
      // build small thumbnails progressively
      let i = 0
      const step = () => {
        if (!alive) return
        const batch = FILTERS.slice(i, i + 6)
        if (!batch.length) return
        const next: Record<string, string> = {}
        for (const f of batch) {
          const canvas = renderAdjusted(img, filterAdjustments(f, 100), 96)
          next[f.id] = canvas.toDataURL('image/jpeg', 0.7)
        }
        setThumbs((p) => ({ ...p, ...next }))
        i += 6
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
    return () => {
      alive = false
    }
  }, [image])

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const img = sourceRef.current
      if (!img) return
      if (!selected) {
        setPreview(image)
        return
      }
      const canvas = renderAdjusted(img, filterAdjustments(selected, intensity), 900)
      setPreview(canvas.toDataURL('image/png'))
    })
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [selected, intensity, image])

  const items = useMemo(() => FILTERS.filter((f) => f.group === group), [group])

  function apply() {
    const img = sourceRef.current
    if (!img) return
    if (!selected) {
      onCancel()
      return
    }
    setBusy(true)
    try {
      const canvas = renderAdjusted(img, filterAdjustments(selected, intensity))
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
        <p className="text-sm font-bold">Filters</p>
        <button
          type="button"
          onClick={apply}
          disabled={busy}
          className="grid size-10 place-items-center rounded-full text-primary active:scale-95 disabled:opacity-50"
          aria-label="Apply"
        >
          <Check className="size-5" />
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-muted/30 p-3">
        <img
          ref={imgRef}
          src={preview}
          alt="Filter preview"
          className="max-h-full max-w-full object-contain"
        />

      </div>

      <div
        className="glass-bar shrink-0 space-y-3 border-t border-border/40 px-3 pt-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {selected && (
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{selected.name}</span>
              <span
                ref={readoutRef}
                className="font-mono text-xs tabular-nums text-muted-foreground"
              >
                {intensity}
              </span>
            </div>
            <LiveSlider
              value={intensity}
              min={0}
              max={100}
              step={1}
              onLive={(v) => {
                // DOM-only feedback while dragging: no state, no re-processing
                if (readoutRef.current) readoutRef.current.textContent = String(v)
                if (imgRef.current) imgRef.current.style.opacity = String(0.55 + (v / 100) * 0.45)
              }}
              onCommit={(v) => {
                if (imgRef.current) imgRef.current.style.opacity = ''
                setIntensity(v)
              }}
            />
          </div>
        )}


        <div className="flex gap-2 overflow-x-auto perf-scroll pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={cn(
              'flex w-[62px] shrink-0 flex-col items-center gap-1 text-[10px] font-medium',
              !selected ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'size-[62px] overflow-hidden rounded-xl border-2',
                !selected ? 'border-primary' : 'border-transparent',
              )}
            >
              <img src={image} alt="Original" className="size-full object-cover" />
            </span>
            <span className="truncate">None</span>
          </button>

          {items.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setSelected(f)
                setIntensity(100)
              }}
              className={cn(
                'flex w-[62px] shrink-0 flex-col items-center gap-1 text-[10px] font-medium',
                selected?.id === f.id ? 'text-primary' : 'text-foreground/80',
              )}
            >
              <span
                className={cn(
                  'size-[62px] overflow-hidden rounded-xl border-2 bg-muted',
                  selected?.id === f.id ? 'border-primary' : 'border-transparent',
                )}
              >
                {thumbs[f.id] ? (
                  <img src={thumbs[f.id]} alt={f.name} className="size-full object-cover" />
                ) : (
                  <span className="block size-full animate-pulse bg-muted" />
                )}
              </span>
              <span className="w-full truncate text-center">{f.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-6 pb-1">
          {FILTER_GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(g.key)}
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
