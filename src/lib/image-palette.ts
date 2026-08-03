/**
 * Dominant-colour extraction for the current background photo, so the colour
 * picker can offer a palette that actually matches the artwork.
 */
let palette: string[] = []
let sourceKey = ''
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function getPhotoPalette() {
  return palette
}

export function subscribePhotoPalette(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function hex(r: number, g: number, b: number) {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

/** Extract up to `count` dominant colours by coarse RGB bucketing. */
export async function extractPhotoPalette(src: string | null, count = 8) {
  if (!src) {
    if (palette.length) {
      palette = []
      sourceKey = ''
      notify()
    }
    return
  }
  if (src === sourceKey) return
  sourceKey = src

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.src = src
    await img.decode()

    const w = 64
    const h = Math.max(1, Math.round((img.naturalHeight / Math.max(1, img.naturalWidth)) * w))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)

    const buckets = new Map<string, { r: number; g: number; b: number; n: number }>()
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const key = `${r >> 5}-${g >> 5}-${b >> 5}`
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.r += r
        bucket.g += g
        bucket.b += b
        bucket.n += 1
      } else {
        buckets.set(key, { r, g, b, n: 1 })
      }
    }

    const next = [...buckets.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, count)
      .map((c) => hex(c.r / c.n, c.g / c.n, c.b / c.n))

    if (sourceKey !== src) return
    palette = next
    notify()
  } catch {
    /* cross-origin or decode failure — palette simply stays empty */
  }
}
