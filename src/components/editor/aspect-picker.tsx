import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import sampleThumb from '@/assets/thumbs/thumb01.jpg.asset.json'

interface PhotoSize {
  label: string
  ratio: number
  w: number
  h: number
}

/** Mobile-photo oriented presets (no document/paper sizes). */
export const PHOTO_SIZES: PhotoSize[] = [
  { label: 'Square', ratio: 1, w: 1080, h: 1080 },
  { label: 'Portrait', ratio: 4 / 5, w: 1080, h: 1350 },
  { label: 'Story / Reel', ratio: 9 / 16, w: 1080, h: 1920 },
  { label: 'Widescreen', ratio: 16 / 9, w: 1920, h: 1080 },
  { label: 'Classic', ratio: 3 / 4, w: 1080, h: 1440 },
  { label: 'Landscape', ratio: 4 / 3, w: 1440, h: 1080 },
  { label: 'Photo tall', ratio: 2 / 3, w: 1080, h: 1620 },
  { label: 'Photo wide', ratio: 3 / 2, w: 1620, h: 1080 },
]

function ratioLabel(w: number, h: number) {
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a)
  const d = g(w, h) || 1
  return `${Math.round(w / d)}:${Math.round(h / d)}`
}

export function AspectPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  /** css background used for the tile previews */
  preview?: string
  onClose: () => void
  onPick: (ratio: number) => void
}) {
  const [w, setW] = useState('')
  const [h, setH] = useState('')

  if (!open) return null

  const cw = Number(w)
  const ch = Number(h)
  const customValid = cw >= 32 && ch >= 32 && cw <= 8000 && ch <= 8000

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-background/70 backdrop-blur-md">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />

      <div
        className="glass-panel relative max-h-[78vh] overflow-y-auto perf-scroll rounded-t-3xl border-t border-border/60 px-4 pb-4 pt-2 shadow-2xl"
        style={{ paddingBottom: 'calc(1rem + var(--safe-bottom))' }}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-border" />

        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full transition active:scale-95 hover:bg-accent"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h3 className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground">
            Custom size
          </h3>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
          <label className="min-w-0 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Width</span>
            <input
              inputMode="numeric"
              value={w}
              onChange={(e) => setW(e.target.value.replace(/[^0-9]/g, ''))}
              className="h-10 w-full rounded-xl border border-border/70 bg-secondary/40 px-3 text-center text-sm tabular-nums text-foreground outline-none transition focus:border-primary"
            />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Height</span>
            <input
              inputMode="numeric"
              value={h}
              onChange={(e) => setH(e.target.value.replace(/[^0-9]/g, ''))}
              className="h-10 w-full rounded-xl border border-border/70 bg-secondary/40 px-3 text-center text-sm tabular-nums text-foreground outline-none transition focus:border-primary"
            />
          </label>
          <span className="grid h-10 shrink-0 place-items-center rounded-xl border border-border/70 px-2.5 text-xs font-medium text-muted-foreground">
            px
          </span>
        </div>

        <button
          type="button"
          disabled={!customValid}
          onClick={() => onPick(cw / ch)}
          className="mt-2.5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:bg-secondary/60 disabled:text-muted-foreground"
        >
          {customValid ? `Create ${cw} × ${ch}` : 'Create custom size'}
        </button>

        <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide tracking-tight text-foreground">
          Popular photo sizes
        </h4>

        <div className="grid grid-cols-4 gap-2">
          {PHOTO_SIZES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onPick(s.ratio)}
              className="group flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-secondary/30 p-1.5 text-center transition hover:border-primary/50 hover:bg-primary/10 active:scale-95"
            >
              <span className="grid h-[46px] w-full place-items-center">
                <img
                  src={sampleThumb.url}
                  alt=""
                  aria-hidden
                  className={cn(
                    'rounded-none object-cover shadow-sm ring-1 ring-border/70 transition group-hover:ring-primary/60',
                  )}
                  style={{
                    height: s.ratio >= 1 ? `${Math.round(40 / s.ratio)}px` : '40px',
                    width: s.ratio >= 1 ? '40px' : `${Math.round(40 * s.ratio)}px`,
                  }}
                />


              </span>
              <span className="w-full truncate text-[10px] font-semibold leading-tight text-foreground">
                {s.label}
              </span>
              <span className="text-[9px] leading-tight tabular-nums text-muted-foreground">
                {ratioLabel(s.w, s.h)}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-full border border-border/60 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent active:scale-[0.98]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
