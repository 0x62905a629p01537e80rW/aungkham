/** On-device background removal helpers (no network needed). */

function idx(x: number, y: number, w: number) {
  return (y * w + x) * 4
}

function colorDistance(
  d: Uint8ClampedArray,
  a: number,
  r: number,
  g: number,
  b: number,
): number {
  const dr = d[a] - r
  const dg = d[a + 1] - g
  const db = d[a + 2] - b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/** Average color of the outer border ring — a good guess for the background. */
export function borderColor(data: ImageData): [number, number, number] {
  const { width: w, height: h, data: d } = data
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  const sample = (x: number, y: number) => {
    const i = idx(x, y, w)
    if (d[i + 3] < 8) return
    r += d[i]
    g += d[i + 1]
    b += d[i + 2]
    n += 1
  }
  for (let x = 0; x < w; x += 1) {
    sample(x, 0)
    sample(x, h - 1)
  }
  for (let y = 0; y < h; y += 1) {
    sample(0, y)
    sample(w - 1, y)
  }
  if (!n) return [255, 255, 255]
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
}

/**
 * Flood fill from a seed point, clearing every connected pixel whose color is
 * within `tolerance` (0-100) of the seed color. Feathers the boundary slightly.
 */
export function magicErase(
  data: ImageData,
  seedX: number,
  seedY: number,
  tolerance: number,
): ImageData {
  const { width: w, height: h, data: d } = data
  const sx = Math.max(0, Math.min(w - 1, Math.round(seedX)))
  const sy = Math.max(0, Math.min(h - 1, Math.round(seedY)))
  const s = idx(sx, sy, w)
  const r0 = d[s]
  const g0 = d[s + 1]
  const b0 = d[s + 2]
  const limit = (tolerance / 100) * 442

  const seen = new Uint8Array(w * h)
  const stack: number[] = [sy * w + sx]
  seen[sy * w + sx] = 1

  while (stack.length) {
    const p = stack.pop()!
    const x = p % w
    const y = (p - x) / w
    const i = p * 4
    if (d[i + 3] === 0) continue
    if (colorDistance(d, i, r0, g0, b0) > limit) continue
    d[i + 3] = 0
    if (x > 0 && !seen[p - 1]) {
      seen[p - 1] = 1
      stack.push(p - 1)
    }
    if (x < w - 1 && !seen[p + 1]) {
      seen[p + 1] = 1
      stack.push(p + 1)
    }
    if (y > 0 && !seen[p - w]) {
      seen[p - w] = 1
      stack.push(p - w)
    }
    if (y < h - 1 && !seen[p + w]) {
      seen[p + w] = 1
      stack.push(p + w)
    }
  }

  softenEdges(data)
  return data
}

/**
 * Remove the background color everywhere it appears (not only connected areas)
 * using the border color as the reference — good for logos and flat backdrops.
 */
export function autoRemoveColor(data: ImageData, tolerance: number): ImageData {
  const [r0, g0, b0] = borderColor(data)
  const d = data.data
  const limit = (tolerance / 100) * 442
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    const dist = colorDistance(d, i, r0, g0, b0)
    if (dist <= limit) d[i + 3] = 0
    else if (dist <= limit * 1.35) d[i + 3] = Math.round(d[i + 3] * ((dist - limit) / (limit * 0.35)))
  }
  softenEdges(data)
  return data
}

/**
 * Flood fill inward from every border pixel — keeps the subject even when it
 * shares colors with the background.
 */
export function autoRemoveEdges(data: ImageData, tolerance: number): ImageData {
  const { width: w, height: h, data: d } = data
  const [r0, g0, b0] = borderColor(data)
  const limit = (tolerance / 100) * 442
  const seen = new Uint8Array(w * h)
  const stack: number[] = []

  const push = (x: number, y: number) => {
    const p = y * w + x
    if (!seen[p]) {
      seen[p] = 1
      stack.push(p)
    }
  }
  for (let x = 0; x < w; x += 1) {
    push(x, 0)
    push(x, h - 1)
  }
  for (let y = 0; y < h; y += 1) {
    push(0, y)
    push(w - 1, y)
  }

  while (stack.length) {
    const p = stack.pop()!
    const i = p * 4
    if (d[i + 3] === 0) continue
    if (colorDistance(d, i, r0, g0, b0) > limit) continue
    d[i + 3] = 0
    const x = p % w
    const y = (p - x) / w
    if (x > 0) push(x - 1, y)
    if (x < w - 1) push(x + 1, y)
    if (y > 0) push(x, y - 1)
    if (y < h - 1) push(x, y + 1)
  }

  softenEdges(data)
  return data
}

/** Soften hard alpha edges so cut-outs don't look jagged. */
export function softenEdges(data: ImageData) {
  const { width: w, height: h, data: d } = data
  const alpha = new Uint8ClampedArray(w * h)
  for (let p = 0; p < w * h; p += 1) alpha[p] = d[p * 4 + 3]
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const p = y * w + x
      const a = alpha[p]
      if (a === 0) continue
      const min = Math.min(
        alpha[p - 1],
        alpha[p + 1],
        alpha[p - w],
        alpha[p + w],
      )
      if (min === 0 && a === 255) d[p * 4 + 3] = 170
    }
  }
}
