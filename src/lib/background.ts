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
]

export type GradientPreset = { name: string; css: string; stops: [string, string, string?] }

const g = (name: string, a: string, b: string, c?: string): GradientPreset => ({
  name,
  css: `linear-gradient(135deg,${a},${b}${c ? `,${c}` : ''})`,
  stops: c ? [a, b, c] : [a, b],
})

export const GRADIENTS: GradientPreset[] = [
  g('Peach', '#ffecd2', '#fcb69f'),
  g('Purple', '#667eea', '#764ba2'),
  g('Fire', '#f83600', '#fe8c00'),
  g('Night', '#0f2027', '#203a43', '#2c5364'),
  g('Ocean', '#2193b0', '#6dd5ed'),
  g('Candy', '#ff9a9e', '#fad0c4'),
  g('Mint', '#43e97b', '#38f9d7'),
  g('Dusk', '#4568dc', '#b06ab3'),
]

/** Extra curated gradients — popular palettes used across modern UI kits. */
export const MORE_GRADIENTS: GradientPreset[] = [
  g('Sunset', '#ff512f', '#dd2476'),
  g('Blush', '#b24592', '#f15f79'),
  g('Lush', '#56ab2f', '#a8e063'),
  g('Aqua', '#13547a', '#80d0c7'),
  g('Cosmic', '#ff00cc', '#333399'),
  g('Lemon', '#f7971e', '#ffd200'),
  g('Sky', '#00c6ff', '#0072ff'),
  g('Bloody', '#ff416c', '#ff4b2b'),
  g('Emerald', '#348f50', '#56b4d3'),
  g('Royal', '#141e30', '#243b55'),
  g('Cherry', '#eb3349', '#f45c43'),
  g('Grape', '#8e2de2', '#4a00e0'),
  g('Sand', '#ede574', '#e1f5c4'),
  g('Steel', '#bdc3c7', '#2c3e50'),
  g('Coral', '#ff7e5f', '#feb47b'),
  g('Indigo', '#3a1c71', '#d76d77', '#ffaf7b'),
  g('Neon', '#00f260', '#0575e6'),
  g('Rose', '#ee9ca7', '#ffdde1'),
  g('Deep Sea', '#2c3e50', '#4ca1af'),
  g('Mango', '#ffe259', '#ffa751'),
  g('Violet', '#7f00ff', '#e100ff'),
  g('Frost', '#e0eafc', '#cfdef3'),
  g('Forest Sky', '#5a3f37', '#2c7744'),
  g('Cyber', '#0f0c29', '#302b63', '#24243e'),
  g('Flamingo', '#f953c6', '#b91d73'),
  g('Lime', '#a8ff78', '#78ffd6'),
  g('Copper', '#b79891', '#94716b'),
  g('Twilight', '#0b486b', '#f56217'),
  g('Bubblegum', '#fc466b', '#3f5efb'),
  g('Peachy', '#ffd89b', '#19547b'),
  g('Slate', '#485563', '#29323c'),
  g('Tropic', '#00b09b', '#96c93d'),
  g('Plum', '#c31432', '#240b36'),
  g('Sunrise', '#f6d365', '#fda085'),
  g('Lavender', '#a18cd1', '#fbc2eb'),
  g('Teal Ink', '#000428', '#004e92'),
  g('Peach Sky', '#fbc7d4', '#9796f0'),
  g('Gold', '#f7b733', '#fc4a1a'),
  g('Ice', '#74ebd5', '#acb6e5'),
  g('Midnight', '#232526', '#414345'),
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
