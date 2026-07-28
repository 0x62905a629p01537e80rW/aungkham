import { forwardRef, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import {
  CopyPlus,
  FlipHorizontal2,
  FlipVertical2,
  MoveDiagonal2,
  Pencil,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
  Minimize,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LayerText, layerTextStyle, layerTransform } from './text-layer-view'
import type { TextLayer } from '@/lib/text-layer'

interface CanvasPreviewProps {
  image: string
  aspectRatio: number
  layers: TextLayer[]
  selectedId: string | null
  exporting: boolean
  showGrid?: boolean
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, fontSize: number) => void
  onDelete: (id: string) => void
  onEditText: (id: string, text: string) => void
  onChange?: (id: string, patch: Partial<TextLayer>) => void
  onDuplicate?: (id: string) => void
  onBringForward?: (id: string) => void
}

export const CanvasPreview = forwardRef<HTMLDivElement, CanvasPreviewProps>(
  function CanvasPreview(
    {
      image,
      aspectRatio,
      layers,
      selectedId,
      exporting,
      showGrid = false,
      onSelect,
      onMove,
      onResize,
      onDelete,
      onEditText,
      onChange,
      onDuplicate,
      onBringForward,
    },
    ref,
  ) {

    const containerRef = useRef<HTMLDivElement | null>(null)
    const dragState = useRef<{ id: string; pointerId: number; moved: boolean; startX: number; startY: number } | null>(null)
    const resizeState = useRef<{
      id: string
      pointerId: number
      startDist: number
      startSize: number
    } | null>(null)
    const lastTapRef = useRef<{ id: string; time: number } | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false })
    const editorRef = useRef<HTMLTextAreaElement | null>(null)


    useEffect(() => {
      if (editingId && editorRef.current) {
        editorRef.current.focus()
        editorRef.current.select()
      }
    }, [editingId])

    const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
    const viewRef = useRef(view)
    viewRef.current = view
    const pointers = useRef(new Map<number, { x: number; y: number }>())
    const pinchRef = useRef<{ dist: number; cx: number; cy: number; view: typeof view } | null>(null)
    const panRef = useRef<{ x: number; y: number; view: typeof view } | null>(null)

    useEffect(() => {
      if (exporting) {
        setEditingId(null)
        setView({ scale: 1, tx: 0, ty: 0 })
      }
    }, [exporting])

    const baseSize = useRef({ w: 0, h: 0 })
    const rafRef = useRef<number | null>(null)
    const pendingRef = useRef<{ scale: number; tx: number; ty: number } | null>(null)

    function measureBase() {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const s = viewRef.current.scale || 1
      baseSize.current = { w: rect.width / s, h: rect.height / s }
    }

    function clampView(v: { scale: number; tx: number; ty: number }) {
      // Free movement: the image can be zoomed out below fit size and dragged
      // anywhere inside the frame, keeping a bit of it always reachable.
      const scale = Math.max(0.4, Math.min(8, v.scale))
      if (!baseSize.current.w) measureBase()
      const { w, h } = baseSize.current
      const maxX = (w * scale) / 2 + w / 2
      const maxY = (h * scale) / 2 + h / 2
      return {
        scale,
        tx: Math.max(-maxX, Math.min(maxX, v.tx)),
        ty: Math.max(-maxY, Math.min(maxY, v.ty)),
      }
    }



    function commitView(v: { scale: number; tx: number; ty: number }) {
      pendingRef.current = clampView(v)
      viewRef.current = pendingRef.current
      if (rafRef.current != null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (pendingRef.current) setView(pendingRef.current)
      })
    }

    useEffect(() => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }, [])

    function stageDown(e: PointerEvent<HTMLDivElement>) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      measureBase()
      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        pinchRef.current = {
          dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          cx: (a.x + b.x) / 2,
          cy: (a.y + b.y) / 2,
          view: viewRef.current,
        }
        panRef.current = null
        dragState.current = null
      } else if (pointers.current.size === 1) {
        panRef.current = { x: e.clientX, y: e.clientY, view: viewRef.current }
      }
    }

    function stageMove(e: PointerEvent<HTMLDivElement>) {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const pinch = pinchRef.current
      if (pinch && pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const cx = (a.x + b.x) / 2
        const cy = (a.y + b.y) / 2
        const ratio = dist / pinch.dist
        commitView({
          scale: pinch.view.scale * ratio,
          tx: pinch.view.tx + (cx - pinch.cx),
          ty: pinch.view.ty + (cy - pinch.cy),
        })
        return
      }
      const pan = panRef.current
      if (pan && !dragState.current && pointers.current.size === 1) {
        commitView({
          scale: pan.view.scale,
          tx: pan.view.tx + (e.clientX - pan.x),
          ty: pan.view.ty + (e.clientY - pan.y),
        })
      }
    }

    function stageUp(e: PointerEvent<HTMLDivElement>) {
      pointers.current.delete(e.pointerId)
      if (pointers.current.size < 2) pinchRef.current = null
      if (pointers.current.size === 0) {
        panRef.current = null
        return
      }
      // One finger lifted mid-pinch: rebase remaining pointers so the gesture
      // continues smoothly instead of jumping toward the surviving finger.
      const rest = [...pointers.current.values()]
      if (pointers.current.size >= 2) {
        const [a, b] = rest
        pinchRef.current = {
          dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          cx: (a.x + b.x) / 2,
          cy: (a.y + b.y) / 2,
          view: viewRef.current,
        }
        panRef.current = null
      } else {
        panRef.current = { x: rest[0].x, y: rest[0].y, view: viewRef.current }
      }
    }

    function zoomBy(factor: number) {
      measureBase()
      commitView({ ...viewRef.current, scale: viewRef.current.scale * factor })
    }



    function handlePointerDown(e: PointerEvent<HTMLDivElement>, id: string) {
      if (editingId === id) return
      e.stopPropagation()
      stageDown(e)
      if (pointers.current.size > 1) return
      onSelect(id)
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      dragState.current = { id, pointerId: e.pointerId, moved: false, startX: e.clientX, startY: e.clientY }
    }

    function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
      if (!dragState.current) {
        stageMove(e)
        return
      }
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      if (!dragState.current.moved && Math.hypot(dx, dy) < 4) return
      dragState.current.moved = true
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      let x = ((e.clientX - rect.left) / rect.width) * 100
      let y = ((e.clientY - rect.top) / rect.height) * 100

      // Snap to the horizontal/vertical centre of the image and show guides.
      const tol = 1.6
      const snapV = Math.abs(x - 50) < tol
      const snapH = Math.abs(y - 50) < tol
      if (snapV) x = 50
      if (snapH) y = 50
      setGuides((g) => (g.v === snapV && g.h === snapH ? g : { v: snapV, h: snapH }))

      onMove(
        dragState.current.id,
        Math.max(-200, Math.min(300, x)),
        Math.max(-200, Math.min(300, y)),
      )
    }



    function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
      stageUp(e)
      setGuides({ v: false, h: false })
      const st = dragState.current
      dragState.current = null

      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      if (st && !st.moved) {
        const now = Date.now()
        const last = lastTapRef.current
        if (last && last.id === st.id && now - last.time < 350) {
          setEditingId(st.id)
          lastTapRef.current = null
        } else {
          lastTapRef.current = { id: st.id, time: now }
        }
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

    const rotateState = useRef<{ id: string; startAngle: number; startRotation: number } | null>(null)

    function pointerAngle(layer: TextLayer, clientX: number, clientY: number) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return 0
      const cx = rect.left + (layer.x / 100) * rect.width
      const cy = rect.top + (layer.y / 100) * rect.height
      return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI
    }

    function handleRotateDown(e: PointerEvent<HTMLButtonElement>, layer: TextLayer) {
      e.stopPropagation()
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      rotateState.current = {
        id: layer.id,
        startAngle: pointerAngle(layer, e.clientX, e.clientY),
        startRotation: layer.rotation,
      }
    }

    function handleRotateMove(e: PointerEvent<HTMLButtonElement>) {
      const st = rotateState.current
      if (!st) return
      const layer = layers.find((l) => l.id === st.id)
      if (!layer) return
      const delta = pointerAngle(layer, e.clientX, e.clientY) - st.startAngle
      let next = Math.round(st.startRotation + delta)
      if (Math.abs(next % 90) < 4) next = Math.round(next / 90) * 90
      onChange?.(st.id, { rotation: ((next + 180) % 360) - 180 })
    }

    function handleRotateUp(e: PointerEvent<HTMLButtonElement>) {
      rotateState.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }



    return (
      <div
        ref={ref}
        className="relative h-full w-full select-none overflow-hidden"
        style={{ lineHeight: 0, touchAction: 'none' }}
        onPointerDown={(e) => {
          onSelect(null)
          stageDown(e)
        }}
        onPointerMove={stageMove}
        onPointerUp={stageUp}
        onPointerCancel={stageUp}
      >

        <div
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate3d(${view.tx}px, ${view.ty}px, 0) scale(${view.scale})`,
            transformOrigin: 'center center',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >

        <div
          className="relative"
          style={{
            width: boxSize.w ? `${boxSize.w}px` : '100%',
            height: boxSize.h ? `${boxSize.h}px` : '100%',
            containerType: 'size',
          }}
        >

          <img
            src={image || '/placeholder.svg'}
            alt="Editing canvas"
            crossOrigin="anonymous"
            className="block h-full w-full object-fill"
            draggable={false}
          />


          {showGrid && !exporting && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.45) 1px, transparent 1px)',
                backgroundSize: '33.333% 33.333%',
                mixBlendMode: 'difference',
              }}
            />
          )}

          {layers.filter((l) => !l.hidden).map((layer) => {
            const isSelected = layer.id === selectedId && !exporting
            const isEditing = editingId === layer.id && !exporting
            const inv = 1 / view.scale
            const wrapperStyle: CSSProperties = {
              position: 'absolute',
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: layerTransform(layer),
              opacity: layer.opacity,
              whiteSpace: 'nowrap',
              cursor: isEditing ? 'text' : 'move',
              touchAction: 'none',
              outlineWidth: `${2 * inv}px`,
              outlineOffset: `${4 * inv}px`,
            }

            const hTransform = `translate(-50%, -50%) scale(${inv * (layer.flipH ? -1 : 1)}, ${inv * (layer.flipV ? -1 : 1)})`
            const mirror = (v: number | string) => (v === 0 ? '100%' : v === '100%' ? 0 : v)
            const hx = (v: number | string) => (layer.flipH ? mirror(v) : v)
            const hy = (v: number | string) => (layer.flipV ? mirror(v) : v)

            const textStyle = layerTextStyle(layer)
            const inner = <LayerText layer={layer} />


            return (
              <div
                key={layer.id}
                style={wrapperStyle}
                className={cn(
                  'outline-primary',
                  isSelected ? 'outline-dashed' : 'outline-transparent',
                )}

                onPointerDown={(e) => handlePointerDown(e, layer.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setEditingId(layer.id)
                }}
              >
                <span style={{ visibility: isEditing ? 'hidden' : 'visible' }}>{inner}</span>

                {isEditing && (
                  <textarea
                    ref={editorRef}
                    value={layer.text}
                    onChange={(e) => onEditText(layer.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        setEditingId(null)
                      }
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    rows={Math.max(1, layer.text.split('\n').length)}
                    style={{
                      ...textStyle,
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      padding: 0,
                      overflow: 'hidden',
                      caretColor: 'currentColor',
                    }}
                  />
                )}

                {isSelected && !isEditing && (
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
                      style={{ left: hx(0), top: hy(0), transform: hTransform }}
                      className="glass-tile absolute flex size-7 items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <X className="size-4" strokeWidth={2.25} />
                    </button>

                    <button
                      type="button"
                      aria-label="Edit text"
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(layer.id)
                      }}
                      style={{ left: hx('100%'), top: hy(0), transform: hTransform }}
                      className="glass-tile absolute flex size-7 items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <Pencil className="size-4" strokeWidth={2.25} />
                    </button>

                    <button
                      type="button"
                      aria-label="Resize text"
                      onPointerDown={(e) => handleResizeDown(e, layer)}
                      onPointerMove={handleResizeMove}
                      onPointerUp={handleResizeUp}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        cursor: 'nwse-resize',
                        touchAction: 'none',
                        left: hx('100%'),
                        top: hy('100%'),
                        transform: hTransform,
                      }}
                      className="glass-tile absolute flex size-7 items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <MoveDiagonal2 className="size-4" strokeWidth={2.25} />
                    </button>

                    <button
                      type="button"
                      aria-label="Rotate text"
                      onPointerDown={(e) => handleRotateDown(e, layer)}
                      onPointerMove={handleRotateMove}
                      onPointerUp={handleRotateUp}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        cursor: 'grab',
                        touchAction: 'none',
                        left: hx('50%'),
                        top: hy(0),
                        transform: hTransform,
                      }}
                      className="glass-tile absolute flex size-7 items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <RotateCw className="size-4" strokeWidth={2.25} />
                    </button>

                    <button
                      type="button"
                      aria-label="Flip horizontally"
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange?.(layer.id, { flipH: !layer.flipH })
                      }}
                      style={{ left: hx(0), top: hy('50%'), transform: hTransform }}
                      className="glass-tile absolute flex size-7 items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <FlipHorizontal2 className="size-4" strokeWidth={2.25} />
                    </button>


                    <button
                      type="button"
                      aria-label="Duplicate text"
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicate?.(layer.id)
                      }}
                      style={{ left: hx('50%'), top: hy('100%'), transform: hTransform }}
                      className="glass-tile absolute flex size-7 items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <CopyPlus className="size-4" strokeWidth={2.25} />
                    </button>

                    <button
                      type="button"
                      aria-label="Flip vertically"
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange?.(layer.id, { flipV: !layer.flipV })
                      }}
                      style={{ left: hx(0), top: hy('100%'), transform: hTransform }}
                      className="glass-tile absolute flex size-7 items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <FlipVertical2 className="size-4" strokeWidth={2.25} />
                    </button>
                  </>
                )}

              </div>
            )
          })}
        </div>
        </div>


        {!exporting && (guides.v || guides.h) && (
          <div className="pointer-events-none absolute inset-0">
            {guides.v && (
              <span
                className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white"
                style={{ boxShadow: '0 0 4px rgba(0,0,0,0.55)' }}
              />
            )}
            {guides.h && (
              <span
                className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white"
                style={{ boxShadow: '0 0 4px rgba(0,0,0,0.55)' }}
              />
            )}
          </div>
        )}



        {!exporting && (
          <div
            className="absolute bottom-2 right-2 flex flex-col gap-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomBy(1.3)}
              className="glass-tile flex size-9 items-center justify-center rounded-full text-foreground transition active:scale-90"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => zoomBy(1 / 1.3)}
              className="glass-tile flex size-9 items-center justify-center rounded-full text-foreground transition active:scale-90"
            >
              <ZoomOut className="size-4" />
            </button>
            {(view.scale > 1 || view.tx !== 0 || view.ty !== 0) && (
              <button
                type="button"
                aria-label="Reset zoom"
                onClick={() => {
                  viewRef.current = { scale: 1, tx: 0, ty: 0 }
                  setView({ scale: 1, tx: 0, ty: 0 })
                }}
                className="glass-tile flex size-9 items-center justify-center rounded-full text-foreground transition active:scale-90"
              >
                <Minimize className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

    )
  },
)
