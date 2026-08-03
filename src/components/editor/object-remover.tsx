import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Eraser, Loader2, Redo2, Undo2, X, Brush } from 'lucide-react'

import { cn } from '@/lib/utils'
import { loadImage } from '@/lib/image-ops'
import { dilate, growMaskByColor, inpaint, type InpaintQuality } from '@/lib/inpaint'

type Mode = 'classic' | 'seamless' | 'auto'

const MODES: { key: Mode; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'seamless', label: 'Seamless removal' },
  { key: 'auto', label: 'Auto' },
]

const MAX_SIDE = 1600
const HISTORY_LIMIT = 10

interface Props {
  open: boolean
  src: string
  onClose: () => void
  onApply: (dataUrl: string) => void
}

/** Brush-away unwanted objects, text or watermarks with content-aware fill. */
export function ObjectRemover({ open, src, onClose, onApply }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const workRef = useRef<HTMLCanvasElement | null>(null)
  const viewRef = useRef<HTMLCanvasElement | null>(null)
  const maskRef = useRef<HTMLCanvasElement | null>(null)
  const loupeRef = useRef<HTMLCanvasElement | null>(null)

  const history = useRef<ImageData[]>([])
  const future = useRef<ImageData[]>([])
  const painting = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const touched = useRef(false)

  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>('seamless')
  const [range, setRange] = useState(40)
  const [erasing, setErasing] = useState(false)
  const [hist, setHist] = useState({ undo: false, redo: false })
  const [loupe, setLoupe] = useState<{ side: 'left' | 'right' } | null>(null)

  /** Repaint the visible canvas from the working pixels + current mask. */
  const repaint = useCallback(() => {
    const view = viewRef.current
    const work = workRef.current
    const mask = maskRef.current
    if (!view || !work || !mask) return
    const ctx = view.getContext('2d')!
    ctx.clearRect(0, 0, view.width, view.height)
    ctx.drawImage(work, 0, 0)
    ctx.save()
    ctx.globalAlpha = 0.55
    ctx.drawImage(mask, 0, 0)
    ctx.restore()
  }, [])

  // Load the source image into the working buffers.
  useEffect(() => {
    if (!open || !src) return
    let alive = true
    setReady(false)
    history.current = []
    future.current = []
    touched.current = false
    setHist({ undo: false, redo: false })
    loadImage(src).then((img) => {
      if (!alive) return
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.max(1, Math.round(img.naturalWidth * scale))
      const h = Math.max(1, Math.round(img.naturalHeight * scale))
      for (const ref of [workRef, viewRef, maskRef]) {
        const c = ref.current
        if (!c) continue
        c.width = w
        c.height = h
        c.getContext('2d')!.clearRect(0, 0, w, h)
      }
      workRef.current?.getContext('2d')!.drawImage(img, 0, 0, w, h)
      setReady(true)
      repaint()
    })
    return () => {
      alive = false
    }
  }, [open, src, repaint])

  if (!open) return null

  const toCanvas = (e: React.PointerEvent) => {
    const view = viewRef.current!
    const rect = view.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * view.width,
      y: ((e.clientY - rect.top) / rect.height) * view.height,
      rect,
    }
  }

  const brushPx = () => {
    const view = viewRef.current
    if (!view) return range
    const rect = view.getBoundingClientRect()
    return (range * view.width) / Math.max(1, rect.width)
  }

  const strokeTo = (x: number, y: number) => {
    const mask = maskRef.current
    if (!mask) return
    const ctx = mask.getContext('2d')!
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brushPx()
    ctx.strokeStyle = '#ff7043'
    ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over'
    ctx.beginPath()
    const from = last.current ?? { x, y }
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
    last.current = { x, y }
    repaint()
  }

  const drawLoupe = (cx: number, cy: number) => {
    const c = loupeRef.current
    const view = viewRef.current
    if (!c || !view) return
    const ctx = c.getContext('2d')!
    const zoom = 2.4
    const size = c.width / zoom
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.drawImage(view, cx - size / 2, cy - size / 2, size, size, 0, 0, c.width, c.height)
  }

  const down = (e: React.PointerEvent) => {
    if (!ready || busy) return
    e.currentTarget.setPointerCapture(e.pointerId)
    painting.current = true
    const { x, y, rect } = toCanvas(e)
    last.current = null
    setLoupe({ side: e.clientX - rect.left > rect.width / 2 ? 'left' : 'right' })
    strokeTo(x, y)
    drawLoupe(x, y)
  }

  const move = (e: React.PointerEvent) => {
    if (!painting.current) return
    const { x, y, rect } = toCanvas(e)
    setLoupe({ side: e.clientX - rect.left > rect.width / 2 ? 'left' : 'right' })
    strokeTo(x, y)
    drawLoupe(x, y)
  }

  const up = async () => {
    if (!painting.current) return
    painting.current = false
    last.current = null
    setLoupe(null)
    if (erasing) return
    await runRemoval()
  }

  const runRemoval = async () => {
    const work = workRef.current
    const mask = maskRef.current
    if (!work || !mask) return
    const w = work.width
    const h = work.height
    const mctx = mask.getContext('2d')!
    const md = mctx.getImageData(0, 0, w, h).data
    let hasMask = false
    let flags: Uint8Array<ArrayBufferLike> = new Uint8Array(w * h)
    for (let p = 0; p < w * h; p += 1) {
      if (md[p * 4 + 3] > 24) {
        flags[p] = 255
        hasMask = true
      }
    }
    if (!hasMask) return

    setBusy(true)
    await new Promise((r) => setTimeout(r, 20))
    try {
      const wctx = work.getContext('2d', { willReadFrequently: true })!
      const before = wctx.getImageData(0, 0, w, h)
      history.current.push(new ImageData(new Uint8ClampedArray(before.data), w, h))
      if (history.current.length > HISTORY_LIMIT) history.current.shift()
      future.current = []

      const img = wctx.getImageData(0, 0, w, h)
      if (mode === 'auto') flags = growMaskByColor(img, flags, 30)
      else flags = dilate(flags, w, h, 2)
      const quality: InpaintQuality = mode === 'classic' ? 'classic' : 'seamless'
      wctx.putImageData(inpaint(img, flags, quality), 0, 0)
      touched.current = true
      setHist({ undo: history.current.length > 0, redo: false })
    } finally {
      mctx.clearRect(0, 0, w, h)
      setBusy(false)
      repaint()
    }
  }

  const undo = () => {
    const work = workRef.current
    if (!work || !history.current.length) return
    const ctx = work.getContext('2d', { willReadFrequently: true })!
    const current = ctx.getImageData(0, 0, work.width, work.height)
    future.current.push(current)
    ctx.putImageData(history.current.pop()!, 0, 0)
    setHist({ undo: history.current.length > 0, redo: true })
    repaint()
  }

  const redo = () => {
    const work = workRef.current
    if (!work || !future.current.length) return
    const ctx = work.getContext('2d', { willReadFrequently: true })!
    history.current.push(ctx.getImageData(0, 0, work.width, work.height))
    ctx.putImageData(future.current.pop()!, 0, 0)
    setHist({ undo: true, redo: future.current.length > 0 })
    repaint()
  }

  const apply = () => {
    const work = workRef.current
    if (!work) return
    onApply(work.toDataURL('image/png'))
    onClose()
  }

  const iconBtn =
    'grid size-9 place-items-center rounded-xl text-foreground/80 transition active:scale-95 disabled:opacity-30'

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background">
      {/* top bar */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Undo" className={iconBtn} disabled={!hist.undo} onClick={undo}>
            <Undo2 className="size-[18px]" />
          </button>
          <button type="button" aria-label="Redo" className={iconBtn} disabled={!hist.redo} onClick={redo}>
            <Redo2 className="size-[18px]" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Brush"
            onClick={() => setErasing(false)}
            className={cn(iconBtn, !erasing && 'bg-primary/15 text-primary')}
          >
            <Brush className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Erase selection"
            onClick={() => setErasing(true)}
            className={cn(iconBtn, erasing && 'bg-primary/15 text-primary')}
          >
            <Eraser className="size-[18px]" />
          </button>
        </div>
      </div>

      {/* canvas */}
      <div ref={wrapRef} className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
        <canvas ref={workRef} className="hidden" />
        <canvas ref={maskRef} className="hidden" />
        <canvas
          ref={viewRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="max-h-full max-w-full touch-none rounded-lg"
          style={{ objectFit: 'contain' }}
        />

        {loupe && (
          <canvas
            ref={loupeRef}
            width={150}
            height={150}
            className={cn(
              'pointer-events-none absolute top-3 size-[110px] rounded-full border-2 border-border bg-background shadow-xl',
              loupe.side === 'left' ? 'left-3' : 'right-3',
            )}
          />
        )}
        {!loupe && <canvas ref={loupeRef} width={150} height={150} className="hidden" />}

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-background/40 backdrop-blur-[1px]">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* range */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="w-12 shrink-0 text-[11px] font-semibold text-muted-foreground">Range</span>
        <input
          type="range"
          min={8}
          max={110}
          value={range}
          onChange={(e) => setRange(Number(e.target.value))}
          className="h-1 w-full flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
        />
      </div>

      {/* modes + confirm */}
      <div
        className="flex items-center gap-1 border-t border-border/70 px-2 py-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        <button type="button" aria-label="Cancel" className={iconBtn} onClick={onClose}>
          <X className="size-5" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={cn(
                'relative rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition',
                mode === m.key ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {m.label}
              {mode === m.key && (
                <span className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        <button type="button" aria-label="Apply" className={iconBtn} onClick={apply}>
          <Check className="size-5 text-primary" />
        </button>
      </div>
    </div>
  )
}
