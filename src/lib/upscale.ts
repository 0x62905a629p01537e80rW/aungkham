/**
 * Ultra HD enhancement powered by UpscalerJS (https://github.com/thekevinscott/upscalerjs).
 *
 * Runs an ESRGAN-slim super-resolution model in the browser through
 * TensorFlow.js (WebGL / GPU when available). Weights are fetched from the
 * CDN on first use, so the device must be online.
 */

export class NoConnectionError extends Error {
  constructor() {
    super('No connection')
    this.name = 'NoConnectionError'
  }
}

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine !== false
}

type UpscalerInstance = {
  upscale: (
    src: string,
    opts?: { patchSize?: number; padding?: number; output?: 'base64'; progress?: (rate: number) => void },
  ) => Promise<string>
  dispose?: () => Promise<void>
}

let cached: Promise<UpscalerInstance> | null = null

async function getUpscaler(): Promise<UpscalerInstance> {
  if (!cached) {
    cached = (async () => {
      const [{ default: Upscaler }, model] = await Promise.all([
        import('upscaler'),
        import('@upscalerjs/esrgan-slim/2x'),
      ])
      return new Upscaler({
        model: (model as { default: unknown }).default,
      }) as unknown as UpscalerInstance
    })().catch((err) => {
      cached = null
      throw err
    })
  }
  return cached
}

/** Biggest source edge we feed to the model, to keep phones responsive. */
const MAX_INPUT_EDGE = 1600

async function downscaleIfHuge(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl)
  const edge = Math.max(img.naturalWidth, img.naturalHeight)
  if (edge <= MAX_INPUT_EDGE) return dataUrl
  const scale = MAX_INPUT_EDGE / edge
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read the image'))
    img.src = src
  })
}

/**
 * Upscale + enhance a data URL. Throws {@link NoConnectionError} when the
 * device is offline or the model weights cannot be downloaded.
 */
export async function enhanceUltraHd(
  dataUrl: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (!isOnline()) throw new NoConnectionError()
  let upscaler: UpscalerInstance
  try {
    upscaler = await getUpscaler()
  } catch {
    throw new NoConnectionError()
  }
  const src = await downscaleIfHuge(dataUrl)
  try {
    return await upscaler.upscale(src, {
      patchSize: 64,
      padding: 4,
      output: 'base64',
      progress: (rate: number) => onProgress?.(Math.round(rate * 100)),
    })
  } catch (err) {
    if (!isOnline()) throw new NoConnectionError()
    const msg = err instanceof Error ? err.message : ''
    if (/fetch|network|load|404/i.test(msg)) throw new NoConnectionError()
    throw err
  }
}
