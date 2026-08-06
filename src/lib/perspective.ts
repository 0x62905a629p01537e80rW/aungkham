/**
 * Free-transform (4 corner) perspective warp.
 *
 * A layer stores four corner offsets expressed as fractions of its own
 * bounding box. The identity warp is all zeros, which renders untouched.
 * The offsets are turned into a projective homography and emitted as a CSS
 * `matrix3d(...)`, which is exactly how photo apps bend text into a plane.
 */
export type WarpCorners = [number, number][] // [[dx,dy] x4] TL, TR, BR, BL

export const IDENTITY_WARP: WarpCorners = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
]

export function isIdentityWarp(w?: WarpCorners | null): boolean {
  if (!w || w.length !== 4) return true
  return w.every(([x, y]) => Math.abs(x) < 0.0005 && Math.abs(y) < 0.0005)
}

/** Unit-square corner positions (0..1) after applying the offsets. */
export function warpPoints(w: WarpCorners): [number, number][] {
  const base: [number, number][] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]
  return base.map(([x, y], i) => [x + (w[i]?.[0] ?? 0), y + (w[i]?.[1] ?? 0)])
}

/** Solve A·x = b with plain Gaussian elimination (n is tiny, 8x8). */
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length
  const m = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c += 1) {
    let piv = c
    for (let r = c + 1; r < n; r += 1) if (Math.abs(m[r][c]) > Math.abs(m[piv][c])) piv = r
    if (Math.abs(m[piv][c]) < 1e-9) return null
    ;[m[c], m[piv]] = [m[piv], m[c]]
    for (let r = 0; r < n; r += 1) {
      if (r === c) continue
      const f = m[r][c] / m[c][c]
      for (let k = c; k <= n; k += 1) m[r][k] -= f * m[c][k]
    }
  }
  return m.map((row, i) => row[n] / row[i][i] * 1)
}

/**
 * matrix3d that maps the element's own box onto the warped quad.
 * Use with `transform-origin: 0 0`.
 */
export function warpMatrix(w: WarpCorners, width: number, height: number): string | null {
  if (!width || !height || isIdentityWarp(w)) return null
  const src: [number, number][] = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ]
  const dst = warpPoints(w).map(([x, y]) => [x * width, y * height] as [number, number])

  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i += 1) {
    const [x, y] = src[i]
    const [u, v] = dst[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(v)
  }
  const h = solve(A, b)
  if (!h) return null
  const [a, bb, c, d, e, f, g, i] = h
  // column-major 4x4
  const m = [a, d, 0, g, bb, e, 0, i, 0, 0, 1, 0, c, f, 0, 1]
  if (m.some((n) => !Number.isFinite(n))) return null
  return `matrix3d(${m.map((n) => Number(n.toFixed(6))).join(', ')})`
}

/** Preset quads used by the perspective panel (offsets, TL TR BR BL). */
export const WARP_PRESETS: { key: string; corners: WarpCorners }[] = [
  // leaning left: left edge taller
  { key: 'left', corners: [[0, -0.12], [0, 0.1], [0, -0.1], [0, 0.12]] },
  // leaning right: right edge taller
  { key: 'right', corners: [[0, 0.12], [0, -0.1], [0, 0.1], [0, -0.12]] },
  // receding to the top
  { key: 'top', corners: [[0.16, 0], [-0.16, 0], [0, 0], [0, 0]] },
  // receding to the bottom
  { key: 'bottom', corners: [[0, 0], [0, 0], [-0.16, 0], [0.16, 0]] },
]
