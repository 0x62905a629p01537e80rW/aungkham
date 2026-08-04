/**
 * Vector markup objects ("Mark" tool).
 *
 * Unlike the freehand doodle layer — which is flattened into a PNG — marks stay
 * as data so they can be selected, moved, restyled and deleted after the fact.
 * Coordinates are percentages of the image box so they survive zooming and are
 * rendered identically on screen and in the export.
 */

export type MarkShape =
  | 'line'
  | 'wave'
  | 'dashed'
  | 'arrow'
  | 'rect'
  | 'rectFill'
  | 'ellipse'
  | 'ellipseFill'
  | 'highlight'

export interface Mark {
  id: string
  shape: MarkShape
  color: string
  /** Stroke weight, same scale as the drawing brush size. */
  size: number
  /** 0-100. */
  opacity: number
  /** Start / end points, in % of the image box. */
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface MarkStyle {
  shape: MarkShape
  color: string
  size: number
  opacity: number
}

export const DEFAULT_MARK: MarkStyle = {
  shape: 'arrow',
  color: '#ff2d55',
  size: 12,
  opacity: 100,
}

export function newMarkId() {
  return `mark-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Stroke width in px for a mark drawn inside a `w` x `h` px box. */
export function markStrokeWidth(mark: Mark, w: number, h: number) {
  return Math.max(1, (mark.size * Math.max(w, h)) / 900)
}

export interface MarkPart {
  d: string
  mode: 'stroke' | 'fill'
  dash?: string
}

/** Geometry for one mark, in px, inside a `w` x `h` box. */
export function markParts(mark: Mark, w: number, h: number): MarkPart[] {
  const ax = (mark.x1 / 100) * w
  const ay = (mark.y1 / 100) * h
  const bx = (mark.x2 / 100) * w
  const by = (mark.y2 / 100) * h
  const sw = markStrokeWidth(mark, w, h)
  const x = Math.min(ax, bx)
  const y = Math.min(ay, by)
  const rw = Math.abs(bx - ax)
  const rh = Math.abs(by - ay)

  switch (mark.shape) {
    case 'dashed':
      return [{ d: `M ${ax} ${ay} L ${bx} ${by}`, mode: 'stroke', dash: `${sw * 2.2} ${sw * 1.8}` }]
    case 'wave': {
      const dx = bx - ax
      const dy = by - ay
      const len = Math.hypot(dx, dy)
      if (len < 1) return []
      const nx = -dy / len
      const ny = dx / len
      const amp = Math.max(sw * 1.2, len * 0.045)
      const waves = Math.max(2, Math.round(len / (amp * 4)))
      const steps = Math.max(24, waves * 16)
      let d = ''
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps
        const off = Math.sin(t * waves * Math.PI * 2) * amp
        const px = ax + dx * t + nx * off
        const py = ay + dy * t + ny * off
        d += `${i === 0 ? 'M' : 'L'} ${px} ${py} `
      }
      return [{ d, mode: 'stroke' }]
    }
    case 'arrow': {
      const ang = Math.atan2(by - ay, bx - ax)
      const head = Math.max(sw * 3, Math.hypot(bx - ax, by - ay) * 0.22)
      return [
        {
          d: `M ${ax} ${ay} L ${bx - Math.cos(ang) * head * 0.5} ${by - Math.sin(ang) * head * 0.5}`,
          mode: 'stroke',
        },
        {
          d: `M ${bx} ${by} L ${bx - Math.cos(ang - 0.42) * head} ${by - Math.sin(ang - 0.42) * head} L ${
            bx - Math.cos(ang + 0.42) * head
          } ${by - Math.sin(ang + 0.42) * head} Z`,
          mode: 'fill',
        },
      ]
    }
    case 'rect':
    case 'rectFill':
    case 'highlight':
      return [
        {
          d: `M ${x} ${y} H ${x + rw} V ${y + rh} H ${x} Z`,
          mode: mark.shape === 'rect' ? 'stroke' : 'fill',
        },
      ]
    case 'ellipse':
    case 'ellipseFill': {
      const cx = x + rw / 2
      const cy = y + rh / 2
      const rx = Math.max(0.5, rw / 2)
      const ry = Math.max(0.5, rh / 2)
      return [
        {
          d: `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`,
          mode: mark.shape === 'ellipse' ? 'stroke' : 'fill',
        },
      ]
    }
    default:
      return [{ d: `M ${ax} ${ay} L ${bx} ${by}`, mode: 'stroke' }]
  }
}

/** Effective opacity — highlights are translucent like a marker pen. */
export function markAlpha(mark: Mark) {
  const a = Math.max(0.03, mark.opacity / 100)
  return mark.shape === 'highlight' ? Math.min(0.45, a * 0.45) : a
}

/** Bounding box of a mark in %, padded so thin strokes stay easy to tap. */
export function markBounds(mark: Mark, pad = 2) {
  return {
    left: Math.min(mark.x1, mark.x2) - pad,
    top: Math.min(mark.y1, mark.y2) - pad,
    right: Math.max(mark.x1, mark.x2) + pad,
    bottom: Math.max(mark.y1, mark.y2) + pad,
  }
}

/** True when a point (in %) is close enough to a mark to select/erase it. */
export function hitMark(mark: Mark, px: number, py: number, pad = 3) {
  const b = markBounds(mark, pad)
  if (px < b.left || px > b.right || py < b.top || py > b.bottom) return false
  const line =
    mark.shape === 'line' ||
    mark.shape === 'dashed' ||
    mark.shape === 'wave' ||
    mark.shape === 'arrow'
  if (!line) return true
  // Distance from the point to the segment, in %.
  const dx = mark.x2 - mark.x1
  const dy = mark.y2 - mark.y1
  const len2 = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((px - mark.x1) * dx + (py - mark.y1) * dy) / len2))
  const cx = mark.x1 + dx * t
  const cy = mark.y1 + dy * t
  return Math.hypot(px - cx, py - cy) <= pad + 2
}

export function moveMark(mark: Mark, dx: number, dy: number): Mark {
  return { ...mark, x1: mark.x1 + dx, y1: mark.y1 + dy, x2: mark.x2 + dx, y2: mark.y2 + dy }
}
