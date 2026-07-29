import { useEffect, useRef, type MutableRefObject, type PointerEvent } from 'react'
import { Brush, Check, Eraser, Eye, Redo2, RotateCcw, Undo2, X } from 'lucide-react'
import { SliderField } from './control-fields'
import { cn } from '@/lib/utils'

export interface EraseBrush {
  size: number
  opacity: number
  hardness: number
  mode: 'erase' | 'restore'
}

export interface EraseControls {
  undo: () => void
  redo: () => void
  reset: () => void
}

export const DEFAULT_BRUSH: EraseBrush = { size: 30, opacity: 100, hardness: 50, mode: 'erase' }

const MAX_DIM = 1600

interface EraseOverlayProps {
  initialMask?: string
  brush: EraseBrush
  onChange: (mask: string | undefined) => void
  controlsRef: MutableRefObject<EraseControls | null>
  onHistory?: (state: { canUndo: boolean; canRedo: boolean }) => void
}

/**
 * Transparent paint surface laid over the canvas image box. Strokes build a
 * single stage-level mask so every text / sticker layer is erased at once,
 * while the background photo stays untouched and fully visible underneath.
 */
export function EraseOverlay({ initialMask, brush, onChange, controlsRef, onHistory }: EraseOverlayProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const undoStack = useRef<ImageData[]>([])
  const redoStack = useRef<ImageData[]>([])
  const brushRef = useRef(brush)
  brushRef.current = brush

  const ctxOf = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null

  const emit = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onChange(canvas.toDataURL('image/png'))
  }

  const syncHistory = () => {
    onHistory?.({ canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0 })
  }

  const fillWhite = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Size the mask canvas to the rendered image box so strokes land 1:1.
  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const rect = host.getBoundingClientRect()
    const scale = Math.min(2, MAX_DIM / Math.max(1, Math.max(rect.width, rect.height)))
    canvas.width = Math.max(1, Math.round(rect.width * scale))
    canvas.height = Math.max(1, Math.round(rect.height * scale))
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    fillWhite(ctx, canvas)
    undoStack.current = []
    redoStack.current = []
    syncHistory()
    if (initialMask) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = initialMask
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    controlsRef.current = {
      undo: () => restoreFrom(undoStack.current, redoStack.current),
      redo: () => restoreFrom(redoStack.current, undoStack.current),
      reset: () => {
        const canvas = canvasRef.current
        const ctx = ctxOf()
        if (!canvas || !ctx) return
        pushHistory()
        fillWhite(ctx, canvas)
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
    if (undoStack.current.length > 20) undoStack.current.shift()
    redoStack.current = []
    syncHistory()
  }

  function radius() {
    const canvas = canvasRef.current
    if (!canvas) return 10
    return ((brushRef.current.size / 100) * 0.3 + 0.01) * Math.max(canvas.width, canvas.height)
  }

  function stamp(x: number, y: number) {
    const ctx = ctxOf()
    if (!ctx) return
    const r = radius()
    const b = brushRef.current
    const inner = Math.max(0, Math.min(0.98, b.hardness / 100))
    const grad = ctx.createRadialGradient(x, y, r * inner, x, y, r)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.globalAlpha = Math.max(0.02, b.opacity / 100)
    ctx.globalCompositeOperation = b.mode === 'erase' ? 'destination-out' : 'source-over'
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  function paint(clientX: number, clientY: number) {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const rect = host.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = ((clientX - rect.left) / rect.width) * canvas.width
    const y = ((clientY - rect.top) / rect.height) * canvas.height
    const prev = last.current
    if (prev) {
      const step = Math.max(2, radius() * 0.25)
      const steps = Math.floor(Math.hypot(x - prev.x, y - prev.y) / step)
      for (let i = 1; i <= steps; i += 1) {
        stamp(prev.x + ((x - prev.x) * i) / steps, prev.y + ((y - prev.y) * i) / steps)
      }
    }
    stamp(x, y)
    last.current = { x, y }
    emit()
  }

  function down(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    e.preventDefault()
    drawing.current = true
    last.current = null
    e.currentTarget.setPointerCapture(e.pointerId)
    pushHistory()
    paint(e.clientX, e.clientY)
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    if (!drawing.current) return
    paint(e.clientX, e.clientY)
  }

  function up(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    drawing.current = false
    last.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 z-30 cursor-crosshair touch-none select-none"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

interface EraseBarProps {
  brush: EraseBrush
  onBrush: (patch: Partial<EraseBrush>) => void
  canUndo: boolean
  canRedo: boolean
  bypass: boolean
  onBypass: (v: boolean) => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onCancel: () => void
  onApply: () => void
}

/** Bottom control bar shown in place of the tool rail while erasing. */
export function EraseBar({
  brush,
  onBrush,
  canUndo,
  canRedo,
  bypass,
  onBypass,
  onUndo,
  onRedo,
  onReset,
  onCancel,
  onApply,
}: EraseBarProps) {
  const iconBtn =
    'flex size-10 items-center justify-center rounded-xl transition active:scale-95 disabled:opacity-35'

  return (
    <div
      className="glass-bar space-y-2 px-4 pb-4 pt-2"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Cancel erase" className={iconBtn} onClick={onCancel}>
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Undo" disabled={!canUndo} className={iconBtn} onClick={onUndo}>
            <Undo2 className="size-5" />
          </button>
          <button type="button" aria-label="Reset erase" className={iconBtn} onClick={onReset}>
            <RotateCcw className="size-5" />
          </button>
          <button type="button" aria-label="Redo" disabled={!canRedo} className={iconBtn} onClick={onRedo}>
            <Redo2 className="size-5" />
          </button>
        </div>
        <button type="button" aria-label="Apply erase" className={cn(iconBtn, 'text-primary')} onClick={onApply}>
          <Check className="size-6" />
        </button>
      </div>

      <SliderField label="Size" value={brush.size} min={2} max={100} onChange={(v) => onBrush({ size: v })} />
      <SliderField
        label="Opacity"
        value={brush.opacity}
        min={5}
        max={100}
        onChange={(v) => onBrush({ opacity: v })}
      />
      <SliderField
        label="Hardness"
        value={brush.hardness}
        min={0}
        max={100}
        onChange={(v) => onBrush({ hardness: v })}
      />

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          aria-label="Preview original"
          onPointerDown={() => onBypass(true)}
          onPointerUp={() => onBypass(false)}
          onPointerLeave={() => onBypass(false)}
          className={cn(
            'flex size-11 items-center justify-center rounded-xl border border-border transition active:scale-95',
            bypass && 'border-primary text-primary',
          )}
        >
          <Eye className="size-5" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          aria-label="Restore brush"
          onClick={() => onBrush({ mode: 'restore' })}
          className={cn(
            'flex size-11 items-center justify-center rounded-xl border transition active:scale-95',
            brush.mode === 'restore'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground/80',
          )}
        >
          <Brush className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Erase brush"
          onClick={() => onBrush({ mode: 'erase' })}
          className={cn(
            'flex size-11 items-center justify-center rounded-xl border transition active:scale-95',
            brush.mode === 'erase'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground/80',
          )}
        >
          <Eraser className="size-5" />
        </button>
      </div>
    </div>
  )
}
