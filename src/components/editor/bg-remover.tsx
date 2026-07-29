import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Brush, Check, Eraser, Sparkles, Undo2, Wand2 } from 'lucide-react'
import { SliderField } from './control-fields'
import { autoRemoveColor, autoRemoveEdges, magicErase } from '@/lib/bg-remove'
import { cn } from '@/lib/utils'

type Tool = 'auto' | 'magic' | 'manual' | 'repair'

interface BgRemoverProps {
  open: boolean
  src: string
  title?: string
  onClose: () => void
  onApply: (dataUrl: string) => void
}

const MAX_DIM = 1600

/** Full-screen background remover: auto cut-out, magic wand, manual erase & repair. */
export function BgRemover({ open, src, title = 'Remove background', onClose, onApply }: BgRemoverProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const originalRef = useRef<HTMLCanvasElement | null>(null)
  const history = useRef<ImageData[]>([])
  const drawing = useRef(false)
  const [tool, setTool] = useState<Tool>('auto')
  const [tolerance, setTolerance] = useState(28)
  const [size, setSize] = useState(30)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [canUndo, setCanUndo] = useState(false)

  const ctxOf = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null

  const snapshot = useCallback(() => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (history.current.length > 12) history.current.shift()
    setCanUndo(true)
  }, [])

  // Load the source image into the working canvas each time the editor opens.
  useEffect(() => {
    if (!open) return
    setReady(false)
    history.current = []
    setCanUndo(false)
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

  const toImageCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const brush = (x: number, y: number) => {
    const ctx = ctxOf()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    const radius = ((size / 100) * 0.12 + 0.01) * Math.max(canvas.width, canvas.height)
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
    const prev = history.current.pop()
    const ctx = ctxOf()
    if (prev && ctx) ctx.putImageData(prev, 0, 0)
    setCanUndo(history.current.length > 0)
  }

  if (!open || typeof document === 'undefined') return null

  const tools: { key: Tool; label: string; icon: typeof Wand2 }[] = [
    { key: 'auto', label: 'Auto', icon: Sparkles },
    { key: 'magic', label: 'Magic', icon: Wand2 },
    { key: 'manual', label: 'Manual', icon: Eraser },
    { key: 'repair', label: 'Repair', icon: Brush },
  ]

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
        <span className="text-sm font-semibold">{title}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            className="flex size-10 items-center justify-center rounded-xl transition active:scale-95 disabled:opacity-40"
          >
            <Undo2 className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Done"
            onClick={() => {
              const canvas = canvasRef.current
              if (canvas) onApply(canvas.toDataURL('image/png'))
              onClose()
            }}
            className="flex size-10 items-center justify-center rounded-xl text-primary transition active:scale-95"
          >
            <Check className="size-6" />
          </button>
        </div>
      </header>

      <div className="checker-grid flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full touch-none select-none object-contain"
          style={{ opacity: ready ? 1 : 0 }}
          onPointerDown={(e) => {
            const p = toImageCoords(e)
            if (!p) return
            e.currentTarget.setPointerCapture(e.pointerId)
            if (tool === 'auto') return
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
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const p = toImageCoords(e)
            if (p) brush(p.x, p.y)
          }}
          onPointerUp={() => {
            drawing.current = false
          }}
          onPointerCancel={() => {
            drawing.current = false
          }}
        />
      </div>

      <div className="glass-bar space-y-3 px-4 pb-5 pt-3">
        {tool === 'auto' ? (
          <>
            <SliderField label="Tolerance" value={tolerance} min={2} max={80} onChange={setTolerance} />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => runAuto('edges')}
                className="h-11 flex-1 rounded-xl bg-primary text-xs font-semibold text-primary-foreground transition active:scale-95 disabled:opacity-60"
              >
                Remove background
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => runAuto('color')}
                className="h-11 flex-1 rounded-xl border border-border text-xs font-semibold transition active:scale-95 disabled:opacity-60"
              >
                Remove color everywhere
              </button>
            </div>
          </>
        ) : tool === 'magic' ? (
          <SliderField label="Tolerance" value={tolerance} min={2} max={80} onChange={setTolerance} />
        ) : (
          <SliderField label="Brush size" value={size} min={4} max={100} onChange={setSize} />
        )}

        <div className="flex items-center gap-2">
          {tools.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTool(t.key)}
              className={cn(
                'flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-semibold transition active:scale-95',
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
