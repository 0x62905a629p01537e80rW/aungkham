import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Brush,
  Check,
  Eraser,
  HelpCircle,
  Maximize2,
  Redo2,
  Save,
  Search,
  Sparkles,
  Star,
  Undo2,
  Wand2,
} from 'lucide-react'
import { SliderField } from './control-fields'
import {
  autoRemoveEdges,
  magicErase,
  removeColorEverywhere,
  sampleColor,
  smoothEdge,
  softenEdges,
} from '@/lib/bg-remove'
import { cn } from '@/lib/utils'

type Tool = 'auto' | 'color' | 'magic' | 'manual' | 'repair' | 'zoom'

/** The last threshold-driven action, replayed live while the slider moves. */
type PendingOp =
  | { kind: 'edges' }
  | { kind: 'color'; r: number; g: number; b: number }
  | { kind: 'magic'; x: number; y: number }

interface BgRemoverProps {
  open: boolean
  src: string
  title?: string
  onClose: () => void
  onApply: (dataUrl: string) => void
}

const MAX_DIM = 1600
const HISTORY_LIMIT = 20
const BG_MODES = ['checker', 'white', 'black'] as const
const SMOOTH_LEVELS = [0, 1, 2, 3, 4, 5]

/** Full-screen eraser: auto cut-out, magic wand, manual erase, repair, zoom, smooth edge. */
export function BgRemover({ open, src, title = 'Eraser', onClose, onApply }: BgRemoverProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const originalRef = useRef<HTMLCanvasElement | null>(null)
  const baseRef = useRef<ImageData | null>(null)
  const smoothBaseRef = useRef<ImageData | null>(null)
  const undoStack = useRef<ImageData[]>([])
  const redoStack = useRef<ImageData[]>([])
  const drawing = useRef(false)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; scale: number; cx: number; cy: number; tx: number; ty: number } | null>(null)

  const [tool, setTool] = useState<Tool>('auto')
  const [tolerance, setTolerance] = useState(28)
  const [size, setSize] = useState(30)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState<PendingOp | null>(null)
  const [phase, setPhase] = useState<'edit' | 'smooth'>('edit')
  const [smooth, setSmooth] = useState(1)
  const [showHelp, setShowHelp] = useState(false)
  const [counts, setCounts] = useState({ undo: 0, redo: 0 })
  const [bgMode, setBgMode] = useState<(typeof BG_MODES)[number]>('checker')
  const [offsetCursor, setOffsetCursor] = useState(true)
  const [offsetY, setOffsetY] = useState(() => {
    if (typeof window === 'undefined') return 120
    const saved = Number(window.localStorage.getItem('bgr-cursor-offset'))
    return Number.isFinite(saved) && saved >= 40 && saved <= 260 ? saved : 120
  })
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  const changeOffset = (v: number) => {
    setOffsetY(v)
    if (typeof window !== 'undefined') window.localStorage.setItem('bgr-cursor-offset', String(v))
  }

  const ctxOf = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null

  const sync = () => setCounts({ undo: undoStack.current.length, redo: redoStack.current.length })

  const snapshot = useCallback(() => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return null
    const shot = ctx.getImageData(0, 0, canvas.width, canvas.height)
    undoStack.current.push(shot)
    if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift()
    redoStack.current = []
    sync()
    return shot
  }, [])

  // Load the source image into the working canvas each time the editor opens.
  useEffect(() => {
    if (!open) return
    setReady(false)
    setPhase('edit')
    setPending(null)
    setSmooth(1)
    undoStack.current = []
    redoStack.current = []
    baseRef.current = null
    smoothBaseRef.current = null
    setCounts({ undo: 0, redo: 0 })
    setView({ scale: 1, tx: 0, ty: 0 })
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx?.clearRect(0, 0, w, h)
      ctx?.drawImage(img, 0, 0, w, h)
      const orig = document.createElement('canvas')
      orig.width = w
      orig.height = h
      orig.getContext('2d')?.drawImage(canvas, 0, 0)
      originalRef.current = orig
      setReady(true)
    }
    img.src = src
  }, [open, src])

  /** Replay the pending threshold op from its saved baseline. */
  const applyOp = useCallback((op: PendingOp, tol: number, base: ImageData) => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    const data = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height)
    if (op.kind === 'edges') autoRemoveEdges(data, tol)
    else if (op.kind === 'color') removeColorEverywhere(data, op.r, op.g, op.b, tol)
    else magicErase(data, op.x, op.y, tol)
    ctx.putImageData(data, 0, 0)
  }, [])

  /** Start a new threshold op: snapshot for undo, remember baseline, apply now. */
  const startOp = (op: PendingOp) => {
    const base = snapshot()
    if (!base) return
    baseRef.current = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height)
    setPending(op)
    applyOp(op, tolerance, baseRef.current)
  }

  const onTolerance = (v: number) => {
    setTolerance(v)
    if (pending && baseRef.current) applyOp(pending, v, baseRef.current)
  }

  const radiusPx = () => {
    const canvas = canvasRef.current
    if (!canvas) return 20
    return ((size / 100) * 0.12 + 0.01) * Math.max(canvas.width, canvas.height)
  }

  /** Screen point of the actual working tip (finger position lifted by the offset). */
  const tipOf = (clientX: number, clientY: number) => ({
    x: clientX,
    y: offsetCursor && tool !== 'zoom' ? clientY - offsetY : clientY,
  })

  const toImageCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    const tip = tipOf(clientX, clientY)
    return {
      x: ((tip.x - rect.left) / rect.width) * canvas.width,
      y: ((tip.y - rect.top) / rect.height) * canvas.height,
    }
  }

  /** Paint one dab at image coords. */
  const dab = (x: number, y: number) => {
    const ctx = ctxOf()
    if (!ctx) return
    const radius = radiusPx()
    if (tool === 'repair') {
      const orig = originalRef.current
      if (!orig) return
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(orig, 0, 0)
      ctx.restore()
      return
    }
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  /** Paint a continuous stroke by interpolating dabs between two points. */
  const brush = (x: number, y: number, from?: { x: number; y: number } | null) => {
    if (!from) {
      dab(x, y)
      return
    }
    const step = Math.max(1, radiusPx() * 0.3)
    const dist = Math.hypot(x - from.x, y - from.y)
    const steps = Math.min(400, Math.ceil(dist / step))
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      dab(from.x + (x - from.x) * t, from.y + (y - from.y) * t)
    }
    if (steps === 0) dab(x, y)
  }

  const undo = () => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    const prev = undoStack.current.pop()
    if (!prev || !ctx || !canvas) return
    redoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(prev, 0, 0)
    setPending(null)
    sync()
  }

  const redo = () => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    const next = redoStack.current.pop()
    if (!next || !ctx || !canvas) return
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(next, 0, 0)
    setPending(null)
    sync()
  }

  const zoomBy = (factor: number) => {
    setView((v) => ({ ...v, scale: Math.min(8, Math.max(1, v.scale * factor)) }))
  }

  const resetView = () => setView({ scale: 1, tx: 0, ty: 0 })

  /** Move on to the smooth-edge step. */
  const goSmooth = () => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    softenEdges(data)
    smoothBaseRef.current = data
    setPhase('smooth')
    applySmooth(1)
  }

  const applySmooth = (level: number) => {
    setSmooth(level)
    const ctx = ctxOf()
    const base = smoothBaseRef.current
    if (!ctx || !base) return
    const data = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height)
    smoothEdge(data, level)
    ctx.putImageData(data, 0, 0)
  }

  const saveResult = () => {
    const canvas = canvasRef.current
    if (canvas) onApply(canvas.toDataURL('image/png'))
    onClose()
  }

  if (!open || typeof document === 'undefined') return null

  const tools: { key: Tool; label: string; icon: typeof Wand2 }[] = [
    { key: 'auto', label: 'AI-Auto', icon: Sparkles },
    { key: 'color', label: 'Auto-Color', icon: Star },
    { key: 'magic', label: 'Magic', icon: Wand2 },
    { key: 'manual', label: 'Manual', icon: Eraser },
    { key: 'repair', label: 'Repair', icon: Brush },
    { key: 'zoom', label: 'Zoom', icon: Search },
  ]

  const stageBg = bgMode === 'checker' ? 'checker-grid' : bgMode === 'white' ? 'bg-white' : 'bg-black'

  const onDown = (e: React.PointerEvent) => {
    if (phase === 'smooth') return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      drawing.current = false
      const [a, b] = [...pointers.current.values()]
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: view.scale,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
        tx: view.tx,
        ty: view.ty,
      }
      return
    }

    if (tool === 'zoom') return
    const p = toImageCoords(e.clientX, e.clientY)
    if (!p) return

    // Tap-driven threshold tools: sample where the user tapped.
    if (tool === 'color') {
      const ctx = ctxOf()
      const canvas = canvasRef.current
      if (!ctx || !canvas) return
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const [r, g, b] = sampleColor(data, p.x, p.y)
      startOp({ kind: 'color', r, g, b })
      return
    }
    if (tool === 'magic') {
      setCursor({ x: e.clientX, y: e.clientY })
      startOp({ kind: 'magic', x: p.x, y: p.y })
      return
    }
    if (tool === 'auto') return

    snapshot()
    setPending(null)
    drawing.current = true
    lastPoint.current = p
    brush(p.x, p.y)
    setCursor({ x: e.clientX, y: e.clientY })
  }

  const onMove = (e: React.PointerEvent) => {
    if (phase === 'smooth') return
    const prev = pointers.current.get(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      const scale = Math.min(8, Math.max(1, (pinch.current.scale * dist) / (pinch.current.dist || 1)))
      setView({
        scale,
        tx: pinch.current.tx + (cx - pinch.current.cx),
        ty: pinch.current.ty + (cy - pinch.current.cy),
      })
      return
    }

    if (tool === 'zoom') {
      if (prev && pointers.current.size === 1) {
        const dx = e.clientX - prev.x
        const dy = e.clientY - prev.y
        setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }))
      }
      return
    }

    if ((tool === 'manual' || tool === 'repair' || tool === 'magic') && pointers.current.size === 1) {
      setCursor({ x: e.clientX, y: e.clientY })
    }
    if (!drawing.current) return
    // Use coalesced samples so fast strokes stay pixel-accurate.
    const events =
      typeof e.nativeEvent.getCoalescedEvents === 'function'
        ? e.nativeEvent.getCoalescedEvents()
        : [e.nativeEvent]
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const p = toImageCoords(ev.clientX, ev.clientY)
      if (!p) continue
      brush(p.x, p.y, lastPoint.current)
      lastPoint.current = p
    }
  }

  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    drawing.current = false
    lastPoint.current = null
    if (tool !== 'magic') setCursor(null)
  }

  const sliderLabel =
    tool === 'manual' || tool === 'repair'
      ? 'Manual Size'
      : tool === 'magic'
        ? 'Expectant Magic Size'
        : 'Threshold of Similar Color'

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-background">
      <header className="glass-bar flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => (phase === 'smooth' ? setPhase('edit') : onClose())}
          aria-label="Back"
          className="flex items-center gap-1 rounded-xl px-1 text-primary transition active:scale-95"
        >
          <ArrowLeft className="size-5" />
          <span className="text-sm font-semibold">{phase === 'smooth' ? 'Smooth Edge' : title}</span>
        </button>

        <div className="flex items-center gap-1">
          {phase === 'edit' ? (
            <button
              type="button"
              onClick={() => setOffsetCursor((v) => !v)}
              className="flex items-center gap-1 rounded-xl px-1 transition active:scale-95"
            >
              <span className="text-[10px] font-medium text-muted-foreground">Cursor Offset</span>
              <span
                className={cn(
                  'size-3 rounded-full border',
                  offsetCursor ? 'border-primary bg-primary' : 'border-muted-foreground',
                )}
              />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            aria-label="Help"
            className="flex flex-col items-center rounded-xl px-1 transition active:scale-95"
          >
            <HelpCircle className="size-5" />
            <span className="text-[9px] text-muted-foreground">Help</span>
          </button>

          <button
            type="button"
            aria-label={phase === 'edit' ? 'Done' : 'Save'}
            onClick={phase === 'edit' ? goSmooth : saveResult}
            className="flex flex-col items-center rounded-xl px-1 text-primary transition active:scale-95"
          >
            {phase === 'edit' ? <Check className="size-5" /> : <Save className="size-5" />}
            <span className="text-[9px]">{phase === 'edit' ? 'Done' : 'Save'}</span>
          </button>
        </div>
      </header>

      <div className={cn('relative flex min-h-0 flex-1 items-center justify-center overflow-hidden', stageBg)}>
        <div
          className="flex h-full w-full items-center justify-center p-3"
          style={{
            transform: `translate3d(${view.tx}px, ${view.ty}px, 0) scale(${view.scale})`,
            transformOrigin: 'center center',
            touchAction: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full touch-none select-none object-contain"
            style={{ opacity: ready ? 1 : 0 }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={() => {
              if (tool !== 'magic') setCursor(null)
            }}
          />
        </div>

        {/* Brush cursor preview with offset crosshair */}
        {cursor && phase === 'edit' && (tool === 'manual' || tool === 'repair') ? (
          <div className="pointer-events-none fixed inset-0">
            <div
              className="absolute rounded-full border-2 border-red-500/80"
              style={{
                left: cursor.x,
                top: offsetCursor ? cursor.y - 56 : cursor.y,
                width: radiusPx() * 2 * canvasDisplayRatio(canvasRef.current),
                height: radiusPx() * 2 * canvasDisplayRatio(canvasRef.current),
                transform: 'translate(-50%, -50%)',
              }}
            />
            {offsetCursor ? (
              <div
                className="absolute size-3 rounded-full bg-red-500/70"
                style={{ left: cursor.x, top: cursor.y, transform: 'translate(-50%, -50%)' }}
              />
            ) : null}
          </div>
        ) : null}

        {/* Magic wand target cursor */}
        {cursor && phase === 'edit' && tool === 'magic' ? (
          <div className="pointer-events-none fixed inset-0">
            <div
              className="absolute"
              style={{
                left: cursor.x,
                top: offsetCursor ? cursor.y - 56 : cursor.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative size-11 rounded-full border-2 border-sky-400/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]">
                <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-sky-400/90" />
                <span className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-sky-400/90" />
                <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-sky-400/90" />
                <span className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-sky-400/90" />
                <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400" />
              </div>
            </div>
            {offsetCursor ? (
              <div
                className="absolute size-3 rounded-full bg-sky-400/70"
                style={{ left: cursor.x, top: cursor.y, transform: 'translate(-50%, -50%)' }}
              />
            ) : null}
          </div>
        ) : null}

        {/* Zoom quick controls */}
        {phase === 'edit' ? (
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => zoomBy(1.4)}
              className="glass-tile flex size-9 items-center justify-center rounded-xl text-sm font-bold"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => zoomBy(1 / 1.4)}
              className="glass-tile flex size-9 items-center justify-center rounded-xl text-sm font-bold"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              onClick={resetView}
              className="glass-tile flex size-9 items-center justify-center rounded-xl"
              aria-label="Fit"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      {phase === 'smooth' ? (
        <div className="glass-bar flex items-center gap-3 px-3 pb-4 pt-3">
          <button
            type="button"
            onClick={() => setBgMode(BG_MODES[(BG_MODES.indexOf(bgMode) + 1) % BG_MODES.length])}
            className="flex flex-col items-center gap-0.5"
          >
            <span
              className={cn(
                'size-7 rounded-md border border-border',
                bgMode === 'checker' ? 'checker-swatch' : bgMode === 'white' ? 'bg-white' : 'bg-black',
              )}
            />
            <span className="text-[9px] text-muted-foreground">BgColor</span>
          </button>
          <span className="text-xs font-medium text-muted-foreground">Smooth</span>
          <div className="flex flex-1 items-center gap-1">
            {SMOOTH_LEVELS.map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => applySmooth(lv)}
                className={cn(
                  'h-10 flex-1 rounded-xl border text-xs font-semibold transition active:scale-95',
                  smooth === lv
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground',
                )}
              >
                {lv}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-bar space-y-2 px-3 pb-4 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBgMode(BG_MODES[(BG_MODES.indexOf(bgMode) + 1) % BG_MODES.length])}
              className="flex flex-col items-center gap-0.5"
            >
              <span
                className={cn(
                  'size-7 rounded-md border border-border',
                  bgMode === 'checker' ? 'checker-swatch' : bgMode === 'white' ? 'bg-white' : 'bg-black',
                )}
              />
              <span className="text-[9px] text-muted-foreground">BgColor</span>
            </button>

            <div className="min-w-0 flex-1">
              {tool === 'manual' || tool === 'repair' ? (
                <SliderField label={sliderLabel} value={size} min={4} max={100} onChange={setSize} />
              ) : (
                <SliderField label={sliderLabel} value={tolerance} min={2} max={80} onChange={onTolerance} />
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={undo}
                disabled={!counts.undo}
                aria-label="Undo"
                className="flex flex-col items-center rounded-xl px-1 transition active:scale-95 disabled:opacity-40"
              >
                <Undo2 className="size-5" />
                <span className="text-[9px] text-muted-foreground">{counts.undo || 'Undo'}</span>
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!counts.redo}
                aria-label="Redo"
                className="flex flex-col items-center rounded-xl px-1 transition active:scale-95 disabled:opacity-40"
              >
                <Redo2 className="size-5" />
                <span className="text-[9px] text-muted-foreground">{counts.redo || 'Redo'}</span>
              </button>
            </div>
          </div>

          {tool === 'auto' ? (
            <button
              type="button"
              onClick={() => startOp({ kind: 'edges' })}
              className="h-10 w-full rounded-xl bg-primary text-xs font-semibold text-primary-foreground transition active:scale-95"
            >
              Remove background
            </button>
          ) : null}
          {tool === 'color' ? (
            <p className="text-center text-[10px] text-muted-foreground">
              Tap a color on the image to erase it everywhere
            </p>
          ) : null}
          {tool === 'magic' ? (
            <p className="text-center text-[10px] text-muted-foreground">
              Tap an area to erase connected pixels
            </p>
          ) : null}

          <div className="flex items-center gap-1 overflow-x-auto perf-scroll">
            {tools.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTool(t.key)
                  setPending(null)
                }}
                className={cn(
                  'flex h-14 min-w-[54px] flex-1 flex-col items-center justify-center gap-1 rounded-xl border text-[9px] font-semibold transition active:scale-95',
                  tool === t.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground',
                )}
              >
                <t.icon className="size-5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showHelp ? (
        <div
          className="absolute inset-0 z-10 flex items-end bg-black/50 p-4"
          onClick={() => setShowHelp(false)}
        >
          <div className="glass-panel w-full space-y-2 rounded-2xl p-4 text-xs">
            <p className="text-sm font-semibold">How to use</p>
            <p><b>AI-Auto</b> — removes the outer background in one tap.</p>
            <p><b>Auto-Color</b> — tap a color to erase it everywhere; drag the threshold to fine-tune.</p>
            <p><b>Magic</b> — tap an area to erase connected pixels of a similar color.</p>
            <p><b>Manual / Repair</b> — brush to erase or bring pixels back.</p>
            <p><b>Zoom</b> — drag to pan, pinch or use +/− to zoom.</p>
            <p><b>Done</b> — go to Smooth Edge, pick 0–5, then Save.</p>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}

/** Ratio between the canvas' displayed CSS size and its pixel size (before zoom). */
function canvasDisplayRatio(canvas: HTMLCanvasElement | null) {
  if (!canvas || !canvas.width) return 1
  const rect = canvas.getBoundingClientRect()
  return rect.width / canvas.width
}
