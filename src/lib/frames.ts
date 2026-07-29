import { ctxOf, loadImage } from './image-ops'

export type FrameKind =
  | 'none'
  | 'solid'
  | 'double'
  | 'triple'
  | 'dashed'
  | 'dotted'
  | 'rounded'
  | 'corner'
  | 'bracket'
  | 'matte'
  | 'polaroid'
  | 'vignette'
  | 'inset'

export interface FrameSpec {
  id: string
  label: string
  kind: FrameKind
  color: string
  /** stroke width as a fraction of the shortest side */
  width?: number
  /** gap between lines, fraction of the shortest side */
  gap?: number
  /** padding (matte / polaroid) as a fraction of the shortest side */
  pad?: number
  /** extra bottom padding for polaroid */
  padBottom?: number
  radius?: number
  accent?: string
}

export const FRAMES: FrameSpec[] = [
  { id: 'none', label: 'None', kind: 'none', color: '#000000' },
  { id: 'white-thin', label: 'White Thin', kind: 'solid', color: '#ffffff', width: 0.012 },
  { id: 'white-bold', label: 'White Bold', kind: 'solid', color: '#ffffff', width: 0.05 },
  { id: 'black-thin', label: 'Black Thin', kind: 'solid', color: '#111111', width: 0.012 },
  { id: 'black-bold', label: 'Black Bold', kind: 'solid', color: '#111111', width: 0.05 },
  { id: 'gold-line', label: 'Gold Line', kind: 'solid', color: '#c9a227', width: 0.02 },
  { id: 'ivory-line', label: 'Ivory', kind: 'solid', color: '#f3ead6', width: 0.03 },
  { id: 'crimson', label: 'Crimson', kind: 'solid', color: '#b91c1c', width: 0.025 },
  { id: 'ocean', label: 'Ocean', kind: 'solid', color: '#0e7490', width: 0.025 },
  { id: 'forest', label: 'Forest', kind: 'solid', color: '#166534', width: 0.025 },
  { id: 'double-white', label: 'Double White', kind: 'double', color: '#ffffff', width: 0.01, gap: 0.03 },
  { id: 'double-black', label: 'Double Black', kind: 'double', color: '#111111', width: 0.01, gap: 0.03 },
  { id: 'double-gold', label: 'Double Gold', kind: 'double', color: '#c9a227', width: 0.008, gap: 0.026 },
  { id: 'triple-white', label: 'Triple White', kind: 'triple', color: '#ffffff', width: 0.007, gap: 0.022 },
  { id: 'triple-ink', label: 'Triple Ink', kind: 'triple', color: '#1f2937', width: 0.007, gap: 0.022 },
  { id: 'dashed-white', label: 'Dashed', kind: 'dashed', color: '#ffffff', width: 0.012 },
  { id: 'dashed-black', label: 'Dashed Ink', kind: 'dashed', color: '#111111', width: 0.012 },
  { id: 'dotted-white', label: 'Dotted', kind: 'dotted', color: '#ffffff', width: 0.014 },
  { id: 'dotted-gold', label: 'Dotted Gold', kind: 'dotted', color: '#c9a227', width: 0.014 },
  { id: 'rounded-white', label: 'Rounded', kind: 'rounded', color: '#ffffff', width: 0.02, radius: 0.06 },
  { id: 'rounded-black', label: 'Rounded Ink', kind: 'rounded', color: '#111111', width: 0.02, radius: 0.06 },
  { id: 'corner-white', label: 'Corners', kind: 'corner', color: '#ffffff', width: 0.014 },
  { id: 'corner-gold', label: 'Gold Corners', kind: 'corner', color: '#c9a227', width: 0.014 },
  { id: 'bracket-white', label: 'Brackets', kind: 'bracket', color: '#ffffff', width: 0.012 },
  { id: 'bracket-ink', label: 'Ink Brackets', kind: 'bracket', color: '#111111', width: 0.012 },
  { id: 'matte-white', label: 'Matte White', kind: 'matte', color: '#ffffff', pad: 0.07, accent: '#d4d4d8' },
  { id: 'matte-black', label: 'Matte Black', kind: 'matte', color: '#0b0b0f', pad: 0.07, accent: '#3f3f46' },
  { id: 'matte-cream', label: 'Matte Cream', kind: 'matte', color: '#f5eee0', pad: 0.07, accent: '#c9a227' },
  { id: 'polaroid', label: 'Polaroid', kind: 'polaroid', color: '#ffffff', pad: 0.05, padBottom: 0.2 },
  { id: 'polaroid-dark', label: 'Polaroid Dark', kind: 'polaroid', color: '#101014', pad: 0.05, padBottom: 0.2 },
  { id: 'vignette', label: 'Vignette', kind: 'vignette', color: '#000000' },
  { id: 'inset-white', label: 'Inset', kind: 'inset', color: '#ffffff', width: 0.03, gap: 0.02 },
]

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

/** Paint just the frame decoration on top of an already drawn canvas. */
export function paintFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: FrameSpec,
) {
  const base = Math.min(w, h)
  const lw = (spec.width ?? 0.02) * base
  ctx.save()
  ctx.strokeStyle = spec.color
  ctx.fillStyle = spec.color
  ctx.lineWidth = lw
  ctx.lineCap = 'butt'
  ctx.setLineDash([])

  const stroke = (inset: number, width = lw) => {
    ctx.lineWidth = width
    ctx.strokeRect(inset + width / 2, inset + width / 2, w - 2 * inset - width, h - 2 * inset - width)
  }

  switch (spec.kind) {
    case 'solid':
      stroke(0)
      break
    case 'double':
      stroke(0)
      stroke((spec.gap ?? 0.03) * base)
      break
    case 'triple':
      stroke(0)
      stroke((spec.gap ?? 0.02) * base)
      stroke((spec.gap ?? 0.02) * base * 2)
      break
    case 'dashed':
      ctx.setLineDash([lw * 3, lw * 2])
      stroke(lw)
      break
    case 'dotted':
      ctx.lineCap = 'round'
      ctx.setLineDash([0.1, lw * 2.4])
      stroke(lw)
      break
    case 'rounded': {
      const inset = lw
      ctx.lineWidth = lw
      roundRect(ctx, inset, inset, w - 2 * inset, h - 2 * inset, (spec.radius ?? 0.05) * base)
      ctx.stroke()
      break
    }
    case 'corner':
    case 'bracket': {
      const len = (spec.kind === 'corner' ? 0.12 : 0.22) * base
      const off = lw * 1.6
      ctx.lineWidth = lw
      ctx.lineCap = 'square'
      const corners: [number, number, number, number][] = [
        [off, off, 1, 1],
        [w - off, off, -1, 1],
        [off, h - off, 1, -1],
        [w - off, h - off, -1, -1],
      ]
      for (const [cx, cy, sx, sy] of corners) {
        ctx.beginPath()
        ctx.moveTo(cx + sx * len, cy)
        ctx.lineTo(cx, cy)
        ctx.lineTo(cx, cy + sy * len)
        ctx.stroke()
      }
      break
    }
    case 'inset': {
      const pad = (spec.width ?? 0.03) * base
      ctx.lineWidth = pad
      ctx.strokeRect(pad / 2, pad / 2, w - pad, h - pad)
      ctx.strokeStyle = spec.accent ?? spec.color
      ctx.lineWidth = Math.max(1, pad * 0.14)
      const g = pad + (spec.gap ?? 0.02) * base
      ctx.strokeRect(g, g, w - 2 * g, h - 2 * g)
      break
    }
    case 'vignette': {
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.34, w / 2, h / 2, Math.max(w, h) * 0.72)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.75)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      break
    }
    default:
      break
  }
  ctx.restore()
}

/** Render the frame onto the image and return a PNG data URL. */
export async function applyFrame(src: string, spec: FrameSpec) {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  const base = Math.min(w, h)
  const { canvas, ctx } = ctxOf(w, h)

  if (spec.kind === 'matte' || spec.kind === 'polaroid') {
    const pad = (spec.pad ?? 0.06) * base
    const padBottom = (spec.padBottom ?? spec.pad ?? 0.06) * base
    ctx.fillStyle = spec.color
    ctx.fillRect(0, 0, w, h)
    const iw = w - pad * 2
    const ih = h - pad - padBottom
    ctx.drawImage(img, pad, pad, Math.max(1, iw), Math.max(1, ih))
    if (spec.accent) {
      ctx.strokeStyle = spec.accent
      ctx.lineWidth = Math.max(1, base * 0.004)
      ctx.strokeRect(pad, pad, Math.max(1, iw), Math.max(1, ih))
    }
    return canvas.toDataURL('image/png')
  }

  ctx.drawImage(img, 0, 0)
  paintFrame(ctx, w, h, spec)
  return canvas.toDataURL('image/png')
}
