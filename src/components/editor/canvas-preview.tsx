import { forwardRef, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { Maximize2, Pencil, X, ZoomIn, ZoomOut, Minimize } from 'lucide-react'
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
  onEditText: (id: string, text: string) => void
}

export const CanvasPreview = forwardRef<HTMLDivElement, CanvasPreviewProps>(
  function CanvasPreview(
    { image, aspectRatio, layers, selectedId, exporting, onSelect, onMove, onResize, onDelete, onEditText },
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

    function clampView(v: { scale: number; tx: number; ty: number }) {
      const scale = Math.max(1, Math.min(6, v.scale))
      const rect = containerRef.current?.getBoundingClientRect()
      const w = (rect?.width ?? 0) / (viewRef.current.scale || 1)
      const h = (rect?.height ?? 0) / (viewRef.current.scale || 1)
      const maxX = (w * (scale - 1)) / 2
      const maxY = (h * (scale - 1)) / 2
      return {
        scale,
        tx: Math.max(-maxX, Math.min(maxX, v.tx)),
        ty: Math.max(-maxY, Math.min(maxY, v.ty)),
      }
    }

    function stageDown(e: PointerEvent<HTMLDivElement>) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()]
        pinchRef.current = {
          dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          cx: (a.x + b.x) / 2,
          cy: (a.y + b.y) / 2,
          view: viewRef.current,
        }
        dragState.current = null
      } else if (pointers.current.size === 1 && viewRef.current.scale > 1) {
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
        setView(
          clampView({
            scale: pinch.view.scale * ratio,
            tx: pinch.view.tx + (cx - pinch.cx),
            ty: pinch.view.ty + (cy - pinch.cy),
          }),
        )
        return
      }
      const pan = panRef.current
      if (pan && !dragState.current && pointers.current.size === 1) {
        setView(
          clampView({
            scale: pan.view.scale,
            tx: pan.view.tx + (e.clientX - pan.x),
            ty: pan.view.ty + (e.clientY - pan.y),
          }),
        )
      }
    }

    function stageUp(e: PointerEvent<HTMLDivElement>) {
      pointers.current.delete(e.pointerId)
      if (pointers.current.size < 2) pinchRef.current = null
      if (pointers.current.size === 0) panRef.current = null
    }

    function zoomBy(factor: number) {
      setView((v) => clampView({ ...v, scale: v.scale * factor }))
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
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      onMove(
        dragState.current.id,
        Math.max(-200, Math.min(300, x)),
        Math.max(-200, Math.min(300, y)),
      )
    }


    function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
      stageUp(e)
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

    return (
      <div
        ref={ref}
        className="relative w-full select-none overflow-hidden"
        style={{ containerType: 'size', lineHeight: 0, aspectRatio, touchAction: 'none' }}
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
          className="absolute inset-0"
          style={{
            transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
            transformOrigin: 'center center',
          }}
        >

          <img
            src={image || '/placeholder.svg'}
            alt="Editing canvas"
            crossOrigin="anonymous"
            className="block h-full w-full object-cover"
            draggable={false}
          />

          {layers.map((layer) => {
            const isSelected = layer.id === selectedId && !exporting
            const isEditing = editingId === layer.id && !exporting
            const inv = 1 / view.scale
            const wrapperStyle: CSSProperties = {
              position: 'absolute',
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) skew(${layer.skewX}deg, ${layer.skewY}deg)`,
              opacity: layer.opacity,
              whiteSpace: 'nowrap',
              cursor: isEditing ? 'text' : 'move',
              touchAction: 'none',
              outlineWidth: `${2 * inv}px`,
              outlineOffset: `${4 * inv}px`,
            }

            const textStyle = layerTextStyle(layer)
            const inner = layer.highlight ? (
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: layer.highlightColor,
                  padding: '0.08em 0.28em',
                  borderRadius: '0.08em',
                }}
              >
                <span style={textStyle}>{layer.text || ' '}</span>
              </span>
            ) : (
              <p style={textStyle}>{layer.text || ' '}</p>
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
                      className="absolute -left-3 -top-3 flex size-8 items-center justify-center rounded-full bg-destructive text-white shadow-md ring-2 ring-card transition active:scale-90"
                    >
                      <X className="size-4" />
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
                      className="absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition active:scale-90"
                    >
                      <Pencil className="size-4" />
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

        {!exporting && (
          <div
            className="absolute bottom-2 right-2 flex flex-col gap-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomBy(1.3)}
              className="flex size-9 items-center justify-center rounded-full bg-card/70 text-foreground shadow-md ring-1 ring-border backdrop-blur transition active:scale-90"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => zoomBy(1 / 1.3)}
              className="flex size-9 items-center justify-center rounded-full bg-card/70 text-foreground shadow-md ring-1 ring-border backdrop-blur transition active:scale-90"
            >
              <ZoomOut className="size-4" />
            </button>
            {view.scale > 1 && (
              <button
                type="button"
                aria-label="Reset zoom"
                onClick={() => setView({ scale: 1, tx: 0, ty: 0 })}
                className="flex size-9 items-center justify-center rounded-full bg-card/70 text-foreground shadow-md ring-1 ring-border backdrop-blur transition active:scale-90"
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
