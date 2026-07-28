import { loadImage } from './image-ops'

export interface Adjustments {
  // Tone
  exposure: number
  brightness: number
  contrast: number
  lightness: number
  highlights: number
  shadows: number
  lightRange: number
  darkRange: number
  curve: number
  // Colors
  saturation: number
  vibrance: number
  hue: number
  posterize: number
  warmth: number
  tint: number
  fade: number
  // Details
  sharpness: number
  clarity: number
  grain: number
  denoise: number
  vignette: number
  dispersion: number
  noise: number
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  lightness: 0,
  highlights: 0,
  shadows: 0,
  lightRange: 0,
  darkRange: 0,
  curve: 0,
  saturation: 0,
  vibrance: 0,
  hue: 0,
  posterize: 0,
  warmth: 0,
  tint: 0,
  fade: 0,
  sharpness: 0,
  clarity: 0,
  grain: 0,
  denoise: 0,
  vignette: 0,
  dispersion: 0,
  noise: 0,
}

export type AdjustKey = keyof Adjustments

export const ADJUST_RANGES: Record<AdjustKey, { min: number; max: number; step: number }> = {
  exposure: { min: -100, max: 100, step: 1 },
  brightness: { min: -100, max: 100, step: 1 },
  contrast: { min: -100, max: 100, step: 1 },
  lightness: { min: -100, max: 100, step: 1 },
  highlights: { min: -100, max: 100, step: 1 },
  shadows: { min: -100, max: 100, step: 1 },
  lightRange: { min: -100, max: 100, step: 1 },
  darkRange: { min: -100, max: 100, step: 1 },
  curve: { min: -100, max: 100, step: 1 },
  saturation: { min: -100, max: 100, step: 1 },
  vibrance: { min: -100, max: 100, step: 1 },
  hue: { min: -180, max: 180, step: 1 },
  posterize: { min: 0, max: 100, step: 1 },
  warmth: { min: -100, max: 100, step: 1 },
  tint: { min: -100, max: 100, step: 1 },
  fade: { min: 0, max: 100, step: 1 },
  sharpness: { min: 0, max: 100, step: 1 },
  clarity: { min: -100, max: 100, step: 1 },
  grain: { min: 0, max: 100, step: 1 },
  denoise: { min: 0, max: 100, step: 1 },
  vignette: { min: -100, max: 100, step: 1 },
  dispersion: { min: 0, max: 100, step: 1 },
  noise: { min: 0, max: 100, step: 1 },
}

export function isDefaultAdjustments(a: Adjustments) {
  return (Object.keys(DEFAULT_ADJUSTMENTS) as AdjustKey[]).every(
    (k) => a[k] === DEFAULT_ADJUSTMENTS[k],
  )
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w))
  canvas.height = Math.max(1, Math.round(h))
  return canvas
}

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v)

function blurredData(source: CanvasImageSource, w: number, h: number, radius: number) {
  const c = makeCanvas(w, h)
  const ctx = c.getContext('2d')!
  ctx.filter = `blur(${radius}px)`
  ctx.drawImage(source, 0, 0, w, h)
  ctx.filter = 'none'
  return ctx.getImageData(0, 0, w, h).data
}

/** Smooth mask 0..1 */
function smooth(t: number) {
  const x = t < 0 ? 0 : t > 1 ? 1 : t
  return x * x * (3 - 2 * x)
}

/**
 * Renders the source image with the given adjustments onto a canvas
 * of the requested size and returns it.
 */
export function renderAdjusted(
  img: HTMLImageElement | HTMLCanvasElement,
  a: Adjustments,
  maxSize?: number,
): HTMLCanvasElement {
  const srcW = 'naturalWidth' in img ? img.naturalWidth : img.width
  const srcH = 'naturalHeight' in img ? img.naturalHeight : img.height
  let w = srcW
  let h = srcH
  if (maxSize && Math.max(w, h) > maxSize) {
    const k = maxSize / Math.max(w, h)
    w = Math.round(w * k)
    h = Math.round(h * k)
  }

  const canvas = makeCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)

  const image = ctx.getImageData(0, 0, w, h)
  const d = image.data

  const scale = Math.max(w, h) / 1000

  // --- de-noise (blend toward a small blur) ---
  if (a.denoise > 0) {
    const nb = blurredData(canvas, w, h, Math.max(0.6, 1.6 * scale))
    const m = a.denoise / 100
    for (let i = 0; i < d.length; i += 4) {
      d[i] += (nb[i] - d[i]) * m
      d[i + 1] += (nb[i + 1] - d[i + 1]) * m
      d[i + 2] += (nb[i + 2] - d[i + 2]) * m
    }
    ctx.putImageData(image, 0, 0)
  }

  // --- sharpness + clarity (unsharp masking) ---
  if (a.sharpness > 0 || a.clarity !== 0) {
    if (a.sharpness > 0) {
      const sb = blurredData(canvas, w, h, Math.max(0.7, 1.2 * scale))
      const k = (a.sharpness / 100) * 1.6
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp255(d[i] + (d[i] - sb[i]) * k)
        d[i + 1] = clamp255(d[i + 1] + (d[i + 1] - sb[i + 1]) * k)
        d[i + 2] = clamp255(d[i + 2] + (d[i + 2] - sb[i + 2]) * k)
      }
      ctx.putImageData(image, 0, 0)
    }
    if (a.clarity !== 0) {
      const cb = blurredData(canvas, w, h, Math.max(3, 12 * scale))
      const k = (a.clarity / 100) * 0.8
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp255(d[i] + (d[i] - cb[i]) * k)
        d[i + 1] = clamp255(d[i + 1] + (d[i + 1] - cb[i + 1]) * k)
        d[i + 2] = clamp255(d[i + 2] + (d[i + 2] - cb[i + 2]) * k)
      }
    }
  }

  // --- per-pixel colour pipeline ---
  const expo = Math.pow(2, a.exposure / 100)
  const brightAdd = (a.brightness / 100) * 64
  const contrastK = 1 + a.contrast / 100
  const gamma = a.lightness === 0 ? 1 : 1 - a.lightness / 250
  const hiK = a.highlights / 100
  const shK = a.shadows / 100
  const lrK = a.lightRange / 100
  const drK = a.darkRange / 100
  const curveK = a.curve / 100
  const satK = 1 + a.saturation / 100
  const vibK = a.vibrance / 100
  const hueRad = (a.hue * Math.PI) / 180
  const hueCos = Math.cos(hueRad)
  const hueSin = Math.sin(hueRad)
  const levels = a.posterize > 0 ? Math.max(2, Math.round(32 - (a.posterize / 100) * 30)) : 0
  const warm = (a.warmth / 100) * 40
  const tintV = (a.tint / 100) * 40
  const fadeK = a.fade / 100

  const needsPixel =
    a.exposure || a.brightness || a.contrast || a.lightness || a.highlights || a.shadows ||
    a.lightRange || a.darkRange || a.curve || a.saturation || a.vibrance || a.hue ||
    a.posterize || a.warmth || a.tint || a.fade

  if (needsPixel) {
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]
      let g = d[i + 1]
      let b = d[i + 2]

      if (expo !== 1) {
        r *= expo
        g *= expo
        b *= expo
      }
      if (brightAdd) {
        r += brightAdd
        g += brightAdd
        b += brightAdd
      }
      if (contrastK !== 1) {
        r = (r - 128) * contrastK + 128
        g = (g - 128) * contrastK + 128
        b = (b - 128) * contrastK + 128
      }
      if (gamma !== 1) {
        r = 255 * Math.pow(Math.max(0, r) / 255, gamma)
        g = 255 * Math.pow(Math.max(0, g) / 255, gamma)
        b = 255 * Math.pow(Math.max(0, b) / 255, gamma)
      }

      let lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

      if (hiK || shK || lrK || drK) {
        const hiMask = smooth((lum - 0.5) / 0.5)
        const shMask = smooth((0.5 - lum) / 0.5)
        const lrMask = smooth((lum - 0.75) / 0.25)
        const drMask = smooth((0.25 - lum) / 0.25)
        const add = (hiK * hiMask + shK * shMask + lrK * lrMask + drK * drMask) * 70
        r += add
        g += add
        b += add
      }

      if (curveK) {
        const f = (v: number) => {
          const x = Math.max(0, Math.min(1, v / 255))
          const s = x + curveK * (x * (1 - x) * (x - 0.5) * -4)
          return s * 255
        }
        r = f(r)
        g = f(g)
        b = f(b)
      }

      if (warm) {
        r += warm
        b -= warm
      }
      if (tintV) {
        g -= tintV
        r += tintV * 0.5
        b += tintV * 0.5
      }

      lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

      if (satK !== 1) {
        r = lum + (r - lum) * satK
        g = lum + (g - lum) * satK
        b = lum + (b - lum) * satK
      }

      if (vibK) {
        const mx = Math.max(r, g, b)
        const mn = Math.min(r, g, b)
        const sat = mx <= 0 ? 0 : (mx - mn) / mx
        const k = 1 + vibK * (1 - sat)
        r = lum + (r - lum) * k
        g = lum + (g - lum) * k
        b = lum + (b - lum) * k
      }

      if (hueRad) {
        const m0 = 0.213 + hueCos * 0.787 - hueSin * 0.213
        const m1 = 0.715 - hueCos * 0.715 - hueSin * 0.715
        const m2 = 0.072 - hueCos * 0.072 + hueSin * 0.928
        const m3 = 0.213 - hueCos * 0.213 + hueSin * 0.143
        const m4 = 0.715 + hueCos * 0.285 + hueSin * 0.14
        const m5 = 0.072 - hueCos * 0.072 - hueSin * 0.283
        const m6 = 0.213 - hueCos * 0.213 - hueSin * 0.787
        const m7 = 0.715 - hueCos * 0.715 + hueSin * 0.715
        const m8 = 0.072 + hueCos * 0.928 + hueSin * 0.072
        const nr = r * m0 + g * m1 + b * m2
        const ng = r * m3 + g * m4 + b * m5
        const nb2 = r * m6 + g * m7 + b * m8
        r = nr
        g = ng
        b = nb2
      }

      if (fadeK) {
        const lift = 42 * fadeK
        r = r * (1 - fadeK * 0.18) + lift
        g = g * (1 - fadeK * 0.18) + lift
        b = b * (1 - fadeK * 0.18) + lift
      }

      if (levels) {
        const q = 255 / (levels - 1)
        r = Math.round(r / q) * q
        g = Math.round(g / q) * q
        b = Math.round(b / q) * q
      }

      d[i] = clamp255(r)
      d[i + 1] = clamp255(g)
      d[i + 2] = clamp255(b)
    }
  }

  // --- vignette / grain / noise ---
  if (a.vignette !== 0 || a.grain > 0 || a.noise > 0) {
    const cx = w / 2
    const cy = h / 2
    const maxD = Math.sqrt(cx * cx + cy * cy)
    const vig = a.vignette / 100
    const grainK = (a.grain / 100) * 48
    const noiseK = (a.noise / 100) * 60

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        if (vig) {
          const dx = x - cx
          const dy = y - cy
          const dist = Math.sqrt(dx * dx + dy * dy) / maxD
          const f = 1 - vig * smooth((dist - 0.35) / 0.65)
          d[i] = clamp255(d[i] * f)
          d[i + 1] = clamp255(d[i + 1] * f)
          d[i + 2] = clamp255(d[i + 2] * f)
        }
        if (grainK) {
          const n = (Math.random() - 0.5) * grainK
          d[i] = clamp255(d[i] + n)
          d[i + 1] = clamp255(d[i + 1] + n)
          d[i + 2] = clamp255(d[i + 2] + n)
        }
        if (noiseK) {
          d[i] = clamp255(d[i] + (Math.random() - 0.5) * noiseK)
          d[i + 1] = clamp255(d[i + 1] + (Math.random() - 0.5) * noiseK)
          d[i + 2] = clamp255(d[i + 2] + (Math.random() - 0.5) * noiseK)
        }
      }
    }
  }

  ctx.putImageData(image, 0, 0)

  // --- dispersion (chromatic aberration): shift R and B channels ---
  if (a.dispersion > 0) {
    const shift = (a.dispersion / 100) * Math.max(1, 8 * scale)
    const base = ctx.getImageData(0, 0, w, h)
    const out = ctx.createImageData(w, h)
    const bd = base.data
    const od = out.data
    const off = Math.round(shift)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        const rx = Math.min(w - 1, x + off)
        const bx = Math.max(0, x - off)
        od[i] = bd[(y * w + rx) * 4]
        od[i + 1] = bd[i + 1]
        od[i + 2] = bd[(y * w + bx) * 4 + 2]
        od[i + 3] = bd[i + 3]
      }
    }
    ctx.putImageData(out, 0, 0)
  }

  return canvas
}

export async function applyAdjustments(src: string, a: Adjustments) {
  const img = await loadImage(src)
  return renderAdjusted(img, a).toDataURL('image/png')
}
