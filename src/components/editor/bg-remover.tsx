import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Brush,
  Check,
  Eraser,
  Maximize2,
  Redo2,
  Search,
  Sparkles,
  Star,
  Undo2,
  Wand2,
} from 'lucide-react'
import { SliderField } from './control-fields'
import { autoRemoveColor, autoRemoveEdges, magicErase, softenEdges } from '@/lib/bg-remove'
import { cn } from '@/lib/utils'

type Tool = 'auto' | 'color' | 'magic' | 'manual' | 'repair' | 'zoom'

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

/** Full-screen background remover: auto cut-out, magic wand, manual erase, repair, zoom. */
export function BgRemover({ open, src, title = 'Remove background', onClose, onApply }: BgRemoverProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const originalRef = useRef<HTMLCanvasElement | null>(null)
  const undoStack = useRef<ImageData[]>([])
  const redoStack = useRef<ImageData[]>([])
  const drawing = useRef(false)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; scale: number; cx: number; cy: number; tx: number; ty: number } | null>(null)

  const [tool, setTool] = useState<Tool>('auto')
  const [tolerance, setTolerance] = useState(28)
  const [size, setSize] = useState(30)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [counts, setCounts] = useState({ undo: 0, redo: 0 })
  const [bgMode, setBgMode] = useState<(typeof BG_MODES)[number]>('checker')
  const [offsetCursor, setOffsetCursor] = useState(true)
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const [cursor, setCursor] = useState<{ x: number; y: number; r: number } | null>(null)

  const ctxOf = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null

  const sync = () => setCounts({ undo: undoStack.current.length, redo: redoStack.current.length })

  const snapshot = useCallback(() => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift()
    redoStack.current = []
    sync()
  }, [])

  // Load the source image into the working canvas each time the editor opens.
  useEffect(() => {
    if (!open) return
    setReady(false)
    undoStack.current = []
    redoStack.current = []
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

  const runAuto = (mode: 'edges' | 'color') => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    setBusy(true)
    snapshot()
    requestAnimationFrame(() => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const next = mode === 'edges' ? autoRemoveEdges(data, tolerance) : autoRemoveColor(data, tolerance)
      ctx.putImageData(next, 0, 0)
      setBusy(false)
    })
  }

  const radiusPx = () => {
    const canvas = canvasRef.current
    if (!canvas) return 20
    return ((size / 100) * 0.12 + 0.01) * Math.max(canvas.width, canvas.height)
  }

  const toImageCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const y = offsetCursor && tool !== 'zoom' ? clientY - 56 : clientY
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((y - rect.top) / rect.height) * canvas.height,
    }
  }

  const brush = (x: number, y: number) => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
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

  const undo = () => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    const prev = undoStack.current.pop()
    if (!prev || !ctx || !canvas) return
    redoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(prev, 0, 0)
    sync()
  }

  const redo = () => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    const next = redoStack.current.pop()
    if (!next || !ctx || !canvas) return
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(next, 0, 0)
    sync()
  }

  const zoomBy = (factor: number) => {
    setView((v) => ({ ...v, scale: Math.min(8, Math.max(1, v.scale * factor)) }))
  }

  const resetView = () => setView({ scale: 1, tx: 0, ty: 0 })

  if (!open || typeof document === 'undefined') return null

  const tools: { key: Tool; label: string; icon: typeof Wand2 }[] = [
    { key: 'auto', label: 'AI-Auto', icon: Sparkles },
    { key: 'color', label: 'Auto-Color', icon: Star },
    { key: 'magic', label: 'Magic', icon: Wand2 },
    { key: 'manual', label: 'Manual', icon: Eraser },
    { key: 'repair', label: 'Repair', icon: Brush },
    { key: 'zoom', label: 'Zoom', icon: Search },
  ]

  const stageBg =
    bgMode === 'checker' ? 'checker-grid' : bgMode === 'white' ? 'bg-white' : 'bg-black'

  const onDown = (e: React.PointerEvent) => {
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
    if (tool === 'auto' || tool === 'color') return
    snapshot()
    if (tool === 'magic') {
      const ctx = ctxOf()
      const canvas = canvasRef.current
      if (!ctx || !canvas) return
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.putImageData(magicErase(data, p.x, p.y, tolerance), 0, 0)
      return
    }
    drawing.current = true
    brush(p.x, p.y)
    setCursor({ x: e.clientX, y: e.clientY, r: 0 })
  }

  const onMove = (e: React.PointerEvent) => {
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

    if ((tool === 'manual' || tool === 'repair') && pointers.current.size === 1) {
      setCursor({ x: e.clientX, y: e.clientY, r: 0 })
    }
    if (!drawing.current) return
    const p = toImageCoords(e.clientX, e.clientY)
    if (p) brush(p.x, p.y)
  }

  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    drawing.current = false
    setCursor(null)
  }

  const sliderLabel =
    tool === 'manual' || tool === 'repair'
      ? 'Brush size'
      : tool === 'magic'
        ? 'Expectant magic size'
        : 'Threshold of similar color'

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-background">
      <header className="glass-bar flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-xl transition active:scale-95"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="truncate text-sm font-semibold">{title}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOffsetCursor((v) => !v)}
            className={cn(
              'h-9 rounded-xl px-2 text-[10px] font-semibold transition active:scale-95',
              offsetCursor ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            Cursor offset
          </button>
          <button
            type="button"
            aria-label="Done"
            onClick={() => {
              const canvas = canvasRef.current
              const ctx = ctxOf()
              if (canvas && ctx) {
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
                softenEdges(data)
                ctx.putImageData(data, 0, 0)
                onApply(canvas.toDataURL('image/png'))
              }
              onClose()
            }}
            className="flex size-10 items-center justify-center rounded-xl text-primary transition active:scale-95"
          >
            <Check className="size-6" />
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
            onPointerLeave={() => setCursor(null)}
          />
        </div>

        {/* Brush cursor preview with offset crosshair */}
        {cursor && (tool === 'manual' || tool === 'repair') ? (
          <div className="pointer-events-none fixed inset-0">
            <div
              className="absolute rounded-full border-2 border-red-500/80"
              style={{
                left: cursor.x,
                top: offsetCursor ? cursor.y - 56 : cursor.y,
                width: radiusPx() * 2 * view.scale * canvasDisplayRatio(canvasRef.current),
                height: radiusPx() * 2 * view.scale * canvasDisplayRatio(canvasRef.current),
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

        {/* Zoom quick controls */}
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
      </div>

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
              <SliderField label={sliderLabel} value={tolerance} min={2} max={80} onChange={setTolerance} />
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
              <span className="text-[9px] text-muted-foreground">{counts.undo}</span>
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!counts.redo}
              aria-label="Redo"
              className="flex flex-col items-center rounded-xl px-1 transition active:scale-95 disabled:opacity-40"
            >
              <Redo2 className="size-5" />
              <span className="text-[9px] text-muted-foreground">{counts.redo}</span>
            </button>
          </div>
        </div>

        {tool === 'auto' || tool === 'color' ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => runAuto(tool === 'auto' ? 'edges' : 'color')}
            className="h-10 w-full rounded-xl bg-primary text-xs font-semibold text-primary-foreground transition active:scale-95 disabled:opacity-60"
          >
            {tool === 'auto' ? 'Remove background' : 'Remove this color everywhere'}
          </button>
        ) : null}

        <div className="flex items-center gap-1 overflow-x-auto">
          {tools.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTool(t.key)}
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
    </div>,
    document.body,
  )
}

/** Ratio between the canvas' displayed CSS size and its pixel size (before zoom). */
function canvasDisplayRatio(canvas: HTMLCanvasElement | null) {
  if (!canvas || !canvas.width) return 1
  const rect = canvas.getBoundingClientRect()
  return rect.width / canvas.width / 1
}
