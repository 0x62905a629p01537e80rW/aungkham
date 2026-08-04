/**
 * Free-form shape geometry helpers.
 *
 * Nodes live in a 0-100 design space. Paths are emitted in the same
 * `0 0 100 100` viewBox used by the rest of the shape library so a hand-drawn
 * shape can become a normal graphic layer on the main canvas.
 */

export interface ShapeNode {
  x: number
  y: number
  /** corner nodes break the smoothing on both sides */
  corner?: boolean
}

const n2 = (v: number) => Math.round(v * 100) / 100

/** Catmull-Rom -> cubic bezier path, honouring per-node corners. */
export function buildFreePath(nodes: ShapeNode[], closed: boolean, smooth: boolean): string {
  if (nodes.length < 2) return ''
  const pts = nodes
  const at = (i: number) => {
    const len = pts.length
    if (closed) return pts[(i + len) % len]
    return pts[Math.max(0, Math.min(len - 1, i))]
  }

  let d = `M${n2(pts[0].x)},${n2(pts[0].y)}`
  const last = closed ? pts.length : pts.length - 1
  for (let i = 0; i < last; i += 1) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const hard = !smooth || p1.corner || p2.corner
    if (hard) {
      d += `L${n2(p2.x)},${n2(p2.y)}`
      continue
    }
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += `C${n2(c1x)},${n2(c1y)} ${n2(c2x)},${n2(c2y)} ${n2(p2.x)},${n2(p2.y)}`
  }
  if (closed) d += 'Z'
  return d
}

/** Ramer-Douglas-Peucker simplification for freehand strokes. */
export function simplify(points: ShapeNode[], tolerance = 1.1): ShapeNode[] {
  if (points.length < 3) return points
  const sqTol = tolerance * tolerance
  const sqSegDist = (p: ShapeNode, a: ShapeNode, b: ShapeNode) => {
    let x = a.x
    let y = a.y
    let dx = b.x - x
    let dy = b.y - y
    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy)
      if (t > 1) {
        x = b.x
        y = b.y
      } else if (t > 0) {
        x += dx * t
        y += dy * t
      }
    }
    dx = p.x - x
    dy = p.y - y
    return dx * dx + dy * dy
  }
  const keep = new Set<number>([0, points.length - 1])
  const step = (first: number, lastIdx: number) => {
    let maxDist = sqTol
    let index = -1
    for (let i = first + 1; i < lastIdx; i += 1) {
      const dist = sqSegDist(points[i], points[first], points[lastIdx])
      if (dist > maxDist) {
        index = i
        maxDist = dist
      }
    }
    if (index === -1) return
    keep.add(index)
    step(first, index)
    step(index, lastIdx)
  }
  step(0, points.length - 1)
  return points.filter((_, i) => keep.has(i))
}

/** Fit nodes into the 0-100 viewBox, preserving aspect ratio. */
export function normalizeNodes(nodes: ShapeNode[], pad = 4): ShapeNode[] {
  if (nodes.length === 0) return nodes
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const w = Math.max(0.001, maxX - minX)
  const h = Math.max(0.001, maxY - minY)
  const span = 100 - pad * 2
  const scale = Math.min(span / w, span / h)
  const offX = (100 - w * scale) / 2
  const offY = (100 - h * scale) / 2
  return nodes.map((n) => ({
    ...n,
    x: (n.x - minX) * scale + offX,
    y: (n.y - minY) * scale + offY,
  }))
}

/** Starting templates the user can bend into shape. */
export const FREE_PRESETS: { id: string; label: string; closed: boolean; nodes: ShapeNode[] }[] = [
  {
    id: 'tri',
    label: 'Triangle',
    closed: true,
    nodes: [
      { x: 50, y: 12, corner: true },
      { x: 90, y: 86, corner: true },
      { x: 10, y: 86, corner: true },
    ],
  },
  {
    id: 'rect',
    label: 'Rectangle',
    closed: true,
    nodes: [
      { x: 14, y: 22, corner: true },
      { x: 86, y: 22, corner: true },
      { x: 86, y: 78, corner: true },
      { x: 14, y: 78, corner: true },
    ],
  },
  {
    id: 'blob',
    label: 'Blob',
    closed: true,
    nodes: [
      { x: 50, y: 8 },
      { x: 86, y: 30 },
      { x: 80, y: 74 },
      { x: 42, y: 92 },
      { x: 12, y: 60 },
      { x: 18, y: 24 },
    ],
  },
  {
    id: 'arc',
    label: 'Arc',
    closed: false,
    nodes: [
      { x: 10, y: 78 },
      { x: 32, y: 26 },
      { x: 68, y: 26 },
      { x: 90, y: 78 },
    ],
  },
  {
    id: 'star',
    label: 'Star',
    closed: true,
    nodes: Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? 44 : 18
      const a = ((-90 + i * 36) * Math.PI) / 180
      return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a), corner: true }
    }),
  },
]
