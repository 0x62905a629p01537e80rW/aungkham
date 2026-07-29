import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Brush, Check, Eraser, Eye, RotateCcw, Redo2, Undo2, X } from 'lucide-react'
import { SliderField } from './control-fields'
import { LayerText } from './text-layer-view'
import { cn } from '@/lib/utils'
import type { TextLayer } from '@/lib/text-layer'

interface EraseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  layer: TextLayer
  onApply: (mask: string | undefined) => void
}

const MAX_DIM = 1400

/**
 * Full-screen paint-to-erase editor. The mask canvas is sized to the layer's
 * rendered box so brush strokes land exactly where the finger touches.
 */
export function EraseDialog({ open, onOpenChange, layer, onApply }: EraseDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const undoStack = useRef<ImageData[]>([])
  const redoStack = useRef<ImageData[]>([])

  const [mode, setMode] = useState<'erase' | 'restore'>('erase')
  const [size, setSize] = useState(35)
  const [opacity, setOpacity] = useState(100)
  const [hardness, setHardness] = useState(50)
  const [preview, setPreview] = useState<string | undefined>(layer.eraseMask)
  const [bypass, setBypass] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const ctxOf = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null

  const measure = useCallback(() => {
    const host = boxRef.current
    if (!host) return null
    const el = (host.firstElementChild as HTMLElement | null) ?? host
    const r = el.getBoundingClientRect()
    return { el, rect: r }
  }, [])

  // Size the mask canvas to the rendered layer box and seed it with the
  // existing mask (or fully opaque white = nothing erased).
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      const m = measure()
      const canvas = canvasRef.current
      if (!m || !canvas) return
      const scale = Math.min(2, MAX_DIM / Math.max(1, Math.max(m.rect.width, m.rect.height)))
      canvas.width = Math.max(1, Math.round(m.rect.width * scale))
      canvas.height = Math.max(1, Math.round(m.rect.height * scale))
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      undoStack.current = []
      redoStack.current = []
      setCanUndo(false)
      setCanRedo(false)
      if (layer.eraseMask) {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          setPreview(canvas.toDataURL('image/png'))
        }
        img.src = layer.eraseMask
      } else {
        setPreview(undefined)
      }
    })
    return () => cancelAnimationFrame(id)
  }, [open, layer.eraseMask, measure])

  const pushHistory = () => {
    const canvas = canvasRef.current
    const ctx = ctxOf()
    if (!canvas || !ctx) return
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (undoStack.current.length > 20) undoStack.current.shift()
    redoStack.current = []
    setCanUndo(true)
    setCanRedo(false)
  }

  const stamp = (x: number, y: number) => {
    const canvas = canvasRef.current
    const ctx = ctxOf()
    if (!canvas || !ctx) return
    const radius = ((size / 100) * 0.35 + 0.02) * Math.max(canvas.width, canvas.height)
    const inner = Math.max(0, Math.min(0.98, hardness / 100))
    const grad = ctx.createRadialGradient(x, y, radius * inner, x, y, radius)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.globalAlpha = Math.max(0.02, opacity / 100)
    ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over'
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  const paint = (clientX: number, clientY: number) => {
    const m = measure()
    const canvas = canvasRef.current
    if (!m || !canvas) return
    const x = ((clientX - m.rect.left) / m.rect.width) * canvas.width
    const y = ((clientY - m.rect.top) / m.rect.height) * canvas.height
    const prev = last.current
    if (prev) {
      const dist = Math.hypot(x - prev.x, y - prev.y)
      const step = Math.max(2, ((size / 100) * 0.35 + 0.02) * Math.max(canvas.width, canvas.height) * 0.25)
      const steps = Math.floor(dist / step)
      for (let i = 1; i <= steps; i += 1) {
        stamp(prev.x + ((x - prev.x) * i) / steps, prev.y + ((y - prev.y) * i) / steps)
      }
    }
    stamp(x, y)
    last.current = { x, y }
    setPreview(canvas.toDataURL('image/png'))
  }

  const restoreFrom = (stack: ImageData[], other: ImageData[]) => {
    const canvas = canvasRef.current
    const ctx = ctxOf()
    const data = stack.pop()
    if (!canvas || !ctx || !data) return
    other.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(data, 0, 0)
    setPreview(canvas.toDataURL('image/png'))
    setCanUndo(undoStack.current.length > 0)
    setCanRedo(redoStack.current.length > 0)
  }

  const reset = () => {
    const canvas = canvasRef.current
    const ctx = ctxOf()
    if (!canvas || !ctx) return
    pushHistory()
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setPreview(undefined)
  }

  if (!open || typeof document === 'undefined') return null

  const iconBtn =
    'flex size-10 items-center justify-center rounded-xl transition active:scale-95 disabled:opacity-35'

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-background">
      <header className="glass-bar flex items-center justify-between gap-1 px-2 py-2">
        <button type="button" aria-label="Cancel" className={iconBtn} onClick={() => onOpenChange(false)}>
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Undo"
            disabled={!canUndo}
            className={iconBtn}
            onClick={() => restoreFrom(undoStack.current, redoStack.current)}
          >
            <Undo2 className="size-5" />
          </button>
          <button type="button" aria-label="Reset" className={iconBtn} onClick={reset}>
            <RotateCcw className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            disabled={!canRedo}
            className={iconBtn}
            onClick={() => restoreFrom(redoStack.current, undoStack.current)}
          >
            <Redo2 className="size-5" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Apply"
          className={cn(iconBtn, 'text-primary')}
          onClick={() => {
            const canvas = canvasRef.current
            onApply(canvas && preview ? canvas.toDataURL('image/png') : undefined)
            onOpenChange(false)
          }}
        >
          <Check className="size-6" />
        </button>
      </header>

      <div
        className="checker-grid relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden"
        style={{ containerType: 'size' }}
        onPointerDown={(e) => {
          drawing.current = true
          last.current = null
          e.currentTarget.setPointerCapture(e.pointerId)
          pushHistory()
          paint(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return
          paint(e.clientX, e.clientY)
        }}
        onPointerUp={() => {
          drawing.current = false
          last.current = null
        }}
        onPointerCancel={() => {
          drawing.current = false
          last.current = null
        }}
      >
        <div ref={boxRef} className="pointer-events-none">
          <LayerText layer={{ ...layer, eraseMask: bypass ? undefined : preview, opacity: 1 }} />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="glass-bar space-y-2 px-4 pb-5 pt-3">
        <SliderField label="Size" value={size} min={2} max={100} onChange={setSize} />
        <SliderField label="Opacity" value={opacity} min={5} max={100} onChange={setOpacity} />
        <SliderField label="Hardness" value={hardness} min={0} max={100} onChange={setHardness} />

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            aria-label="Preview original"
            onPointerDown={() => setBypass(true)}
            onPointerUp={() => setBypass(false)}
            onPointerLeave={() => setBypass(false)}
            className={cn(
              'flex size-12 items-center justify-center rounded-xl border border-border transition active:scale-95',
              bypass && 'border-primary text-primary',
            )}
          >
            <Eye className="size-5" />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setMode('restore')}
            aria-label="Restore brush"
            className={cn(
              'flex size-12 items-center justify-center rounded-xl border transition active:scale-95',
              mode === 'restore'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground/80',
            )}
          >
            <Brush className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setMode('erase')}
            aria-label="Erase brush"
            className={cn(
              'flex size-12 items-center justify-center rounded-xl border transition active:scale-95',
              mode === 'erase'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground/80',
            )}
          >
            <Eraser className="size-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
