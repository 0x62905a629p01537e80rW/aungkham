/**
 * Vector patterns that can be clipped inside glyphs (or a shape fill).
 *
 * Each entry builds a tiling SVG at run time so the pattern picks up the
 * layer's two fill colours. Everything is a data URL, which keeps the export
 * canvas (html-to-image) working without extra network fetches.
 */
export type PatternKey =
  | 'stripes'
  | 'diagonal'
  | 'dots'
  | 'grid'
  | 'checker'
  | 'chevron'
  | 'waves'
  | 'crosshatch'
  | 'triangles'
  | 'confetti'

export const PATTERNS: { key: PatternKey; label: string }[] = [
  { key: 'stripes', label: 'Stripes' },
  { key: 'diagonal', label: 'Diagonal' },
  { key: 'dots', label: 'Dots' },
  { key: 'grid', label: 'Grid' },
  { key: 'checker', label: 'Checker' },
  { key: 'chevron', label: 'Chevron' },
  { key: 'waves', label: 'Waves' },
  { key: 'crosshatch', label: 'Hatch' },
  { key: 'triangles', label: 'Triangles' },
  { key: 'confetti', label: 'Confetti' },
]

function svg(body: string, size = 40) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(doc)}")`
}

/**
 * @param key    which pattern to draw
 * @param a      background colour of the tile
 * @param b      ink colour of the motif
 */
export function patternImage(key: PatternKey, a: string, b: string): string {
  const bg = `<rect width="40" height="40" fill="${a}"/>`
  switch (key) {
    case 'stripes':
      return svg(`${bg}<rect y="0" width="40" height="20" fill="${b}"/>`)
    case 'diagonal':
      return svg(
        `${bg}<path d="M-10 10 L10 -10 M0 40 L40 0 M30 50 L50 30" stroke="${b}" stroke-width="12" fill="none"/>`,
      )
    case 'dots':
      return svg(`${bg}<circle cx="10" cy="10" r="6" fill="${b}"/><circle cx="30" cy="30" r="6" fill="${b}"/>`)
    case 'grid':
      return svg(`${bg}<path d="M0 0 H40 M0 20 H40 M0 0 V40 M20 0 V40" stroke="${b}" stroke-width="4" fill="none"/>`)
    case 'checker':
      return svg(`${bg}<rect width="20" height="20" fill="${b}"/><rect x="20" y="20" width="20" height="20" fill="${b}"/>`)
    case 'chevron':
      return svg(
        `${bg}<path d="M0 26 L20 6 L40 26 M0 46 L20 26 L40 46 M0 6 L20 -14 L40 6" stroke="${b}" stroke-width="7" fill="none"/>`,
      )
    case 'waves':
      return svg(
        `${bg}<path d="M0 20 q10 -12 20 0 t20 0 M0 40 q10 -12 20 0 t20 0 M0 0 q10 -12 20 0 t20 0" stroke="${b}" stroke-width="5" fill="none"/>`,
      )
    case 'crosshatch':
      return svg(
        `${bg}<path d="M0 40 L40 0 M-10 10 L10 -10 M30 50 L50 30 M0 0 L40 40 M-10 30 L10 50 M30 -10 L50 10" stroke="${b}" stroke-width="3" fill="none"/>`,
      )
    case 'triangles':
      return svg(`${bg}<path d="M20 4 L38 36 L2 36 Z" fill="${b}"/>`)
    case 'confetti':
      return svg(
        `${bg}<rect x="4" y="6" width="10" height="4" rx="2" fill="${b}" transform="rotate(25 9 8)"/>` +
          `<rect x="24" y="18" width="10" height="4" rx="2" fill="${b}" transform="rotate(-40 29 20)"/>` +
          `<rect x="10" y="28" width="10" height="4" rx="2" fill="${b}" transform="rotate(65 15 30)"/>`,
      )
    default:
      return svg(bg)
  }
}
