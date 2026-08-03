import type { TextLayer } from '@/lib/text-layer'

export interface SizePreset {
  key: string
  label: string
  hint: string
  w: number
  h: number
}

export const SIZE_PRESETS: SizePreset[] = [
  { key: 'square', label: 'Square', hint: '1:1', w: 1080, h: 1080 },
  { key: 'portrait', label: 'Portrait', hint: '4:5', w: 1080, h: 1350 },
  { key: 'story', label: 'Story', hint: '9:16', w: 1080, h: 1920 },
  { key: 'landscape', label: 'Landscape', hint: '16:9', w: 1920, h: 1080 },
  { key: 'thumb', label: 'Thumbnail', hint: '16:9', w: 1280, h: 720 },
  { key: 'link', label: 'Link card', hint: '1.91:1', w: 1200, h: 630 },
  { key: 'wide', label: 'Cover', hint: '3:1', w: 1500, h: 500 },
]

/**
 * Re-flow a design into a different canvas shape.
 *
 * Positions are percentages of the box and font sizes are percentages of its
 * height, so a naive ratio change would stretch the composition. Everything is
 * therefore re-expressed relative to the canvas *width*, which is the axis a
 * viewer reads type against.
 */
export function resizeLayers(
  layers: TextLayer[],
  from: { w: number; h: number },
  to: { w: number; h: number },
): TextLayer[] {
  const r0 = from.w / Math.max(1, from.h)
  const r1 = to.w / Math.max(1, to.h)
  if (!r0 || !r1) return layers
  const k = r1 / r0
  if (Math.abs(k - 1) < 0.001) return layers

  return layers.map((l) => ({
    ...l,
    y: Math.max(2, Math.min(98, 50 + (l.y - 50) * k)),
    fontSize: Math.max(0.5, Math.min(120, l.fontSize * k)),
    shadowOffsetX: l.shadowOffsetX * k,
    shadowOffsetY: l.shadowOffsetY * k,
    shadowBlur: l.shadowBlur * k,
  }))
}

/** Cover-crop a background photo into a new pixel size. */
export async function resizeBackground(
  src: string,
  to: { w: number; h: number },
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.crossOrigin = 'anonymous'
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = to.w
  canvas.height = to.h
  const ctx = canvas.getContext('2d')
  if (!ctx) return src
  const scale = Math.max(to.w / img.naturalWidth, to.h / img.naturalHeight)
  const w = img.naturalWidth * scale
  const h = img.naturalHeight * scale
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, (to.w - w) / 2, (to.h - h) / 2, w, h)
  return canvas.toDataURL('image/png')
}
