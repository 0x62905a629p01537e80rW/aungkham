import { forwardRef, useRef, type CSSProperties, type PointerEvent } from 'react'
import { Maximize2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { layerTextStyle } from './text-layer-view'
import type { TextLayer } from '@/lib/text-layer'

interface CanvasPreviewProps {
  image: string
  aspectRatio: number
  layers: TextLayer[]
  selectedId: string | null
  exporting: boolean
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, fontSize: number) => void
  onDelete: (id: string) => void
}

export const CanvasPreview = forwardRef<HTMLDivElement, CanvasPreviewProps>(
  function CanvasPreview(
    { image, aspectRatio, layers, selectedId, exporting, onSelect, onMove, onResize, onDelete },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const dragState = useRef<{ id: string; pointerId: number } | null>(null)
    const resizeState = useRef<{
      id: string
      pointerId: number
      startDist: number
      startSize: number
    } | null>(null)

    function handlePointerDown(e: PointerEvent<HTMLDivElement>, id: string) {
      e.stopPropagation()
      onSelect(id)
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      dragState.current = { id, pointerId: e.pointerId }
    }

    function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
      if (!dragState.current) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      onMove(
        dragState.current.id,
        Math.max(0, Math.min(100, x)),
        Math.max(0, Math.min(100, y)),
      )
    }

    function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
      dragState.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }

    function centerDistance(layer: TextLayer, clientX: number, clientY: number) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return 0
      const cx = rect.left + (layer.x / 100) * rect.width
      const cy = rect.top + (layer.y / 100) * rect.height
      return Math.hypot(clientX - cx, clientY - cy)
    }

    function handleResizeDown(e: PointerEvent<HTMLButtonElement>, layer: TextLayer) {
      e.stopPropagation()
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      resizeState.current = {
        id: layer.id,
        pointerId: e.pointerId,
        startDist: centerDistance(layer, e.clientX, e.clientY) || 1,
        startSize: layer.fontSize,
      }
    }

    function handleResizeMove(e: PointerEvent<HTMLButtonElement>) {
      const st = resizeState.current
      if (!st) return
      const layer = layers.find((l) => l.id === st.id)
      if (!layer) return
      const dist = centerDistance(layer, e.clientX, e.clientY)
      const ratio = dist / st.startDist
      const next = Math.max(2, Math.min(40, st.startSize * ratio))
      onResize(st.id, Math.round(next * 2) / 2)
    }

    function handleResizeUp(e: PointerEvent<HTMLButtonElement>) {
      resizeState.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }

    return (
      <div
        ref={ref}
        className="relative w-full select-none overflow-hidden"
        style={{ containerType: 'size', lineHeight: 0, aspectRatio }}
        onPointerDown={() => onSelect(null)}
      >
        <div ref={containerRef} className="absolute inset-0">
          <img
            src={image || '/placeholder.svg'}
            alt="Editing canvas"
            crossOrigin="anonymous"
            className="block h-full w-full object-cover"
            draggable={false}
          />

          {layers.map((layer) => {
            const isSelected = layer.id === selectedId && !exporting
            const wrapperStyle: CSSProperties = {
              position: 'absolute',
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) skew(${layer.skewX}deg, ${layer.skewY}deg)`,
              opacity: layer.opacity,
              whiteSpace: 'nowrap',
              cursor: 'move',
              touchAction: 'none',
            }
            const inner = layer.highlight ? (
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: layer.highlightColor,
                  padding: '0.08em 0.28em',
                  borderRadius: '0.08em',
                }}
              >
                <span style={layerTextStyle(layer)}>{layer.text || ' '}</span>
              </span>
            ) : (
              <p style={layerTextStyle(layer)}>{layer.text || ' '}</p>
            )

            return (
              <div
                key={layer.id}
                style={wrapperStyle}
                className={cn(
                  'outline-2 outline-offset-4 outline-primary',
                  isSelected ? 'outline-dashed' : 'outline-transparent',
                )}
                onPointerDown={(e) => handlePointerDown(e, layer.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {inner}

                {isSelected && (
                  <>
                    <button
                      type="button"
                      aria-label="Delete text"
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(layer.id)
                      }}
                      className="absolute -left-3 -top-3 flex size-8 items-center justify-center rounded-full bg-destructive text-white shadow-md ring-2 ring-card transition active:scale-90"
                    >
                      <X className="size-4" />
                    </button>

                    <button
                      type="button"
                      aria-label="Resize text"
                      onPointerDown={(e) => handleResizeDown(e, layer)}
                      onPointerMove={handleResizeMove}
                      onPointerUp={handleResizeUp}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'nwse-resize', touchAction: 'none' }}
                      className="absolute -bottom-3 -right-3 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition active:scale-90"
                    >
                      <Maximize2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
