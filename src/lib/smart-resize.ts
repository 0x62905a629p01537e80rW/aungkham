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
 * The artwork is fitted (never cropped) into the new canvas, so every layer is
 * mapped into that same "content box": positions move with the box and type is
 * scaled by the box factor, which keeps the composition readable and inside the
 * frame in every ratio.
 */
export function fitBox(from: { w: number; h: number }, to: { w: number; h: number }) {
  const s = Math.min(to.w / Math.max(1, from.w), to.h / Math.max(1, from.h))
  const boxW = from.w * s
  const boxH = from.h * s
  return { s, boxW, boxH, fx: boxW / to.w, fy: boxH / to.h }
}

export function resizeLayers(
  layers: TextLayer[],
  from: { w: number; h: number },
  to: { w: number; h: number },
): TextLayer[] {
  if (!from.w || !from.h || !to.w || !to.h) return layers
  const { fx, fy } = fitBox(from, to)
  if (Math.abs(fx - 1) < 0.001 && Math.abs(fy - 1) < 0.001) return layers

  return layers.map((l) => ({
    ...l,
    x: Math.max(1, Math.min(99, 50 + (l.x - 50) * fx)),
    y: Math.max(1, Math.min(99, 50 + (l.y - 50) * fy)),
    fontSize: Math.max(0.5, Math.min(120, l.fontSize * fy)),
    wrapWidth: l.wrapWidth != null ? l.wrapWidth * fx : l.wrapWidth,
    shadowOffsetX: l.shadowOffsetX * fx,
    shadowOffsetY: l.shadowOffsetY * fy,
    shadowBlur: l.shadowBlur * fy,
  }))
}

/**
 * Fit a background photo into a new pixel size without cropping it.
 *
 * The gaps are filled with a blurred, zoomed copy of the same photo, so a wide
 * export of a tall design still looks intentional instead of letterboxed.
 */
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

  const iw = img.naturalWidth
  const ih = img.naturalHeight
  ctx.imageSmoothingQuality = 'high'

  // Backdrop: cover-crop + blur so the padding matches the photo.
  const cover = Math.max(to.w / iw, to.h / ih) * 1.08
  ctx.save()
  ctx.filter = 'blur(28px) brightness(0.96)'
  ctx.drawImage(img, (to.w - iw * cover) / 2, (to.h - ih * cover) / 2, iw * cover, ih * cover)
  ctx.restore()

  // Foreground: contain-fit, fully visible.
  const { boxW, boxH } = fitBox({ w: iw, h: ih }, to)
  ctx.drawImage(img, (to.w - boxW) / 2, (to.h - boxH) / 2, boxW, boxH)
  return canvas.toDataURL('image/png')
}

