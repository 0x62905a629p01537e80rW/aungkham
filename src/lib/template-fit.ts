import type { TextLayer } from '@/lib/text-layer'

/**
 * Templates are authored small, then scaled up so type reads big on the canvas.
 * A blind multiplier makes headlines overflow the frame and collide with
 * captions, so the factor is capped by how much room each text layer actually
 * has: horizontally (canvas is 16:9, so 177cqh wide) and vertically (distance
 * to the neighbouring text block).
 */

const CANVAS_W = 177.8 // cqh
const SAFE_W = 0.9
const SAFE_H = 0.86

/** Rough per-character advance as a fraction of the font size. */
function advance(text: string) {
  return /[\u1000-\u109f]/.test(text) ? 0.95 : 0.62
}

function lines(text: string) {
  return text.split('\n')
}

interface Measurable {
  text: string
  fontSize: number
  y: number
  lineHeight?: number
  letterSpacing?: number
}

function allowedSize(item: Measurable, others: Measurable[], max: number) {
  const ls = item.letterSpacing ?? 0
  const rows = lines(item.text)
  const longest = rows.reduce((a, b) => (b.length > a.length ? b : a), '')
  const perChar = advance(item.text) + ls / 100
  const widthFit = (CANVAS_W * SAFE_W) / Math.max(1, longest.length * perChar)

  const gaps = others.map((o) => Math.abs(o.y - item.y))
  gaps.push(item.y, 100 - item.y)
  const gap = Math.min(...gaps.filter((g) => g > 0), 50)
  const lh = item.lineHeight ?? 1.15
  const heightFit = (2 * gap * SAFE_H) / (rows.length * lh)

  return Math.max(1, Math.min(widthFit, heightFit, max))
}

/** Largest uniform upscale that keeps every text layer inside the canvas. */
export function fitScale(items: Measurable[], desired: number, max: number) {
  let f = desired
  items.forEach((item, i) => {
    const others = items.filter((_, j) => j !== i)
    f = Math.min(f, allowedSize(item, others, max) / Math.max(0.1, item.fontSize))
  })
  return Math.max(1, f)
}

export function measurable(l: Partial<TextLayer> & { text?: string; fontSize?: number }): Measurable {
  return {
    text: l.text ?? '',
    fontSize: l.fontSize ?? 6,
    y: l.y ?? 50,
    lineHeight: l.lineHeight,
    letterSpacing: l.letterSpacing,
  }
}
