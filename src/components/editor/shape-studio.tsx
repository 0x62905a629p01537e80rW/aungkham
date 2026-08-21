import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  Check,
  CornerUpLeft,
  CornerUpRight,
  Eraser,
  Minus,
  MousePointer2,
  PenTool,
  Plus,
  Signature,
  Spline,
  Bookmark,
  Crown,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import { PaymentPage } from './payment-page'
import {
  deleteSavedShape,
  listSavedShapes,
  saveShape,
  serverSavedShapes,
  subscribeSavedShapes,
} from '@/lib/saved-shapes'
import { SliderField } from './control-fields'
import {
  FREE_PRESETS,
  buildFreePath,
  normalizeNodes,
  simplify,
  type ShapeNode,
} from '@/lib/free-shape'
import { shapeDataUrl } from '@/lib/shapes'
import type { GraphicContent } from '@/lib/text-layer'

type Mode = 'pen' | 'draw' | 'edit' | 'delete'

const MODES: { key: Mode; label: string; icon: typeof PenTool }[] = [
  { key: 'pen', label: 'Pen', icon: PenTool },
  { key: 'draw', label: 'Free draw', icon: Signature },
  { key: 'edit', label: 'Move', icon: MousePointer2 },
  { key: 'delete', label: 'Delete', icon: Eraser },
]

const SWATCHES = [
  '#111827',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

interface Props {
  onCancel: () => void
  onAdd: (graphic: GraphicContent, name: string) => void
}

/** Full-screen, mobile-first free-form shape designer. */
export function ShapeStudio({ onCancel, onAdd }: Props) {
  const [nodes, setNodes] = useState<ShapeNode[]>([])
  const [closed, setClosed] = useState(true)
  const [smooth, setSmooth] = useState(true)
  const [mode, setMode] = useState<Mode>('pen')
  const [color, setColor] = useState('#111827')
  const [outline, setOutline] = useState(false)
  const [strokeWidth, setStrokeWidth] = useState(8)
  const [grid, setGrid] = useState(true)
  const [snap, setSnap] = useState(false)
  const { isPro } = useAuth()
  const [pay, setPay] = useState(false)
  const saved = useSyncExternalStore(subscribeSavedShapes, listSavedShapes, serverSavedShapes)

  const past = useRef<ShapeNode[][]>([])
  const future = useRef<ShapeNode[][]>([])
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragIndex = useRef<number | null>(null)
  const drawing = useRef<ShapeNode[] | null>(null)
  const [, force] = useState(0)

  const commit = (next: ShapeNode[]) => {
    past.current = [...past.current.slice(-40), nodes]
    future.current = []
    setNodes(next)
  }
  const undo = () => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(nodes)
    setNodes(prev)
    force((n) => n + 1)
  }
  const redo = () => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(nodes)
    setNodes(next)
    force((n) => n + 1)
  }

  const path = useMemo(() => buildFreePath(nodes, closed, smooth), [nodes, closed, smooth])

  function toLocal(e: React.PointerEvent) {
    const el = svgRef.current
    if (!el) return { x: 50, y: 50 }
    const r = el.getBoundingClientRect()
    let x = ((e.clientX - r.left) / r.width) * 100
    let y = ((e.clientY - r.top) / r.height) * 100
    if (snap) {
      x = Math.round(x / 5) * 5
      y = Math.round(y / 5) * 5
    }
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
  }

  function hitNode(p: { x: number; y: number }) {
    let best = -1
    let bestD = 6
    nodes.forEach((n, i) => {
      const d = Math.hypot(n.x - p.x, n.y - p.y)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toLocal(e)
    if (mode === 'draw') {
      drawing.current = [p]
      past.current = [...past.current.slice(-40), nodes]
      future.current = []
      setNodes([p])
      return
    }
    const hit = hitNode(p)
    if (mode === 'delete') {
      if (hit >= 0) commit(nodes.filter((_, i) => i !== hit))
      return
    }
    if (hit >= 0) {
      dragIndex.current = hit
      past.current = [...past.current.slice(-40), nodes]
      future.current = []
      return
    }
    if (mode === 'pen') commit([...nodes, p])
  }

  function onPointerMove(e: React.PointerEvent) {
    if (drawing.current) {
      const p = toLocal(e)
      const prev = drawing.current[drawing.current.length - 1]
      if (Math.hypot(p.x - prev.x, p.y - prev.y) < 0.8) return
      drawing.current.push(p)
      setNodes([...drawing.current])
      return
    }
    const i = dragIndex.current
    if (i === null) return
    const p = toLocal(e)
    setNodes((prev) => prev.map((n, idx) => (idx === i ? { ...n, x: p.x, y: p.y } : n)))
  }

  function onPointerUp() {
    if (drawing.current) {
      const pts = simplify(drawing.current, 1.2)
      drawing.current = null
      setNodes(pts)
      return
    }
    dragIndex.current = null
  }

  function toggleCorner(i: number) {
    commit(nodes.map((n, idx) => (idx === i ? { ...n, corner: !n.corner } : n)))
  }

  const canAdd = nodes.length >= (closed ? 3 : 2)

  /** Geometry of the current drawing, ready for the canvas or the library. */
  function build() {
    const normalized = normalizeNodes(nodes, outline ? Math.max(4, strokeWidth) : 4)
    const d = buildFreePath(normalized, closed, smooth)
    return { d, stroked: outline || !closed }
  }

  function addToCanvas() {
    if (!canAdd) return
    // Designing is free — taking the shape out of the lab is a Pro feature.
    if (!isPro) {
      setPay(true)
      return
    }
    const { d, stroked } = build()
    onAdd(
      {
        kind: 'shape',
        src: shapeDataUrl(d, color, stroked, strokeWidth),
        aspect: 1,
        path: d,
        outline: stroked,
        strokeWidth,
      },
      'Free form',
    )
  }

  function saveToLibrary() {
    if (!canAdd) return
    if (!isPro) {
      setPay(true)
      return
    }
    const { d, stroked } = build()
    saveShape({
      name: `My shape ${saved.length + 1}`,
      path: d,
      color,
      outline: stroked,
      strokeWidth,
    })
    toast.success('Shape saved to My shapes')
  }

  function useSaved(s: (typeof saved)[number]) {
    if (!isPro) {
      setPay(true)
      return
    }
    onAdd(
      {
        kind: 'shape',
        src: shapeDataUrl(s.path, s.color, s.outline, s.strokeWidth),
        aspect: 1,
        path: s.path,
        outline: s.outline,
        strokeWidth: s.strokeWidth,
      },
      s.name,
    )
  }

  const chip =
    'flex h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition active:scale-95'

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-background"
      style={{
        paddingTop: 'var(--safe-top)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-2">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="grid size-9 place-items-center rounded-full text-muted-foreground active:scale-95"
        >
          <X className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold">Free form shape</h1>
        <button
          type="button"
          onClick={undo}
          aria-label="Undo"
          className="grid size-9 place-items-center rounded-full text-muted-foreground active:scale-95 disabled:opacity-30"
          disabled={past.current.length === 0}
        >
          <CornerUpLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          aria-label="Redo"
          className="grid size-9 place-items-center rounded-full text-muted-foreground active:scale-95 disabled:opacity-30"
          disabled={future.current.length === 0}
        >
          <CornerUpRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={saveToLibrary}
          disabled={!canAdd}
          aria-label="Save shape"
          className="grid size-9 place-items-center rounded-full text-muted-foreground active:scale-95 disabled:opacity-30"
        >
          <Bookmark className="size-4" />
        </button>
        <button
          type="button"
          onClick={addToCanvas}
          disabled={!canAdd}
          className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition active:scale-95 disabled:opacity-40"
        >
          <Check className="size-4" /> Add
          {!isPro && <Crown className="size-3.5" />}
        </button>
      </header>

      {/* Design surface */}
      <div className="flex min-h-0 flex-1 items-center justify-center p-3">
        <div className="relative aspect-square w-full max-w-[min(92vw,52dvh)] overflow-hidden rounded-3xl border border-border/60 bg-muted/30">
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            className="size-full touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {grid && (
              <g stroke="currentColor" className="text-foreground/10" strokeWidth={0.3}>
                {Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map((v) => (
                  <g key={v}>
                    <line x1={v} y1={0} x2={v} y2={100} />
                    <line x1={0} y1={v} x2={100} y2={v} />
                  </g>
                ))}
              </g>
            )}
            {path && (
              <path
                d={path}
                fill={outline || !closed ? 'none' : color}
                stroke={outline || !closed ? color : 'none'}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fillRule="evenodd"
              />
            )}
            {mode !== 'draw' &&
              nodes.map((n, i) => (
                <g key={`${i}-${n.x}-${n.y}`}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={2.6}
                    className={cn(
                      'stroke-background',
                      n.corner ? 'fill-amber-400' : 'fill-primary',
                    )}
                    strokeWidth={0.9}
                    onDoubleClick={() => toggleCorner(i)}
                  />
                </g>
              ))}
          </svg>
          {nodes.length === 0 && (
            <p className="pointer-events-none absolute inset-x-4 bottom-4 text-center text-[11px] text-muted-foreground">
              Tap to drop points, or switch to Free draw and trace with your finger.
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 space-y-2 border-t border-border/60 px-3 pb-3 pt-2">
        <div className="grid grid-cols-4 gap-1.5">
          {MODES.map((m) => {
            const Icon = m.icon
            const on = mode === m.key
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border text-[10px] font-semibold transition active:scale-95',
                  on
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-foreground/5 text-foreground/70',
                )}
              >
                <Icon className="size-4" />
                {m.label}
              </button>
            )
          })}
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto no-scrollbar px-1">
          <button
            type="button"
            onClick={() => setClosed((v) => !v)}
            className={cn(chip, closed ? 'bg-primary text-primary-foreground' : 'border border-border/60 bg-foreground/5')}
          >
            {closed ? <Plus className="size-3.5" /> : <Minus className="size-3.5" />} Closed
          </button>
          <button
            type="button"
            onClick={() => setSmooth((v) => !v)}
            className={cn(chip, smooth ? 'bg-primary text-primary-foreground' : 'border border-border/60 bg-foreground/5')}
          >
            <Spline className="size-3.5" /> Smooth
          </button>
          <button
            type="button"
            onClick={() => setOutline((v) => !v)}
            className={cn(chip, outline ? 'bg-primary text-primary-foreground' : 'border border-border/60 bg-foreground/5')}
          >
            Outline
          </button>
          <button
            type="button"
            onClick={() => setGrid((v) => !v)}
            className={cn(chip, grid ? 'bg-primary text-primary-foreground' : 'border border-border/60 bg-foreground/5')}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setSnap((v) => !v)}
            className={cn(chip, snap ? 'bg-primary text-primary-foreground' : 'border border-border/60 bg-foreground/5')}
          >
            Snap
          </button>
          <button
            type="button"
            onClick={() => commit([])}
            className={cn(chip, 'border border-border/60 bg-foreground/5 text-destructive')}
          >
            <Trash2 className="size-3.5" /> Clear
          </button>
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto no-scrollbar px-1">
          {FREE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                commit(p.nodes.map((n) => ({ ...n })))
                setClosed(p.closed)
              }}
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-foreground/5 p-1.5 active:scale-95"
              aria-label={p.label}
            >
              <svg viewBox="0 0 100 100" className="size-full">
                <path
                  d={buildFreePath(p.nodes, p.closed, true)}
                  fill={p.closed ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={p.closed ? 0 : 8}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>

        {saved.length > 0 && (
          <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1">
            <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">Mine</span>
            {saved.map((s) => (
              <div key={s.id} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => useSaved(s)}
                  aria-label={s.name}
                  className="flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-foreground/5 p-1.5 active:scale-95"
                >
                  <svg viewBox="0 0 100 100" className="size-full">
                    <path
                      d={s.path}
                      fill={s.outline ? 'none' : s.color}
                      stroke={s.outline ? s.color : 'none'}
                      strokeWidth={s.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fillRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${s.name}`}
                  onClick={() => deleteSavedShape(s.id)}
                  className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-background text-muted-foreground shadow active:scale-90"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="-mx-1 flex gap-1.5 overflow-x-auto no-scrollbar px-1">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={cn(
                'size-7 shrink-0 rounded-full border transition active:scale-90',
                color === c ? 'border-primary ring-2 ring-primary' : 'border-border/60',
              )}
            />
          ))}
        </div>

        {(outline || !closed) && (
          <SliderField
            label="Stroke"
            value={strokeWidth}
            min={1}
            max={24}
            onChange={setStrokeWidth}
          />
        )}
      </div>

      <PaymentPage open={pay} onClose={() => setPay(false)} />
    </div>
  )
}
