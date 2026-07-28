export const SOLID_COLORS = [
  '#ffffff',
  '#0f172a',
  '#111111',
  '#f5f5f4',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

export const GRADIENTS: { name: string; css: string; stops: [string, string, string?] }[] = [
  { name: 'Peach', css: 'linear-gradient(135deg,#ffecd2,#fcb69f)', stops: ['#ffecd2', '#fcb69f'] },
  { name: 'Purple', css: 'linear-gradient(135deg,#667eea,#764ba2)', stops: ['#667eea', '#764ba2'] },
  { name: 'Fire', css: 'linear-gradient(135deg,#f83600,#fe8c00)', stops: ['#f83600', '#fe8c00'] },
  {
    name: 'Night',
    css: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
    stops: ['#0f2027', '#203a43', '#2c5364'],
  },
]

export function makeSolidDataUrl(color: string, size = 1200) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)
  return canvas.toDataURL('image/png')
}

export function makeGradientDataUrl(stops: [string, string, string?], size = 1200) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, size, size)
  const filtered = stops.filter(Boolean) as string[]
  filtered.forEach((c, i) => grad.addColorStop(i / (filtered.length - 1), c))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return canvas.toDataURL('image/png')
}

/** Renders a solid hex OR a css linear/radial gradient string to a data URL. */
export function makeBackgroundDataUrl(css: string, size = 1200) {
  const m = /^(linear|radial)-gradient\((.*)\)$/is.exec(css.trim())
  if (!m) return makeSolidDataUrl(css, size)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const parts = m[2].split(/,(?![^(]*\))/).map((p) => p.trim())
  let angle = 90
  if (/deg$/i.test(parts[0])) angle = parseFloat(parts.shift()!) || 0
  else if (/^(circle|ellipse|to\s)/i.test(parts[0])) parts.shift()

  const parsed = parts.map((p, i) => {
    const sm = /^(.+?)(?:\s+([\d.]+)%)?$/.exec(p)!
    return {
      color: sm[1].trim(),
      pos: sm[2] !== undefined ? parseFloat(sm[2]) / 100 : i / Math.max(1, parts.length - 1),
    }
  })

  let grad: CanvasGradient
  if (m[1].toLowerCase() === 'radial') {
    grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 1.4)
  } else {
    const rad = ((angle - 90) * Math.PI) / 180
    const cx = size / 2
    const cy = size / 2
    const len = Math.abs(size * Math.cos(rad)) / 2 + Math.abs(size * Math.sin(rad)) / 2
    grad = ctx.createLinearGradient(
      cx - Math.cos(rad) * len,
      cy - Math.sin(rad) * len,
      cx + Math.cos(rad) * len,
      cy + Math.sin(rad) * len,
    )
  }
  parsed.forEach((st) => grad.addColorStop(Math.min(1, Math.max(0, st.pos)), st.color))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return canvas.toDataURL('image/png')
}
