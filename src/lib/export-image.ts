export type ExportFormat = 'jpeg' | 'png' | 'webp'

export const FORMAT_LABEL: Record<ExportFormat, string> = {
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WebP',
}

export const FORMAT_EXT: Record<ExportFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
}

export function supportsQuality(format: ExportFormat) {
  return format !== 'png'
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Re-encode a PNG data URL into the requested format/quality. */
export async function encodeImage(
  pngDataUrl: string,
  format: ExportFormat,
  quality: number,
  scale = 1,
): Promise<string> {
  if (format === 'png' && scale === 1) return pngDataUrl
  const img = await loadImage(pngDataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return pngDataUrl
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  if (format === 'png') return canvas.toDataURL('image/png')
  return canvas.toDataURL(`image/${format}`, Math.min(1, Math.max(0.01, quality / 100)))
}

/** Approximate byte size of a data URL payload. */
export function dataUrlSize(dataUrl: string) {
  const idx = dataUrl.indexOf(',')
  if (idx < 0) return 0
  const b64 = dataUrl.slice(idx + 1)
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding)
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function defaultFilename() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `AddText_${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}.${p(d.getMinutes())}.${p(d.getSeconds())}`
}

/** On native, save into the Documents folder and return its display path. */
export async function saveRenderedImage(
  dataUrl: string,
  filename: string,
): Promise<{ location: string; native: boolean }> {
  const { saveToDevice } = await import('./native')
  const location = await saveToDevice(dataUrl, filename)
  if (location) return { location, native: true }
  downloadDataUrl(dataUrl, filename)
  return { location: filename, native: false }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

/** Export the rendered image as a single-page PDF sized to the image. */
export async function exportPdf(pngDataUrl: string, filename: string) {
  const { jsPDF } = await import('jspdf')
  const img = await loadImage(pngDataUrl)
  const w = img.naturalWidth
  const h = img.naturalHeight
  const pdf = new jsPDF({
    orientation: w >= h ? 'landscape' : 'portrait',
    unit: 'px',
    format: [w, h],
  })
  pdf.addImage(pngDataUrl, 'PNG', 0, 0, w, h)
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
