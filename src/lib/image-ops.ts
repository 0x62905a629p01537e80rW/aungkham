export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function ctxOf(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w))
  canvas.height = Math.max(1, Math.round(h))
  return { canvas, ctx: canvas.getContext('2d')! }
}

/** Crop with normalized (0-1) rect. */
export async function cropImage(
  src: string,
  rect: { x: number; y: number; w: number; h: number },
) {
  const img = await loadImage(src)
  const sx = rect.x * img.naturalWidth
  const sy = rect.y * img.naturalHeight
  const sw = rect.w * img.naturalWidth
  const sh = rect.h * img.naturalHeight
  const { canvas, ctx } = ctxOf(sw, sh)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

export async function resizeImage(src: string, w: number, h: number) {
  const img = await loadImage(src)
  const { canvas, ctx } = ctxOf(w, h)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

export async function flipImage(src: string, axis: 'h' | 'v') {
  const img = await loadImage(src)
  const { canvas, ctx } = ctxOf(img.naturalWidth, img.naturalHeight)
  ctx.translate(axis === 'h' ? canvas.width : 0, axis === 'v' ? canvas.height : 0)
  ctx.scale(axis === 'h' ? -1 : 1, axis === 'v' ? -1 : 1)
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
}

export async function rotateImage(src: string, deg: 90 | -90 | 180) {
  const img = await loadImage(src)
  const swap = deg === 90 || deg === -90
  const w = swap ? img.naturalHeight : img.naturalWidth
  const h = swap ? img.naturalWidth : img.naturalHeight
  const { canvas, ctx } = ctxOf(w, h)
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((deg * Math.PI) / 180)
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
  return canvas.toDataURL('image/png')
}

export interface RatioFitOptions {
  ratio?: number
  scale?: number
  /** Solid color, or 'transparent' */
  background?: string
  /** Two-stop gradient fill; overrides background when set */
  gradient?: { from: string; to: string; angle?: number } | null
  offsetX?: number
  offsetY?: number
  /** Blurred copy of the photo used as backdrop */
  blurBackground?: number
  backgroundOpacity?: number
  /** External image used as backdrop */
  backdropImage?: string | null
  backdropBlur?: number
  /** Drop shadow behind the fitted photo */
  shadow?: { blur: number; opacity: number; offsetY: number; color?: string } | null
}

/** Fit the image inside a canvas of the given aspect ratio, with background + offsets. */
export async function ratioFit(src: string, opts: RatioFitOptions = {}) {
  const {
    ratio = 1,
    scale = 1,
    background = '#ffffff',
    gradient = null,
    offsetX = 0,
    offsetY = 0,
    blurBackground = 0,
    backgroundOpacity = 1,
    backdropImage = null,
    backdropBlur = 0,
    shadow = null,
  } = opts
  const img = await loadImage(src)
  const long = Math.max(img.naturalWidth, img.naturalHeight)
  const cw = ratio >= 1 ? long : long * ratio
  const ch = ratio >= 1 ? long / ratio : long
  const { canvas, ctx } = ctxOf(cw, ch)

  if (gradient) {
    const angle = ((gradient.angle ?? 90) * Math.PI) / 180
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const len = Math.abs(Math.cos(angle)) * canvas.width + Math.abs(Math.sin(angle)) * canvas.height
    const g = ctx.createLinearGradient(
      cx - (Math.cos(angle) * len) / 2,
      cy - (Math.sin(angle) * len) / 2,
      cx + (Math.cos(angle) * len) / 2,
      cy + (Math.sin(angle) * len) / 2,
    )
    g.addColorStop(0, gradient.from)
    g.addColorStop(1, gradient.to)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else if (background && background !== 'transparent') {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const drawCover = (source: CanvasImageSource, sw: number, sh: number, blur: number, alpha: number) => {
    ctx.save()
    ctx.globalAlpha = alpha
    if (blur > 0) ctx.filter = `blur(${blur}px)`
    const cover = Math.max(canvas.width / sw, canvas.height / sh) * (blur > 0 ? 1.15 : 1)
    const bw = sw * cover
    const bh = sh * cover
    ctx.drawImage(source, (canvas.width - bw) / 2, (canvas.height - bh) / 2, bw, bh)
    ctx.restore()
    ctx.filter = 'none'
  }

  if (backdropImage) {
    const bg = await loadImage(backdropImage)
    drawCover(bg, bg.naturalWidth, bg.naturalHeight, backdropBlur, backgroundOpacity)
  } else if (blurBackground > 0) {
    drawCover(img, img.naturalWidth, img.naturalHeight, blurBackground, backgroundOpacity)
  }

  const base = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
  const w = img.naturalWidth * base * scale
  const h = img.naturalHeight * base * scale
  const dx = (canvas.width - w) / 2 + (offsetX / 100) * (canvas.width / 2)
  const dy = (canvas.height - h) / 2 + (offsetY / 100) * (canvas.height / 2)
  ctx.save()
  if (shadow && shadow.opacity > 0) {
    const rgb = shadow.color ?? '0,0,0'
    ctx.shadowColor = `rgba(${rgb},${shadow.opacity})`
    ctx.shadowBlur = (shadow.blur / 100) * Math.max(canvas.width, canvas.height) * 0.25
    ctx.shadowOffsetY = (shadow.offsetY / 100) * canvas.height * 0.15
  }
  ctx.drawImage(img, dx, dy, w, h)
  ctx.restore()
  return canvas.toDataURL('image/png')
}


/** Fit the image inside a square canvas with a background color. */
export async function squareFit(src: string, scale = 1, background = '#ffffff') {
  return ratioFit(src, { ratio: 1, scale, background })
}

/** Blur the whole image. amount = px radius. */
export async function blurImage(src: string, amount: number) {
  const img = await loadImage(src)
  const { canvas, ctx } = ctxOf(img.naturalWidth, img.naturalHeight)
  ctx.filter = `blur(${amount}px)`
  ctx.drawImage(img, 0, 0)
  ctx.filter = 'none'
  return canvas.toDataURL('image/png')
}

/** Blur everything except a circular focus area (normalized center + radius). */
export async function blurOutside(
  src: string,
  amount: number,
  focus: { x: number; y: number; r: number },
) {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  const { canvas, ctx } = ctxOf(w, h)

  ctx.filter = `blur(${amount}px)`
  ctx.drawImage(img, 0, 0)
  ctx.filter = 'none'

  const sharp = ctxOf(w, h)
  sharp.ctx.drawImage(img, 0, 0)
  const radius = focus.r * Math.max(w, h)
  const cx = focus.x * w
  const cy = focus.y * h
  const grad = sharp.ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius)
  grad.addColorStop(0, 'rgba(0,0,0,1)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  sharp.ctx.globalCompositeOperation = 'destination-in'
  sharp.ctx.fillStyle = grad
  sharp.ctx.fillRect(0, 0, w, h)

  ctx.drawImage(sharp.canvas, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Straighten (free rotate) by an arbitrary angle, scaling up so the rotated
 * image still covers the original frame — no empty corners.
 */
export async function straightenImage(src: string, deg: number) {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  const rad = (Math.abs(deg) * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  // scale required so the rotated rect still covers the w x h frame
  const scale = Math.max((w * cos + h * sin) / w, (w * sin + h * cos) / h)
  const { canvas, ctx } = ctxOf(w, h)
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(w / 2, h / 2)
  ctx.rotate((deg * Math.PI) / 180)
  ctx.scale(scale, scale)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  return canvas.toDataURL('image/png')
}
