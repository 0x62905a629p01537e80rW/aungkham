/**
 * On-device object removal (content-aware fill).
 *
 * Two passes:
 *  1. Jump-flooding to find, for every masked pixel, the nearest known pixel —
 *     this reconstructs coarse structure/color instantly.
 *  2. Laplacian diffusion (Poisson-like relaxation) that keeps known pixels
 *     fixed and smooths the hole so the patch blends with its surroundings.
 */

export type InpaintQuality = 'classic' | 'seamless'

/**
 * @param mask Uint8Array (w*h), 255 = remove this pixel.
 */
export function inpaint(
  image: ImageData,
  mask: Uint8Array,
  quality: InpaintQuality = 'seamless',
): ImageData {
  const { width: w, height: h, data } = image
  const n = w * h

  // --- pass 1: nearest known pixel via jump flooding ------------------------
  const nearest = new Int32Array(n).fill(-1)
  let any = false
  for (let p = 0; p < n; p += 1) {
    if (mask[p]) any = true
    else nearest[p] = p
  }
  if (!any) return image

  const read = new Int32Array(nearest)
  let step = 1
  while (step < Math.max(w, h)) step <<= 1
  for (; step >= 1; step >>= 1) {
    read.set(nearest)
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const p = y * w + x
        if (read[p] !== -1 && !mask[p]) continue
        let best = nearest[p]
        let bestD = best === -1 ? Infinity : dist2(best, p, w)
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (!dx && !dy) continue
            const nx = x + dx * step
            const ny = y + dy * step
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
            const q = read[ny * w + nx]
            if (q === -1) continue
            const d = dist2(q, p, w)
            if (d < bestD) {
              bestD = d
              best = q
            }
          }
        }
        nearest[p] = best
      }
    }
  }

  // Seed the hole with a blurred blend of the nearest known colors.
  const r = new Float32Array(n)
  const g = new Float32Array(n)
  const b = new Float32Array(n)
  for (let p = 0; p < n; p += 1) {
    const src = mask[p] ? (nearest[p] === -1 ? p : nearest[p]) : p
    const i = src * 4
    r[p] = data[i]
    g[p] = data[i + 1]
    b[p] = data[i + 2]
  }

  // --- pass 2: diffusion ----------------------------------------------------
  const iterations = quality === 'seamless' ? 160 : 30
  const tr = new Float32Array(r)
  const tg = new Float32Array(g)
  const tb = new Float32Array(b)
  for (let it = 0; it < iterations; it += 1) {
    for (let y = 1; y < h - 1; y += 1) {
      const row = y * w
      for (let x = 1; x < w - 1; x += 1) {
        const p = row + x
        if (!mask[p]) continue
        tr[p] = (r[p - 1] + r[p + 1] + r[p - w] + r[p + w]) * 0.25
        tg[p] = (g[p - 1] + g[p + 1] + g[p - w] + g[p + w]) * 0.25
        tb[p] = (b[p - 1] + b[p + 1] + b[p - w] + b[p + w]) * 0.25
      }
    }
    for (let p = 0; p < n; p += 1) {
      if (!mask[p]) continue
      r[p] = tr[p]
      g[p] = tg[p]
      b[p] = tb[p]
    }
  }

  for (let p = 0; p < n; p += 1) {
    if (!mask[p]) continue
    const i = p * 4
    data[i] = clamp(r[p])
    data[i + 1] = clamp(g[p])
    data[i + 2] = clamp(b[p])
    data[i + 3] = 255
  }
  return image
}

function clamp(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v)
}

function dist2(a: number, p: number, w: number) {
  const ax = a % w
  const ay = (a - ax) / w
  const px = p % w
  const py = (p - px) / w
  const dx = ax - px
  const dy = ay - py
  return dx * dx + dy * dy
}

/**
 * "Auto" mode: grows the brushed selection to connected pixels of a similar
 * color so a whole object/watermark is caught with a light stroke.
 */
export function growMaskByColor(
  image: ImageData,
  mask: Uint8Array,
  tolerance = 26,
): Uint8Array {
  const { width: w, height: h, data } = image
  const n = w * h
  const out = new Uint8Array(mask)
  const stack: number[] = []
  let sr = 0
  let sg = 0
  let sb = 0
  let count = 0
  for (let p = 0; p < n; p += 1) {
    if (!mask[p]) continue
    const i = p * 4
    sr += data[i]
    sg += data[i + 1]
    sb += data[i + 2]
    count += 1
    stack.push(p)
  }
  if (!count) return out
  sr /= count
  sg /= count
  sb /= count
  const limit = tolerance * tolerance * 3

  while (stack.length) {
    const p = stack.pop()!
    const x = p % w
    const y = (p - x) / w
    const push = (q: number) => {
      if (out[q]) return
      const i = q * 4
      const dr = data[i] - sr
      const dg = data[i + 1] - sg
      const db = data[i + 2] - sb
      if (dr * dr + dg * dg + db * db > limit) return
      out[q] = 255
      stack.push(q)
    }
    if (x > 0) push(p - 1)
    if (x < w - 1) push(p + 1)
    if (y > 0) push(p - w)
    if (y < h - 1) push(p + w)
  }
  return dilate(out, w, h, 2)
}

/** Expand the mask a little so anti-aliased edges are covered too. */
export function dilate(mask: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  let src = mask
  for (let step = 0; step < radius; step += 1) {
    const out = new Uint8Array(src)
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const p = y * w + x
        if (src[p]) continue
        if (
          (x > 0 && src[p - 1]) ||
          (x < w - 1 && src[p + 1]) ||
          (y > 0 && src[p - w]) ||
          (y < h - 1 && src[p + w])
        ) {
          out[p] = 255
        }
      }
    }
    src = out
  }
  return src
}
