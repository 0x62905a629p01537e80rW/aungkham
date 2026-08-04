import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  hitMark,
  markAlpha,
  markBounds,
  markParts,
  markStrokeWidth,
  moveMark,
  newMarkId,
  type Mark,
  type MarkStyle,
} from '@/lib/marks'

/** Nominal SVG resolution — the viewBox scales with the image box. */
const BASE = 1000

function viewport(aspect: number) {
  return aspect >= 1 ? { w: BASE * aspect, h: BASE } : { w: BASE, h: BASE / aspect }
}

interface MarksSvgProps {
  marks: Mark[]
  aspect: number
}

/** Renders every mark. Used by both the live canvas and the export surface. */
export function MarksSvg({ marks, aspect }: MarksSvgProps) {
  if (!marks.length) return null
  const { w, h } = viewport(aspect)
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      {marks.map((mark) => {
        const sw = markStrokeWidth(mark, w, h)
        return (
          <g key={mark.id} opacity={markAlpha(mark)}>
            {markParts(mark, w, h).map((part, i) => (
              <path
                key={i}
                d={part.d}
                fill={part.mode === 'fill' ? mark.color : 'none'}
                stroke={part.mode === 'stroke' ? mark.color : 'none'}
                strokeWidth={sw}
                strokeDasharray={part.dash}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

export type MarkTool = 'draw' | 'select' | 'erase'

interface MarkOverlayProps {
  marks: Mark[]
  aspect: number
  style: MarkStyle
  tool: MarkTool
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (marks: Mark[]) => void
  /** Called before a mutation so the editor can push an undo entry. */
  onCommit?: () => void
}

/**
 * Interactive surface for the Mark tool: drag to draw a shape, tap to select
 * and drag to move an existing mark, or tap with the eraser to remove one.
 */
export function MarkOverlay({
  marks,
  aspect,
  style,
  tool,
  selectedId,
  onSelect,
  onChange,
  onCommit,
}: MarkOverlayProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [draft, setDraft] = useState<Mark | null>(null)
  const drag = useRef<{ id: string; px: number; py: number; base: Mark } | null>(null)

  function point(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = hostRef.current?.getBoundingClientRect()
    if (!rect?.width || !rect.height) return null
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }
  }

  function topHit(x: number, y: number) {
    for (let i = marks.length - 1; i >= 0; i -= 1) {
      const m = marks[i]
      if (m && hitMark(m, x, y)) return m
    }
    return null
  }

  function down(e: ReactPointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    e.preventDefault()
    const p = point(e)
    if (!p) return
    e.currentTarget.setPointerCapture(e.pointerId)

    if (tool === 'erase') {
      const hit = topHit(p.x, p.y)
      if (hit) {
        onCommit?.()
        onChange(marks.filter((m) => m.id !== hit.id))
        onSelect(null)
      }
      return
    }

    const hit = topHit(p.x, p.y)
    if (tool === 'select' || (hit && hit.id === selectedId)) {
      if (!hit) {
        onSelect(null)
        return
      }
      onSelect(hit.id)
      onCommit?.()
      drag.current = { id: hit.id, px: p.x, py: p.y, base: hit }
      return
    }

    onSelect(null)
    setDraft({ id: newMarkId(), ...style, x1: p.x, y1: p.y, x2: p.x, y2: p.y })
  }

  function move(e: ReactPointerEvent<HTMLDivElement>) {
    const p = point(e)
    if (!p) return
    const d = drag.current
    if (d) {
      const next = moveMark(d.base, p.x - d.px, p.y - d.py)
      onChange(marks.map((m) => (m.id === d.id ? next : m)))
      return
    }
    if (draft) setDraft({ ...draft, x2: p.x, y2: p.y })
  }

  function up(e: ReactPointerEvent<HTMLDivElement>) {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (drag.current) {
      drag.current = null
      return
    }
    if (!draft) return
    const tiny = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) < 1.2
    setDraft(null)
    if (tiny) return
    onCommit?.()
    onChange([...marks, draft])
    onSelect(draft.id)
  }

  const selected = marks.find((m) => m.id === selectedId) ?? null
  const box = selected ? markBounds(selected, 1.5) : null

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 z-30 touch-none select-none"
      style={{ cursor: tool === 'erase' ? 'not-allowed' : 'crosshair' }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {draft && <MarksSvg marks={[draft]} aspect={aspect} />}

      {box && (
        <div
          className="pointer-events-none absolute rounded-[4px] border border-dashed border-primary/90"
          style={{
            left: `${box.left}%`,
            top: `${box.top}%`,
            width: `${box.right - box.left}%`,
            height: `${box.bottom - box.top}%`,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.35)',
          }}
        />
      )}
    </div>
  )
}
