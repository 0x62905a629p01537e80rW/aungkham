import { forwardRef, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import {
  CopyPlus,
  WrapText,
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
import { LayerText, layerTextStyle, layerTransform, chromeTransform } from './text-layer-view'
import type { TextLayer } from '@/lib/text-layer'
import { pulseInteraction, rafThrottle } from '@/lib/perf'

interface CanvasPreviewProps {
  image: string
  aspectRatio: number
  layers: TextLayer[]
  selectedId: string | null
  exporting: boolean
  showGrid?: boolean
  /** Stage-level erase mask (white = keep, transparent = erased) for all layers. */
  eraseMask?: string
  /** Flattened freehand drawing rendered above the image and layers. */
  doodle?: string
  /** Extra content rendered inside the image box, e.g. the erase brush surface. */
  overlay?: ReactNode
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, fontSize: number) => void
  onDelete: (id: string) => void
  onEditText: (id: string, text: string) => void
  onChange?: (id: string, patch: Partial<TextLayer>) => void
  onDuplicate?: (id: string) => void
  onBringForward?: (id: string) => void
  /** Reports zoom level and the image-space centre of the visible area (%). */
  onViewChange?: (v: { scale: number; cx: number; cy: number }) => void
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
      eraseMask,
      doodle,
      overlay,
      onSelect,
      onMove,
      onResize,
      onDelete,
      onEditText,
      onChange,
      onDuplicate,
      onBringForward,
      onViewChange,
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
      startWrap?: number
      startSize: number
    } | null>(null)
    const lastTapRef = useRef<{ id: string; time: number } | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null })
    const editorRef = useRef<HTMLTextAreaElement | null>(null)
    const [frame, setFrame] = useState({ w: 0, h: 0 })

    const maskStyle: CSSProperties | undefined = eraseMask
      ? {
          WebkitMaskImage: `url(${eraseMask})`,
          maskImage: `url(${eraseMask})`,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }
      : undefined

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
        const el = editorRef.current
        el.focus()
        // Place the caret at the end instead of selecting the whole text
        const end = el.value.length
        el.setSelectionRange(end, end)
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

    // Keep the parent informed so newly added layers land in the visible area.
    useEffect(() => {
      if (!onViewChange || !boxSize.w || !boxSize.h) return
      onViewChange({
        scale: view.scale,
        cx: 50 - (view.tx / view.scale / boxSize.w) * 100,
        cy: 50 - (view.ty / view.scale / boxSize.h) * 100,
      })
    }, [view, boxSize.w, boxSize.h, onViewChange])

    const baseSize = useRef({ w: 0, h: 0 })
    const rafRef = useRef<number | null>(null)
    const pendingRef = useRef<{ scale: number; tx: number; ty: number } | null>(null)

    // While the view is actively moving we promote the canvas to its own GPU
    // layer for smoothness; once it settles we drop the promotion so text and
    // artwork re-rasterize crisply at the current zoom instead of staying blurry.
    const [interacting, setInteracting] = useState(false)
    const interactTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    function markInteracting() {
      setInteracting(true)
      if (interactTimer.current) clearTimeout(interactTimer.current)
      interactTimer.current = setTimeout(() => setInteracting(false), 220)
    }
    useEffect(() => () => {
      if (interactTimer.current) clearTimeout(interactTimer.current)
    }, [])

    function measureBase() {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const s = viewRef.current.scale || 1
      baseSize.current = { w: rect.width / s, h: rect.height / s }
    }

    function clampView(v: { scale: number; tx: number; ty: number }) {
      // Free movement: the image can be zoomed out below fit size and dragged
      // anywhere inside the frame, keeping a bit of it always reachable.
      // Practically unlimited zoom: deep zoom stays available for fine nudging.
      const scale = Math.max(0.2, Math.min(64, v.scale))
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
      markInteracting()
      if (rafRef.current != null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (pendingRef.current) setView(pendingRef.current)
      })
    }

    // Layer drags are coalesced into one state update per animation frame so
    // a 120Hz pointer stream never queues more renders than frames.
    const onMoveRef = useRef(onMove)
    onMoveRef.current = onMove
    const dragRectRef = useRef<{ width: number; height: number } | null>(null)
    const emitMove = useRef(
      rafThrottle((id: string, x: number, y: number) => onMoveRef.current(id, x, y)),
    ).current

    // Stretch drags stream at the display refresh rate; coalesce them to one
    // committed change per frame so the GPU-composited layer keeps up.
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const emitStretch = useRef(
      rafThrottle((id: string, axis: 'x' | 'y', value: number) =>
        onChangeRef.current?.(id, axis === 'x' ? { widthScale: value } : { heightScale: value }),
      ),
    ).current

    useEffect(() => () => {
      emitMove.cancel()
      emitStretch.cancel()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }, [emitMove, emitStretch])


    function stageDown(e: PointerEvent<HTMLDivElement>) {
      pulseInteraction(400)
      // A primary pointer means no other finger is genuinely down. Any ids left
      // in the map at that moment are stale (a pointerup/cancel we never saw,
      // e.g. the captured element unmounted mid-gesture) and would otherwise
      // fake a pinch on the very next tap — zooming wildly and eating taps.
      if (e.isPrimary) pointers.current.clear()
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
        pinchRef.current = null
        panRef.current = { x: e.clientX, y: e.clientY, view: viewRef.current }
      }
    }


    function stageMove(e: PointerEvent<HTMLDivElement>) {
      if (!pointers.current.has(e.pointerId)) return
      pulseInteraction(400)
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const pinch = pinchRef.current
      if (pinch && pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (dist < 8) return
        const cx = (a.x + b.x) / 2
        const cy = (a.y + b.y) / 2
        const ratio = dist / pinch.dist
        const nextScale = Math.max(0.2, Math.min(64, pinch.view.scale * ratio))
        const k = nextScale / pinch.view.scale
        // Anchor the zoom on the pinch midpoint so the content under the
        // fingers stays put instead of drifting away from the gesture.
        const host = containerRef.current?.parentElement
        const rect = host?.getBoundingClientRect()
        const ox = rect ? pinch.cx - (rect.left + rect.width / 2) : 0
        const oy = rect ? pinch.cy - (rect.top + rect.height / 2) : 0
        commitView({
          scale: nextScale,
          tx: ox - (ox - pinch.view.tx) * k + (cx - pinch.cx),
          ty: oy - (oy - pinch.view.ty) * k + (cy - pinch.cy),
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

    // Wheel / trackpad-pinch zoom anchored at the cursor. Registered natively so
    // preventDefault actually stops the page from scrolling behind the canvas.
    const wheelRef = useRef<(e: WheelEvent) => void>(() => {})
    wheelRef.current = (e: WheelEvent) => {
      const host = containerRef.current?.parentElement
      if (!host) return
      const rect = host.getBoundingClientRect()
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1)
      const v = viewRef.current
      const next = Math.max(0.2, Math.min(64, v.scale * Math.exp(-dy * 0.0015)))
      if (next === v.scale) return
      const k = next / v.scale
      const px = e.clientX - (rect.left + rect.width / 2)
      const py = e.clientY - (rect.top + rect.height / 2)
      measureBase()
      commitView({ scale: next, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k })
    }

    useEffect(() => {
      const host = containerRef.current?.parentElement
      if (!host) return
      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        wheelRef.current(e)
      }
      host.addEventListener('wheel', onWheel, { passive: false })
      return () => host.removeEventListener('wheel', onWheel)
    }, [])

    // Safety net: a pointer that ends outside the stage (or whose captured
    // element unmounted) never reaches stageUp. Track releases on the window so
    // the pointer map can't accumulate ghosts that later fake a pinch.
    useEffect(() => {
      const release = (e: globalThis.PointerEvent) => {
        pointers.current.delete(e.pointerId)
        if (pointers.current.size < 2) pinchRef.current = null
        if (pointers.current.size === 0) panRef.current = null
      }
      window.addEventListener('pointerup', release)
      window.addEventListener('pointercancel', release)
      return () => {
        window.removeEventListener('pointerup', release)
        window.removeEventListener('pointercancel', release)
      }
    }, [])




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
      markInteracting()
      const rect = dragRectRef.current ?? containerRef.current?.getBoundingClientRect() ?? null
      if (!rect || !rect.width || !rect.height) return
      dragRectRef.current = { width: rect.width, height: rect.height }

      // Move by pointer delta from where the layer was grabbed, so the text
      // keeps its offset under the finger instead of snapping its centre.
      let x = st.originX + (dx / rect.width) * 100
      let y = st.originY + (dy / rect.height) * 100

      // Snap to the canvas centre/thirds and to the centre of any other layer.
      const tol = 1.6
      const others = layers.filter((l) => l.id !== st.id && !l.hidden)
      const xTargets = [50, ...others.map((l) => l.x)]
      const yTargets = [50, ...others.map((l) => l.y)]
      let snapV: number | null = null
      let snapH: number | null = null
      for (const t of xTargets) {
        if (Math.abs(x - t) < tol) {
          snapV = t
          x = t
          break
        }
      }
      for (const t of yTargets) {
        if (Math.abs(y - t) < tol) {
          snapH = t
          y = t
          break
        }
      }
      setGuides((g) => (g.v === snapV && g.h === snapH ? g : { v: snapV, h: snapH }))

      emitMove(st.id, Math.max(-200, Math.min(300, x)), Math.max(-200, Math.min(300, y)))
    }



    function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
      stageUp(e)
      emitMove.flush()
      dragRectRef.current = null
      setGuides({ v: null, h: null })
      const st = dragState.current
      dragState.current = null

      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      // A cancelled pointer (scroll takeover, system gesture) is not a tap.
      if (st && !st.moved && e.type !== 'pointercancel') {

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
        startWrap: layer.wrapWidth,
      }
    }

    function handleResizeMove(e: PointerEvent<HTMLButtonElement>) {
      const st = resizeState.current
      if (!st) return
      markInteracting()
      const layer = layers.find((l) => l.id === st.id)
      if (!layer) return
      const dist = centerDistance(layer, e.clientX, e.clientY)
      const ratio = dist / st.startDist
      const next = Math.max(0.5, Math.min(120, st.startSize * ratio))
      onResize(st.id, Math.round(next * 2) / 2)
      // Keep the wrap box proportional so scaling doesn't re-flow the lines.
      if (st.startWrap) {
        const k = next / st.startSize
        onChange?.(st.id, {
          wrapWidth: Math.round(Math.max(5, Math.min(1200, st.startWrap * k)) * 10) / 10,
        })
      }
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
      markInteracting()
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
      layer: TextLayer
      axis: 'x' | 'y'
      start: number
      startValue: number
      value: number
      content: HTMLElement | null
      chrome: HTMLElement | null
      hud: HTMLElement | null
    } | null>(null)
    const [stretchHud, setStretchHud] = useState<{
      id: string
      axis: 'x' | 'y'
      value: number
    } | null>(null)


    const wrapState = useRef<{ id: string; start: number; startValue: number } | null>(null)

    /** Drag the right-edge handle to set the text box width so the text wraps. */
    function handleWrapDown(e: PointerEvent<HTMLButtonElement>, layer: TextLayer) {
      e.stopPropagation()
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      const rect = containerRef.current?.getBoundingClientRect()
      let startValue = layer.wrapWidth ?? 0
      if (!startValue) {
        const box = e.currentTarget.parentElement?.getBoundingClientRect()
        startValue = box && rect?.width ? (box.width / rect.width) * 100 : 50
      }
      wrapState.current = { id: layer.id, start: e.clientX, startValue }
    }

    function handleWrapMove(e: PointerEvent<HTMLButtonElement>) {
      const st = wrapState.current
      if (!st) return
      const rect = containerRef.current?.getBoundingClientRect()
      const span = rect?.width || 300
      const delta = ((e.clientX - st.start) / span) * 100
      const next = Math.max(5, Math.min(200, st.startValue + delta))
      onChange?.(st.id, { wrapWidth: Math.round(next * 10) / 10 })
    }

    function handleWrapUp(e: PointerEvent<HTMLButtonElement>) {
      wrapState.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }

    /**
     * Stretching writes straight to the DOM while the finger is down: React
     * only sees the value once on release. That keeps the gesture at display
     * refresh rate even with heavy text effects on the layer.
     */
    function handleStretchDown(
      e: PointerEvent<HTMLButtonElement>,
      layer: TextLayer,
      axis: 'x' | 'y',
    ) {
      e.stopPropagation()
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      markInteracting()
      const raw = axis === 'x' ? (layer.widthScale ?? 100) : (layer.heightScale ?? 100)
      const startValue = clampStretch(raw)
      stretchState.current = {
        id: layer.id,
        layer,
        axis,
        start: axis === 'x' ? e.clientX : e.clientY,
        startValue,
        value: startValue,
        content: document.querySelector<HTMLElement>(`[data-layer-id="${layer.id}"]`),
        chrome: document.querySelector<HTMLElement>('[data-chrome]'),
        hud: document.querySelector<HTMLElement>('[data-stretch-hud]'),
      }
      setStretchHud({ id: layer.id, axis, value: Math.round(startValue) })
    }

    /** Keeps the value inside ±400% and skips the unusable band around zero. */
    function clampStretch(v: number) {
      const n = Math.round(v)
      const sign = n < 0 ? -1 : 1
      return sign * Math.max(8, Math.min(400, Math.abs(n) || 100))
    }

    function handleStretchMove(e: PointerEvent<HTMLButtonElement>) {
      const st = stretchState.current
      if (!st) return
      markInteracting()
      const rect = containerRef.current?.getBoundingClientRect()
      const span = (st.axis === 'x' ? rect?.width : rect?.height) || 300
      const delta = (st.axis === 'x' ? e.clientX : e.clientY) - st.start
      // Dragging down / right shrinks the axis and keeps going past zero into
      // negative (mirrored) territory, exactly like the on-canvas box.
      const next = clampStretch(st.startValue - (delta * 220) / span)
      if (next === st.value) return
      st.value = next
      const live: TextLayer =
        st.axis === 'x'
          ? { ...st.layer, widthScale: next }
          : { ...st.layer, heightScale: next }
      if (st.content) st.content.style.transform = `${layerTransform(live)} translateZ(0)`
      if (st.chrome) {
        st.chrome.style.transform = chromeTransform(live)
        applyHandleVars(st.chrome, live, 1 / viewRef.current.scale)
      }
      if (st.hud) st.hud.textContent = `${st.axis === 'x' ? 'X' : 'Y'}: ${next}%`
    }

    function handleStretchUp(e: PointerEvent<HTMLButtonElement>) {
      const st = stretchState.current
      stretchState.current = null
      setStretchHud(null)
      if (st) {
        onChange?.(st.id, st.axis === 'x' ? { widthScale: st.value } : { heightScale: st.value })
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }







    /**
     * Handle geometry is expressed with CSS variables so a live stretch can be
     * pushed onto the node without a React render. The buttons undo the frame's
     * scale/mirror exactly, which keeps them perfectly round and upright no
     * matter how far the layer is stretched.
     */
    function applyHandleVars(node: HTMLElement, layer: TextLayer, inv: number) {
      const wS = (layer.widthScale ?? 100) / 100
      const hS = (layer.heightScale ?? 100) / 100
      const sx = layer.flipH !== wS < 0 ? -1 : 1
      const sy = layer.flipV !== hS < 0 ? -1 : 1
      node.style.setProperty('--hx', String(sx))
      node.style.setProperty('--hy', String(sy))
      node.style.setProperty('--aw', String(Math.max(0.05, Math.abs(wS) || 1)))
      node.style.setProperty('--ah', String(Math.max(0.05, Math.abs(hS) || 1)))
      node.style.setProperty('--inv', String(inv))
      node.style.setProperty('--off', `${22 * inv}px`)
    }

    const handleVars = (layer: TextLayer, inv: number): CSSProperties => {
      const wS = (layer.widthScale ?? 100) / 100
      const hS = (layer.heightScale ?? 100) / 100
      return {
        ['--hx' as string]: layer.flipH !== wS < 0 ? -1 : 1,
        ['--hy' as string]: layer.flipV !== hS < 0 ? -1 : 1,
        ['--aw' as string]: Math.max(0.05, Math.abs(wS) || 1),
        ['--ah' as string]: Math.max(0.05, Math.abs(hS) || 1),
        ['--inv' as string]: inv,
        ['--off' as string]: `${22 * inv}px`,
      }
    }

    /**
     * Selection frame + handles for the active layer. Rendered in an unmasked
     * container so the erase mask never hides the controls.
     */
    function renderChrome(layer: TextLayer) {
      const inv = 1 / view.scale
      const mirror = (v: number | string) => (v === 0 ? '100%' : v === '100%' ? 0 : v)
      const wS = (layer.widthScale ?? 100) / 100
      const hS = (layer.heightScale ?? 100) / 100
      const flipX = layer.flipH !== wS < 0
      const flipY = layer.flipV !== hS < 0
      const hx = (v: number | string) => (flipX ? mirror(v) : v)
      const hy = (v: number | string) => (flipY ? mirror(v) : v)
      // Exact inverse of the frame transform, expressed in CSS variables so the
      // icons stay circular and readable at any stretch value.
      const hTr = (ox: number, oy: number) =>
        `translate(calc(-50% + ${ox} * var(--hx) * var(--off) / var(--aw)), calc(-50% + ${oy} * var(--hy) * var(--off) / var(--ah))) scale(calc(var(--inv) * var(--hx) / var(--aw)), calc(var(--inv) * var(--hy) / var(--ah)))`


      return (
        <div
          data-chrome
          style={{
            position: 'absolute',
            left: `${layer.x}%`,
            top: `${layer.y}%`,
            transform: chromeTransform(layer),
            willChange: interacting ? 'transform' : 'auto',

            whiteSpace: 'nowrap',
            cursor: 'move',
            touchAction: 'none',
            outlineWidth: `${1 * inv}px`,
            outlineOffset: `${5 * inv}px`,
            ...handleVars(layer, inv),
          }}
          className="outline-solid outline-foreground/60"

          onPointerDown={(e) => handlePointerDown(e, layer.id)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}

          onDoubleClick={(e) => {
            e.stopPropagation()
            if (layer.graphic) return
            setEditingId(layer.id)
          }}
        >
          <span style={{ visibility: 'hidden' }}>
            <LayerText layer={layer} />
          </span>
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

                    {!layer.graphic && (
                    <button
                      type="button"
                      aria-label="Text box width (drag to wrap, double-tap to reset)"
                      onPointerDown={(e) => handleWrapDown(e, layer)}
                      onPointerMove={handleWrapMove}
                      onPointerUp={handleWrapUp}
                      onPointerCancel={handleWrapUp}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        onChange?.(layer.id, { wrapWidth: undefined })
                      }}
                      style={{
                        cursor: 'ew-resize',
                        touchAction: 'none',
                        left: hx('100%'),
                        top: hy('50%'),
                        transform: hTr(1, 0),
                      }}
                      className="glass-tile absolute flex size-9 touch-none select-none items-center justify-center rounded-full canvas-handle-icon transition active:scale-90"
                    >
                      <WrapText className="size-4" strokeWidth={2.25} />
                    </button>
                    )}

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
        </div>
      )
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
            willChange: interacting ? 'transform' : 'auto',
            backfaceVisibility: interacting ? 'hidden' : 'visible',
          }}
        >

        <div
          className="relative"
          data-canvas-box=""
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
            decoding="async"
            fetchPriority="high"
            draggable={false}
            style={
              interacting
                ? { transform: 'translateZ(0)', backfaceVisibility: 'hidden' }
                : undefined
            }
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

          <div className={`absolute inset-0 ${exporting ? 'overflow-hidden' : 'overflow-visible'}`} style={maskStyle}>
          {layers.filter((l) => !l.hidden).map((layer) => {
            const isEditing = editingId === layer.id && !exporting
            const inv = 1 / view.scale
            // Promote the layer being manipulated to its own GPU texture so
            // drag / stretch / rotate composite on the GPU instead of forcing a
            // full repaint of the text (shadows, strokes, gradients) each frame.
            const live = interacting && layer.id === selectedId && !exporting
            const wrapperStyle: CSSProperties = {
              position: 'absolute',
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: `${layerTransform(layer)} translateZ(0)`,
              opacity: layer.opacity,
              mixBlendMode: (layer.blendMode ?? 'normal') as CSSProperties['mixBlendMode'],
              whiteSpace: 'nowrap',
              cursor: isEditing ? 'text' : 'move',
              touchAction: 'none',
              willChange: live ? 'transform' : 'auto',
              backfaceVisibility: live ? 'hidden' : 'visible',
              outlineWidth: `${1 * inv}px`,
              outlineOffset: `${5 * inv}px`,
            }


            const textStyle = layerTextStyle(layer)
            const inner = <LayerText layer={layer} />


            return (
              <div
                key={layer.id}
                data-layer-id={layer.id}
                style={wrapperStyle}
                className="outline-transparent"


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


              </div>
            )
          })}
          </div>

          {!exporting &&
            selectedId &&
            editingId !== selectedId &&
            (() => {
              const sel = layers.find((l) => l.id === selectedId && !l.hidden)
              return sel ? <div className="absolute inset-0">{renderChrome(sel)}</div> : null
            })()}

          {doodle && (
            <img
              src={doodle}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 h-full w-full"
              draggable={false}
            />
          )}

          {overlay}


        </div>
        </div>


        {!exporting && (guides.v !== null || guides.h !== null) && (
          <div className="pointer-events-none absolute inset-0">
            {guides.v !== null && (
              <span
                className="absolute top-0 h-full w-px -translate-x-1/2 bg-[#22d3ee]"
                style={{ left: `${guides.v}%`, boxShadow: '0 0 4px rgba(0,0,0,0.55)' }}
              />
            )}
            {guides.h !== null && (
              <span
                className="absolute left-0 h-px w-full -translate-y-1/2 bg-[#22d3ee]"
                style={{ top: `${guides.h}%`, boxShadow: '0 0 4px rgba(0,0,0,0.55)' }}
              />
            )}
          </div>
        )}



        {!exporting && (
          <div
            className="absolute bottom-5 right-2 flex flex-col gap-1"
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
