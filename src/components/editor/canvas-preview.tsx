import { forwardRef, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import {
  CopyPlus,
  MoveDiagonal2,
  MoveHorizontal,
  MoveVertical,
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
    const dragState = useRef<{
      id: string
      pointerId: number
      moved: boolean
      startX: number
      startY: number
      originX: number
      originY: number
    } | null>(null)
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
    const [frame, setFrame] = useState({ w: 0, h: 0 })

    // The image box keeps the source aspect ratio so on-canvas percentages and
    // cq font sizes match the exported image exactly.
    const boxSize = (() => {
      if (!frame.w || !frame.h || !aspectRatio) return { w: 0, h: 0 }
      const w = Math.min(frame.w, frame.h * aspectRatio)
      return { w, h: w / aspectRatio }
    })()

    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      const update = () => {
        const rect = el.getBoundingClientRect()
        const s = viewRef.current.scale || 1
        setFrame({ w: rect.width / s, h: rect.height / s })
      }
      update()
      const ro = new ResizeObserver(update)
      ro.observe(el)
      return () => ro.disconnect()
    }, [])




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
      if (layers.find((l) => l.id === id)?.locked) return
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      const layer = layers.find((l) => l.id === id)
      dragState.current = {
        id,
        pointerId: e.pointerId,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        originX: layer?.x ?? 50,
        originY: layer?.y ?? 50,
      }
    }

    function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
      const st = dragState.current
      if (!st) {
        stageMove(e)
        return
      }
      if (e.pointerId !== st.pointerId) return
      const dx = e.clientX - st.startX
      const dy = e.clientY - st.startY
      if (!st.moved && Math.hypot(dx, dy) < 4) return
      st.moved = true
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || !rect.width || !rect.height) return

      // Move by pointer delta from where the layer was grabbed, so the text
      // keeps its offset under the finger instead of snapping its centre.
      let x = st.originX + (dx / rect.width) * 100
      let y = st.originY + (dy / rect.height) * 100

      // Snap to the horizontal/vertical centre of the image and show guides.
      const tol = 1.6
      const snapV = Math.abs(x - 50) < tol
      const snapH = Math.abs(y - 50) < tol
      if (snapV) x = 50
      if (snapH) y = 50
      setGuides((g) => (g.v === snapV && g.h === snapH ? g : { v: snapV, h: snapH }))

      onMove(st.id, Math.max(-200, Math.min(300, x)), Math.max(-200, Math.min(300, y)))
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

    /* --- Horizontal / vertical stretch (X% / Y%) --- */
    const stretchState = useRef<{
      id: string
      axis: 'x' | 'y'
      start: number
      startValue: number
    } | null>(null)
    const [stretchHud, setStretchHud] = useState<{
      id: string
      axis: 'x' | 'y'
      value: number
    } | null>(null)

    function handleStretchDown(
      e: PointerEvent<HTMLButtonElement>,
      layer: TextLayer,
      axis: 'x' | 'y',
    ) {
      e.stopPropagation()
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      const startValue = axis === 'x' ? (layer.widthScale ?? 100) : (layer.heightScale ?? 100)
      stretchState.current = {
        id: layer.id,
        axis,
        start: axis === 'x' ? e.clientX : e.clientY,
        startValue,
      }
      setStretchHud({ id: layer.id, axis, value: Math.round(startValue) })
    }

    function handleStretchMove(e: PointerEvent<HTMLButtonElement>) {
      const st = stretchState.current
      if (!st) return
      const rect = containerRef.current?.getBoundingClientRect()
      const span = (st.axis === 'x' ? rect?.width : rect?.height) || 300
      const delta = (st.axis === 'x' ? e.clientX : e.clientY) - st.start
      // Dragging down / right decreases the value (and can cross zero to mirror).
      const dir = -1
      let next = st.startValue + (dir * delta * 200) / span
      // Dragging past zero mirrors the layer on that axis (negative scale).
      next = Math.max(-400, Math.min(400, Math.round(next)))
      if (Math.abs(next) < 5) next = next < 0 ? -5 : 5
      onChange?.(st.id, st.axis === 'x' ? { widthScale: next } : { heightScale: next })
      setStretchHud({ id: st.id, axis: st.axis, value: next })
    }

    function handleStretchUp(e: PointerEvent<HTMLButtonElement>) {
      stretchState.current = null
      setStretchHud(null)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }





    return (
      <div
        ref={ref}
        className="checker-grid relative h-full w-full select-none overflow-hidden"
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

          <div className="absolute inset-0" style={maskStyle}>
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
              mixBlendMode: (layer.blendMode ?? 'normal') as CSSProperties['mixBlendMode'],
              whiteSpace: 'nowrap',
              cursor: isEditing ? 'text' : 'move',
              touchAction: 'none',
              outlineWidth: `${1 * inv}px`,
              outlineOffset: `${5 * inv}px`,
            }

            const mirror = (v: number | string) => (v === 0 ? '100%' : v === '100%' ? 0 : v)
            const wS = (layer.widthScale ?? 100) / 100
            const hS = (layer.heightScale ?? 100) / 100
            const negW = wS < 0
            const negH = hS < 0
            const flipX = layer.flipH !== negW
            const flipY = layer.flipV !== negH
            const hx = (v: number | string) => (flipX ? mirror(v) : v)
            const hy = (v: number | string) => (flipY ? mirror(v) : v)
            const sx = flipX ? -1 : 1
            const sy = flipY ? -1 : 1
            const aw = Math.max(0.1, Math.abs(wS))
            const ah = Math.max(0.1, Math.abs(hS))
            const OFF = 22 * inv
            // Keeps handles outside the selection frame, upright and constant size.
            const hTr = (ox: number, oy: number) =>
              `translate(calc(-50% + ${(ox * sx * OFF) / aw}px), calc(-50% + ${(oy * sy * OFF) / ah}px)) scale(${(inv * sx) / aw}, ${(inv * sy) / ah})`


            const textStyle = layerTextStyle(layer)
            const inner = <LayerText layer={layer} />


            return (
              <div
                key={layer.id}
                style={wrapperStyle}
                className={cn(
                  isSelected ? 'outline-solid outline-foreground/60' : 'outline-transparent',
                )}

                onPointerDown={(e) => handlePointerDown(e, layer.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  if (layer.graphic) return
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
                      style={{ left: hx(0), top: hy(0), transform: hTr(-1, -1) }}
                      className="glass-tile absolute flex size-9 touch-none select-none items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
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
                      style={{ left: hx(0), top: hy('100%'), transform: hTr(-1, 1) }}
                      className="glass-tile absolute flex size-9 touch-none select-none items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <Pencil className="size-4" strokeWidth={2.25} />
                    </button>

                    <button
                      type="button"
                      aria-label="Resize text"
                      onPointerDown={(e) => handleResizeDown(e, layer)}
                      onPointerMove={handleResizeMove}
                      onPointerUp={handleResizeUp}
                      onPointerCancel={handleResizeUp}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        cursor: 'nwse-resize',
                        touchAction: 'none',
                        left: hx('100%'),
                        top: hy('100%'),
                        transform: hTr(1, 1),
                      }}
                      className="glass-tile absolute flex size-9 touch-none select-none items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <MoveDiagonal2 className="size-4" strokeWidth={2.25} />
                    </button>

                    <button
                      type="button"
                      aria-label="Rotate text"
                      onPointerDown={(e) => handleRotateDown(e, layer)}
                      onPointerMove={handleRotateMove}
                      onPointerUp={handleRotateUp}
                      onPointerCancel={handleRotateUp}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        cursor: 'grab',
                        touchAction: 'none',
                        left: hx('100%'),
                        top: hy(0),
                        transform: hTr(1, -1),
                      }}
                      className="glass-tile absolute flex size-9 touch-none select-none items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <RotateCw className="size-4" strokeWidth={2.25} />
                    </button>

                    <button
                      type="button"
                      aria-label="Stretch horizontally"
                      onPointerDown={(e) => handleStretchDown(e, layer, 'x')}
                      onPointerMove={handleStretchMove}
                      onPointerUp={handleStretchUp}
                      onPointerCancel={handleStretchUp}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        cursor: 'ew-resize',
                        touchAction: 'none',
                        left: hx(0),
                        top: hy('50%'),
                        transform: hTr(-1, 0),
                      }}
                      className="glass-tile absolute flex size-9 touch-none select-none items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <MoveHorizontal className="size-4" strokeWidth={2.25} />
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
                      style={{ left: hx('50%'), top: hy('100%'), transform: hTr(0, 1) }}
                      className="glass-tile absolute flex size-9 touch-none select-none items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <CopyPlus className="size-4" strokeWidth={2.25} />
                    </button>

                    <button
                      type="button"
                      aria-label="Stretch vertically"
                      onPointerDown={(e) => handleStretchDown(e, layer, 'y')}
                      onPointerMove={handleStretchMove}
                      onPointerUp={handleStretchUp}
                      onPointerCancel={handleStretchUp}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        cursor: 'ns-resize',
                        touchAction: 'none',
                        left: hx('50%'),
                        top: hy(0),
                        transform: hTr(0, -1),
                      }}
                      className="glass-tile absolute flex size-9 touch-none select-none items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <MoveVertical className="size-4" strokeWidth={2.25} />
                    </button>

                    {stretchHud && stretchHud.id === layer.id && (
                      <span
                        className="glass-tile pointer-events-none absolute rounded-full px-2 py-0.5 text-[11px] font-semibold canvas-handle-icon"
                        style={{
                          left: '50%',
                          top: 0,
                          transform: `translate(-50%, -160%) scale(${inv})`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {stretchHud.axis === 'x' ? 'X' : 'Y'}: {stretchHud.value}%
                      </span>
                    )}
                  </>
                )}

              </div>
            )
          })}
          </div>

          {overlay}

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
