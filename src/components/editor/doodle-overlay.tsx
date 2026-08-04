import { useEffect, useRef, type MutableRefObject, type PointerEvent } from 'react'
import {
  ArrowUpRight,
  Check,
  Circle,
  Eraser,
  Hand,
  Highlighter,
  Minus,
  MoreHorizontal,
  Pen,
  PenLine,
  Redo2,
  RotateCcw,
  Scribble,
  SlidersHorizontal,
  Sparkles,
  SprayCan,
  Square,
  Undo2,
  Waves,
  X,
} from 'lucide-react'

import { SliderField } from './control-fields'
import { ColorPickerPopover } from './color-picker'
import { cn } from '@/lib/utils'

export type PenKind = 'pen' | 'marker' | 'neon' | 'dashed' | 'spray' | 'calligraphy' | 'eraser'

/** Markup shapes drawn by dragging (Samsung-style screenshot markup). */
export type MarkShape =
  | 'free'
  | 'line'
  | 'wave'
  | 'dashed'
  | 'arrow'
  | 'rect'
  | 'rectFill'
  | 'ellipse'
  | 'ellipseFill'

export interface DoodleBrush {
  kind: PenKind
  color: string
  size: number
  opacity: number
  /** Markup shape; 'free' keeps freehand drawing. */
  shape: MarkShape
}

export interface DoodleControls {
  undo: () => void
  redo: () => void
  clear: () => void
}

export const DEFAULT_DOODLE: DoodleBrush = {
  kind: 'pen',
  color: '#ff2d55',
  size: 12,
  opacity: 100,
  shape: 'free',
}


const MAX_DIM = 1800

interface DoodleOverlayProps {
  initial?: string
  brush: DoodleBrush
  /** When true the surface is inert so pinch-zoom / pan reaches the canvas. */
  panMode?: boolean
  onChange: (data: string | undefined) => void
  /** Fired when a stroke begins, used to collapse the tool bar out of the way. */
  onDrawStart?: () => void
  controlsRef: MutableRefObject<DoodleControls | null>
  onHistory?: (s: { canUndo: boolean; canRedo: boolean }) => void
}

/** Freehand drawing surface laid over the canvas image box. */
export function DoodleOverlay({
  initial,
  brush,
  panMode,
  onChange,
  onDrawStart,
  controlsRef,
  onHistory,
}: DoodleOverlayProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const active = useRef(new Set<number>())
  const last = useRef<{ x: number; y: number } | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const snapshot = useRef<ImageData | null>(null)
  const undoStack = useRef<ImageData[]>([])
  const redoStack = useRef<ImageData[]>([])
  const brushRef = useRef(brush)
  brushRef.current = brush

  const ctxOf = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null

  const syncHistory = () =>
    onHistory?.({ canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0 })

  const emit = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = ctxOf()
    if (!ctx) return
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let painted = false
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) {
        painted = true
        break
      }
    }
    onChange(painted ? canvas.toDataURL('image/png') : undefined)
  }

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const rect = host.getBoundingClientRect()
    const scale = Math.min(2, MAX_DIM / Math.max(1, Math.max(rect.width, rect.height)))
    canvas.width = Math.max(1, Math.round(rect.width * scale))
    canvas.height = Math.max(1, Math.round(rect.height * scale))
    undoStack.current = []
    redoStack.current = []
    syncHistory()
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (ctx && initial) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = initial
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    controlsRef.current = {
      undo: () => restoreFrom(undoStack.current, redoStack.current),
      redo: () => restoreFrom(redoStack.current, undoStack.current),
      clear: () => {
        const canvas = canvasRef.current
        const ctx = ctxOf()
        if (!canvas || !ctx) return
        pushHistory()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onChange(undefined)
      },
    }
    return () => {
      controlsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function restoreFrom(stack: ImageData[], other: ImageData[]) {
    const canvas = canvasRef.current
    const ctx = ctxOf()
    const data = stack.pop()
    if (!canvas || !ctx || !data) return
    other.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(data, 0, 0)
    emit()
    syncHistory()
  }

  function pushHistory() {
    const canvas = canvasRef.current
    const ctx = ctxOf()
    if (!canvas || !ctx) return
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (undoStack.current.length > 25) undoStack.current.shift()
    redoStack.current = []
    syncHistory()
  }

  function width() {
    const canvas = canvasRef.current
    const base = canvas ? Math.max(canvas.width, canvas.height) / 900 : 1
    return Math.max(1, brushRef.current.size * base)
  }

  function prepare(ctx: CanvasRenderingContext2D) {
    const b = brushRef.current
    const w = width()
    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineCap = b.kind === 'marker' || b.kind === 'calligraphy' ? 'butt' : 'round'
    ctx.lineWidth = w
    ctx.strokeStyle = b.color
    ctx.fillStyle = b.color
    ctx.globalAlpha = Math.max(0.03, b.opacity / 100)
    ctx.globalCompositeOperation = 'source-over'
    ctx.setLineDash([])
    ctx.shadowBlur = 0

    if (b.kind === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
    } else if (b.kind === 'marker') {
      ctx.globalAlpha = Math.min(0.5, Math.max(0.08, b.opacity / 100) * 0.5)
      ctx.lineWidth = w * 1.8
    } else if (b.kind === 'neon') {
      ctx.shadowBlur = w * 1.6
      ctx.shadowColor = b.color
    } else if (b.kind === 'dashed') {
      ctx.setLineDash([w * 1.6, w * 1.6])
    } else if (b.kind === 'calligraphy') {
      ctx.lineWidth = w * 0.55
    }
    return w
  }

  function drawSegment(from: { x: number; y: number }, to: { x: number; y: number }) {
    const ctx = ctxOf()
    if (!ctx) return
    const b = brushRef.current
    const w = prepare(ctx)

    if (b.kind === 'spray') {
      const dist = Math.hypot(to.x - from.x, to.y - from.y)
      const dots = Math.max(6, Math.round(dist * 0.9) + 10)
      for (let i = 0; i < dots; i += 1) {
        const t = Math.random()
        const a = Math.random() * Math.PI * 2
        const r = Math.random() * w
        ctx.beginPath()
        ctx.arc(from.x + (to.x - from.x) * t + Math.cos(a) * r, from.y + (to.y - from.y) * t + Math.sin(a) * r, Math.max(0.5, w * 0.07), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      return
    }

    if (b.kind === 'calligraphy') {
      // Angled nib: offset the stroke so speed/direction shapes the line.
      const off = w * 0.35
      ctx.beginPath()
      ctx.moveTo(from.x - off, from.y + off)
      ctx.lineTo(to.x - off, to.y + off)
      ctx.lineTo(to.x + off, to.y - off)
      ctx.lineTo(from.x + off, from.y - off)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
      return
    }

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    if (b.kind === 'neon') ctx.stroke()
    ctx.restore()
  }

  /** Draw a markup shape from the press point to the current point. */
  function drawShape(a: { x: number; y: number }, b: { x: number; y: number }) {
    const ctx = ctxOf()
    if (!ctx) return
    const shape = brushRef.current.shape
    const w = prepare(ctx)
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const rw = Math.abs(b.x - a.x)
    const rh = Math.abs(b.y - a.y)

    ctx.beginPath()
    switch (shape) {
      case 'dashed':
        ctx.setLineDash([w * 2.2, w * 1.8])
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        break
      case 'wave': {
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy)
        if (len < 1) break
        const nx = -dy / len
        const ny = dx / len
        const amp = Math.max(w * 1.2, len * 0.045)
        const waves = Math.max(2, Math.round(len / (amp * 4)))
        const steps = Math.max(24, waves * 16)
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps
          const off = Math.sin(t * waves * Math.PI * 2) * amp
          const px = a.x + dx * t + nx * off
          const py = a.y + dy * t + ny * off
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
        break
      }
      case 'arrow': {
        const ang = Math.atan2(b.y - a.y, b.x - a.x)
        const head = Math.max(w * 3, Math.hypot(b.x - a.x, b.y - a.y) * 0.22)
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x - Math.cos(ang) * head * 0.5, b.y - Math.sin(ang) * head * 0.5)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(b.x, b.y)
        ctx.lineTo(b.x - Math.cos(ang - 0.42) * head, b.y - Math.sin(ang - 0.42) * head)
        ctx.lineTo(b.x - Math.cos(ang + 0.42) * head, b.y - Math.sin(ang + 0.42) * head)
        ctx.closePath()
        ctx.fill()
        break
      }
      case 'rect':
        ctx.rect(x, y, rw, rh)
        ctx.stroke()
        break
      case 'rectFill':
        ctx.rect(x, y, rw, rh)
        ctx.fill()
        break
      case 'ellipse':
      case 'ellipseFill':
        ctx.ellipse(x + rw / 2, y + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2)
        if (shape === 'ellipse') ctx.stroke()
        else ctx.fill()
        break
      default:
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
    }
    ctx.restore()
  }


  function pointOf(clientX: number, clientY: number) {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return null
    const rect = host.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function down(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    e.preventDefault()
    active.current.add(e.pointerId)
    if (active.current.size > 1) {
      // Second finger down: this is a zoom gesture, not a stroke.
      abortStroke()
      return
    }
    const p = pointOf(e.clientX, e.clientY)
    if (!p) return
    pushHistory()
    drawing.current = true
    onDrawStart?.()
    start.current = p
    last.current = p
    e.currentTarget.setPointerCapture(e.pointerId)
    const canvas = canvasRef.current
    const ctx = ctxOf()
    if (brushRef.current.shape !== 'free' && canvas && ctx) {
      snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    } else {
      snapshot.current = null
      drawSegment(p, { x: p.x + 0.01, y: p.y + 0.01 })
    }
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    if (!drawing.current || active.current.size > 1) return
    const p = pointOf(e.clientX, e.clientY)
    if (!p) return
    if (snapshot.current) {
      const ctx = ctxOf()
      if (!ctx || !start.current) return
      ctx.putImageData(snapshot.current, 0, 0)
      drawShape(start.current, p)
      return
    }
    if (last.current) drawSegment(last.current, p)
    last.current = p
  }

  function up(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    active.current.delete(e.pointerId)
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    start.current = null
    snapshot.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    emit()
  }

  /** Roll back the in-progress stroke (used when a pinch gesture starts). */
  function abortStroke() {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    start.current = null
    snapshot.current = null
    const ctx = ctxOf()
    const prev = undoStack.current.pop()
    if (ctx && prev) ctx.putImageData(prev, 0, 0)
    syncHistory()
    emit()
  }

  return (
    <div
      ref={hostRef}
      className={cn(
        'absolute inset-0 z-30 touch-none select-none',
        panMode ? 'pointer-events-none' : 'cursor-crosshair',
      )}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}

const PENS: { kind: PenKind; label: string; Icon: typeof Pen }[] = [
  { kind: 'pen', label: 'Pen', Icon: Pen },
  { kind: 'marker', label: 'Marker', Icon: Highlighter },
  { kind: 'neon', label: 'Neon', Icon: Sparkles },
  { kind: 'dashed', label: 'Dashed', Icon: PenLine },
  { kind: 'spray', label: 'Spray', Icon: SprayCan },
  { kind: 'calligraphy', label: 'Calligraphy', Icon: Minus },
  { kind: 'eraser', label: 'Eraser', Icon: Eraser },
]

const SWATCHES = [
  '#ffffff',
  '#000000',
  '#ff2d55',
  '#ff9500',
  '#ffd60a',
  '#34c759',
  '#00c7be',
  '#0a84ff',
  '#5e5ce6',
  '#af52de',
  '#ff6482',
  '#8b5a2b',
]

interface DoodleBarProps {
  brush: DoodleBrush
  onBrush: (patch: Partial<DoodleBrush>) => void
  panMode: boolean
  onPanMode: (v: boolean) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onCancel: () => void
  onApply: () => void
}

/** Bottom control bar shown in place of the tool rail while drawing. */
export function DoodleBar({
  brush,
  onBrush,
  panMode,
  onPanMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onCancel,
  onApply,
}: DoodleBarProps) {
  const iconBtn =
    'flex size-10 items-center justify-center rounded-xl transition active:scale-95 disabled:opacity-35'

  return (
    <div
      className="glass-bar fixed inset-x-0 bottom-0 z-50 max-h-[62vh] space-y-2 overflow-y-auto perf-scroll px-4 pb-4 pt-2"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition active:scale-95"
          onClick={onCancel}
        >
          <X className="size-4" />
          Cancel
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Pan and zoom"
            className={cn(iconBtn, panMode && 'bg-primary text-primary-foreground')}
            onClick={() => onPanMode(!panMode)}
          >
            <Hand className="size-5" />
          </button>
          <button type="button" aria-label="Undo" disabled={!canUndo} className={iconBtn} onClick={onUndo}>
            <Undo2 className="size-5" />
          </button>
          <button type="button" aria-label="Clear drawing" className={iconBtn} onClick={onClear}>
            <RotateCcw className="size-5" />
          </button>
          <button type="button" aria-label="Redo" disabled={!canRedo} className={iconBtn} onClick={onRedo}>
            <Redo2 className="size-5" />
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-95"
          onClick={onApply}
        >
          <Check className="size-4" />
          Done
        </button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto perf-scroll pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PENS.map(({ kind, label, Icon }) => (
          <button
            key={kind}
            type="button"
            aria-label={label}
            onClick={() => onBrush({ kind })}
            className={cn(
              'flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-2.5 py-1 text-[10px] font-medium transition active:scale-95',
              brush.kind === kind
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground/75',
            )}
          >
            <Icon className="size-[17px]" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto perf-scroll pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ColorPickerPopover value={brush.color} onChange={(color) => onBrush({ color })}>
          <button
            type="button"
            aria-label="Pick color"
            className="relative size-7 shrink-0 overflow-hidden rounded-full border-2 border-primary"
            style={{ background: brush.color }}
          />
        </ColorPickerPopover>
        <span className="mx-0.5 h-6 w-px shrink-0 bg-border" />
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => onBrush({ color: c, kind: brush.kind === 'eraser' ? 'pen' : brush.kind })}
            className={cn(
              'size-7 shrink-0 rounded-full border transition active:scale-90',
              brush.color.toLowerCase() === c ? 'border-primary ring-2 ring-primary/40' : 'border-border',
            )}
            style={{ background: c }}
          />
        ))}
      </div>

      <SliderField label="Size" value={brush.size} min={1} max={80} onChange={(v) => onBrush({ size: v })} />
      <SliderField
        label="Opacity"
        value={brush.opacity}
        min={5}
        max={100}
        onChange={(v) => onBrush({ opacity: v })}
      />

      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Mark
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto perf-scroll pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SHAPES.map(({ shape, label, Icon }) => (
            <button
              key={shape}
              type="button"
              aria-label={label}
              title={label}
              onClick={() => onBrush({ shape })}
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-xl border transition active:scale-95',
                brush.shape === shape
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground/75',
              )}
            >
              <Icon className="size-[18px]" />
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

/** Floating pill that brings the collapsed drawing tools back. */
export function ShowToolsButton({ onShow }: { onShow: () => void }) {
  return (
    <button
      type="button"
      onClick={onShow}
      className="glass-bar fixed inset-x-0 bottom-0 z-50 mx-auto flex w-auto items-center justify-center gap-2 rounded-t-2xl px-5 py-3 text-sm font-semibold text-foreground transition active:scale-95"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <SlidersHorizontal className="size-4" />
      Show tools
    </button>
  )
}
