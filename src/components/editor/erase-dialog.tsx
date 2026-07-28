import { useEffect, useRef, useState } from 'react'
import { Brush, Eraser, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SliderField } from './control-fields'
import { LayerText } from './text-layer-view'
import { cn } from '@/lib/utils'
import type { TextLayer } from '@/lib/text-layer'

const CANVAS_W = 720
const CANVAS_H = 480

interface EraseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  layer: TextLayer
  onApply: (mask: string | undefined) => void
}

/** Paint-to-erase mask editor for a single text layer. */
export function EraseDialog({ open, onOpenChange, layer, onApply }: EraseDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const drawing = useRef(false)
  const [mode, setMode] = useState<'erase' | 'restore'>('erase')
  const [size, setSize] = useState(50)
  const [preview, setPreview] = useState<string | undefined>(layer.eraseMask)

  // (Re)initialise the mask canvas whenever the dialog opens.
  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    setPreview(layer.eraseMask)
    if (layer.eraseMask) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
      }
      img.src = layer.eraseMask
    }
  }, [open, layer.eraseMask])

  const paint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const surface = surfaceRef.current
    if (!canvas || !surface) return
    const rect = surface.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const radius = (size / 100) * 70 + 6
    ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  const commitPreview = () => {
    const canvas = canvasRef.current
    if (canvas) setPreview(canvas.toDataURL('image/png'))
  }

  const reset = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    setPreview(undefined)
  }

  const toolBtn = 'flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition active:scale-95'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,420px)] rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle className="text-base">Erase</DialogTitle>
        </DialogHeader>

        <div
          ref={surfaceRef}
          className="relative flex aspect-3/2 w-full touch-none items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
          style={{ containerType: 'size' }}
          onPointerDown={(e) => {
            drawing.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            paint(e.clientX, e.clientY)
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            paint(e.clientX, e.clientY)
          }}
          onPointerUp={() => {
            drawing.current = false
            commitPreview()
          }}
        >
          <div className="pointer-events-none">
            <LayerText layer={{ ...layer, eraseMask: preview, opacity: 1 }} />
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('erase')}
            className={cn(
              toolBtn,
              mode === 'erase' ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
            )}
          >
            <Eraser className="size-4" /> Erase
          </button>
          <button
            type="button"
            onClick={() => setMode('restore')}
            className={cn(
              toolBtn,
              mode === 'restore' ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
            )}
          >
            <Brush className="size-4" /> Restore
          </button>
          <button
            type="button"
            aria-label="Reset erase"
            onClick={reset}
            className="flex size-11 items-center justify-center rounded-xl border border-border transition active:scale-95"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        <SliderField label="Brush size" value={size} min={5} max={100} onChange={setSize} />

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              const canvas = canvasRef.current
              onApply(canvas ? canvas.toDataURL('image/png') : undefined)
              onOpenChange(false)
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
