export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function ctxOf(w: number, h: number) {
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

/** Fit the image inside a square canvas with a background color. */
export async function squareFit(src: string, scale = 1, background = '#ffffff') {
  const img = await loadImage(src)
  const size = Math.max(img.naturalWidth, img.naturalHeight)
  const { canvas, ctx } = ctxOf(size, size)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, size, size)
  const base = Math.min(size / img.naturalWidth, size / img.naturalHeight)
  const w = img.naturalWidth * base * scale
  const h = img.naturalHeight * base * scale
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
  return canvas.toDataURL('image/png')
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
