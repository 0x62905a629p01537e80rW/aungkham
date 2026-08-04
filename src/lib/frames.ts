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
  | 'ornament'

/** Asian ornamental motifs — Burmese kanote, Thai kranok, lotus, naga and vine. */
export type OrnamentMotif =
  | 'kanote'
  | 'kranok'
  | 'lotus'
  | 'naga'
  | 'vine'
  | 'pyatthat'

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
  motif?: OrnamentMotif
  /** motif repeat spacing, multiple of the band size */
  density?: number
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

  // ——— Burmese / Thai / Asian ornaments ———
  { id: 'kanote-gold', label: 'Kanote Gold', kind: 'ornament', motif: 'kanote', color: '#d4a017', accent: '#7a1f1f', pad: 0.1, width: 0.006, density: 1.5 },
  { id: 'kanote-ruby', label: 'Kanote Ruby', kind: 'ornament', motif: 'kanote', color: '#f4d58d', accent: '#8c1c13', pad: 0.11, width: 0.006, density: 1.5 },
  { id: 'kranok-gold', label: 'Kranok Gold', kind: 'ornament', motif: 'kranok', color: '#e0b64a', accent: '#5b1a10', pad: 0.1, width: 0.006, density: 1.25 },
  { id: 'kranok-jade', label: 'Kranok Jade', kind: 'ornament', motif: 'kranok', color: '#8fd6b4', accent: '#0d3b2e', pad: 0.1, width: 0.006, density: 1.25 },
  { id: 'lotus-gold', label: 'Lotus Gold', kind: 'ornament', motif: 'lotus', color: '#e6c25c', accent: '#4a2d0b', pad: 0.1, width: 0.005, density: 1.4 },
  { id: 'lotus-rose', label: 'Lotus Rose', kind: 'ornament', motif: 'lotus', color: '#f0a6b8', accent: '#5c1030', pad: 0.1, width: 0.005, density: 1.4 },
  { id: 'naga-gold', label: 'Naga Wave', kind: 'ornament', motif: 'naga', color: '#dcb765', accent: '#2b1a08', pad: 0.095, width: 0.006, density: 1.6 },
  { id: 'naga-ink', label: 'Naga Ink', kind: 'ornament', motif: 'naga', color: '#f5f0e4', accent: '#12100d', pad: 0.095, width: 0.006, density: 1.6 },
  { id: 'vine-ivory', label: 'Floral Vine', kind: 'ornament', motif: 'vine', color: '#f4ecd8', accent: '#6b4a1b', pad: 0.09, width: 0.005, density: 1.7 },
  { id: 'vine-emerald', label: 'Vine Emerald', kind: 'ornament', motif: 'vine', color: '#a7e0b6', accent: '#08301f', pad: 0.09, width: 0.005, density: 1.7 },
  { id: 'pyatthat-gold', label: 'Pyatthat', kind: 'ornament', motif: 'pyatthat', color: '#e3bb55', accent: '#3b1408', pad: 0.115, width: 0.006, density: 1.5 },
  { id: 'pyatthat-teak', label: 'Temple Teak', kind: 'ornament', motif: 'pyatthat', color: '#c98b48', accent: '#241207', pad: 0.115, width: 0.006, density: 1.5 },
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
    case 'ornament':
      paintOrnament(ctx, w, h, spec)
      break
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

/* ────────────────────────────────────────────────────────────
   Asian ornament engine — Burmese kanote flame scrolls, Thai
   kranok teeth, lotus petals, naga waves, vines and pyatthat
   temple gables. Everything is drawn procedurally so frames stay
   crisp at any export resolution.
   ──────────────────────────────────────────────────────────── */

/** Involute-like spiral used by kanote / kranok scroll heads. */
function scroll(ctx: CanvasRenderingContext2D, r: number, turns = 1.6, dir = 1) {
  ctx.beginPath()
  const steps = 60
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * Math.PI * 2
    const rad = r * (1 - i / steps) ** 1.05
    const x = Math.cos(t) * rad * dir
    const y = Math.sin(t) * rad
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

/** One motif unit drawn in local space: baseline on y = 0, growing to +y. */
function motifUnit(
  ctx: CanvasRenderingContext2D,
  motif: OrnamentMotif,
  step: number,
  size: number,
  color: string,
  accent: string,
  lw: number,
) {
  ctx.lineWidth = lw
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  switch (motif) {
    case 'kranok': {
      // Thai kranok: a curling flame tooth with an inner echo.
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(step * 0.1, size * 0.7, step * 0.28, size * 0.95, step * 0.48, size)
      ctx.bezierCurveTo(step * 0.72, size * 0.9, step * 0.9, size * 0.4, step, 0)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = lw * 0.9
      ctx.beginPath()
      ctx.moveTo(step * 0.5, size * 0.12)
      ctx.quadraticCurveTo(step * 0.36, size * 0.5, step * 0.46, size * 0.78)
      ctx.stroke()
      break
    }
    case 'kanote': {
      // Burmese kanote: paired flame leaves around a pearl.
      ctx.beginPath()
      ctx.moveTo(step * 0.5, 0)
      ctx.bezierCurveTo(step * 0.06, size * 0.35, step * 0.12, size * 0.9, step * 0.42, size)
      ctx.bezierCurveTo(step * 0.38, size * 0.55, step * 0.46, size * 0.3, step * 0.5, 0)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(step * 0.5, 0)
      ctx.bezierCurveTo(step * 0.94, size * 0.35, step * 0.88, size * 0.9, step * 0.58, size)
      ctx.bezierCurveTo(step * 0.62, size * 0.55, step * 0.54, size * 0.3, step * 0.5, 0)
      ctx.fill()
      ctx.fillStyle = accent
      ctx.beginPath()
      ctx.arc(step * 0.5, size * 0.46, size * 0.13, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'lotus': {
      // Lotus petal trio.
      const petal = (cx: number, s: number, tilt: number) => {
        ctx.save()
        ctx.translate(cx, 0)
        ctx.rotate(tilt)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.bezierCurveTo(-s * 0.42, s * 0.5, -s * 0.2, s * 1.05, 0, s * 1.1)
        ctx.bezierCurveTo(s * 0.2, s * 1.05, s * 0.42, s * 0.5, 0, 0)
        ctx.fill()
        ctx.restore()
      }
      petal(step * 0.5, size * 0.9, 0)
      ctx.fillStyle = accent
      petal(step * 0.5, size * 0.5, 0)
      ctx.fillStyle = color
      petal(step * 0.24, size * 0.55, -0.5)
      petal(step * 0.76, size * 0.55, 0.5)
      break
    }
    case 'naga': {
      // Naga serpent wave with a scale dot on each crest.
      ctx.strokeStyle = color
      ctx.lineWidth = lw * 1.6
      ctx.beginPath()
      ctx.moveTo(0, size * 0.2)
      ctx.bezierCurveTo(step * 0.25, size, step * 0.75, -size * 0.5, step, size * 0.2)
      ctx.stroke()
      ctx.fillStyle = accent
      ctx.beginPath()
      ctx.arc(step * 0.3, size * 0.62, size * 0.12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(step * 0.72, size * 0.16, size * 0.1, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'vine': {
      // Floral vine: stem, two leaves and a bud.
      ctx.strokeStyle = color
      ctx.lineWidth = lw * 1.3
      ctx.beginPath()
      ctx.moveTo(0, size * 0.25)
      ctx.quadraticCurveTo(step * 0.5, size * 0.95, step, size * 0.25)
      ctx.stroke()
      const leaf = (x: number, y: number, s: number, rot: number) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rot)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(s * 0.5, s * 0.55, s, 0)
        ctx.quadraticCurveTo(s * 0.5, -s * 0.55, 0, 0)
        ctx.fill()
        ctx.restore()
      }
      ctx.fillStyle = color
      leaf(step * 0.24, size * 0.55, size * 0.42, -0.9)
      leaf(step * 0.76, size * 0.55, size * 0.42, Math.PI + 0.9)
      ctx.fillStyle = accent
      ctx.beginPath()
      ctx.arc(step * 0.5, size * 0.7, size * 0.15, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'pyatthat': {
      // Stepped temple gable.
      const tiers = 3
      for (let i = 0; i < tiers; i++) {
        const t = i / tiers
        const y = size * t
        const half = (step * 0.5) * (1 - t * 0.55)
        ctx.fillStyle = i % 2 ? accent : color
        ctx.beginPath()
        ctx.moveTo(step * 0.5 - half, y)
        ctx.lineTo(step * 0.5 + half, y)
        ctx.lineTo(step * 0.5 + half * 0.72, y + size * 0.26)
        ctx.lineTo(step * 0.5 - half * 0.72, y + size * 0.26)
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(step * 0.5, size * 1.16)
      ctx.lineTo(step * 0.56, size * 0.9)
      ctx.lineTo(step * 0.44, size * 0.9)
      ctx.closePath()
      ctx.fill()
      break
    }
  }
}

function cornerPiece(
  ctx: CanvasRenderingContext2D,
  motif: OrnamentMotif,
  band: number,
  color: string,
  accent: string,
  lw: number,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lw * 1.4
  ctx.lineCap = 'round'

  if (motif === 'pyatthat') {
    ctx.beginPath()
    ctx.moveTo(0, band)
    ctx.lineTo(0, 0)
    ctx.lineTo(band, 0)
    ctx.lineTo(band * 0.6, band * 0.28)
    ctx.lineTo(band * 0.28, band * 0.6)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.arc(band * 0.3, band * 0.3, band * 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  // Scroll head springing from the corner, mirrored along the diagonal.
  for (const flip of [false, true]) {
    ctx.save()
    if (flip) {
      ctx.transform(0, 1, 1, 0, 0, 0)
    }
    ctx.beginPath()
    ctx.moveTo(band * 1.5, band * 0.12)
    ctx.quadraticCurveTo(band * 0.7, band * 0.15, band * 0.5, band * 0.62)
    ctx.stroke()
    ctx.save()
    ctx.translate(band * 0.52, band * 0.66)
    scroll(ctx, band * 0.34, 1.5, 1)
    ctx.restore()
    ctx.restore()
  }
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.arc(band * 0.34, band * 0.34, band * 0.13, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(band * 0.34, band * 0.34, band * 0.06, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function paintOrnament(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: FrameSpec,
) {
  const base = Math.min(w, h)
  const band = (spec.pad ?? 0.1) * base
  const lw = Math.max(1, (spec.width ?? 0.006) * base)
  const motif = spec.motif ?? 'kanote'
  const color = spec.color
  const accent = spec.accent ?? spec.color

  ctx.save()
  ctx.lineJoin = 'round'

  // Double rule: a heavier outer line with a hairline companion inside.
  ctx.strokeStyle = color
  ctx.lineWidth = lw * 1.6
  ctx.strokeRect(band * 0.24, band * 0.24, w - band * 0.48, h - band * 0.48)
  ctx.strokeStyle = accent
  ctx.lineWidth = lw * 0.8
  ctx.strokeRect(band * 1.08, band * 1.08, w - band * 2.16, h - band * 2.16)

  const size = band * 0.62
  const unit = band * (spec.density ?? 1.5)
  const inset = band * 1.08
  const margin = band * 1.05

  const sides: [number, number, number, number][] = [
    [inset, inset, 0, w - inset * 2],
    [w - inset, inset, Math.PI / 2, h - inset * 2],
    [w - inset, h - inset, Math.PI, w - inset * 2],
    [inset, h - inset, -Math.PI / 2, h - inset * 2],
  ]

  for (const [ox, oy, rot, len] of sides) {
    const usable = len - margin * 2
    if (usable <= unit * 0.6) continue
    const count = Math.max(1, Math.round(usable / unit))
    const step = usable / count
    ctx.save()
    ctx.translate(ox, oy)
    ctx.rotate(rot)
    ctx.translate(margin, 0)
    for (let i = 0; i < count; i++) {
      ctx.save()
      ctx.translate(i * step, 0)
      motifUnit(ctx, motif, step, size, color, accent, lw)
      ctx.restore()
    }
    ctx.restore()
  }

  // Corner ornaments, one per corner, mirrored into place.
  const corners: [number, number, number, number][] = [
    [inset, inset, 1, 1],
    [w - inset, inset, -1, 1],
    [w - inset, h - inset, -1, -1],
    [inset, h - inset, 1, -1],
  ]
  for (const [cx, cy, sx, sy] of corners) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(sx, sy)
    cornerPiece(ctx, motif, band, color, accent, lw)
    ctx.restore()
  }

  ctx.restore()
}
