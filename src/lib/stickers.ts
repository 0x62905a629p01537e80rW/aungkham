/**
 * Procedural sticker pack (100+ vector stickers — no emojis).
 * Each sticker is a glossy die-cut label rendered as an SVG data URL.
 */

export interface StickerDef {
  id: string
  name: string
  group: string
  svg: string
}

const PALETTE: { name: string; a: string; b: string }[] = [
  { name: 'Red', a: '#ff6a5a', b: '#d81f2a' },
  { name: 'Blue', a: '#63c8ff', b: '#0f7fd6' },
  { name: 'Green', a: '#a8e05a', b: '#4d9f14' },
  { name: 'Amber', a: '#ffc751', b: '#f08a00' },
  { name: 'Violet', a: '#c39bff', b: '#7a3ff2' },
  { name: 'Pink', a: '#ff9ec4', b: '#e8358a' },
  { name: 'Teal', a: '#6fe3d2', b: '#0d9488' },
  { name: 'Slate', a: '#cfd8e3', b: '#5b6b80' },
]

const FORMS: { name: string; body: string; peel?: string }[] = [
  {
    name: 'Circle',
    body: 'M50,4A46,46 0 1 1 49.9,4Z',
    peel: 'M78,82A46,46 0 0 1 58,94C66,86 68,74 78,82Z',
  },
  {
    name: 'Square',
    body: 'M14,6H86A8,8 0 0 1 94,14V86A8,8 0 0 1 86,94H14A8,8 0 0 1 6,86V14A8,8 0 0 1 14,6Z',
    peel: 'M94,72V94H72C80,82 84,68 94,72Z',
  },
  {
    name: 'Hexagon',
    body: 'M50,4L90,27V73L50,96L10,73V27Z',
    peel: 'M90,60V73L68,86C76,74 80,58 90,60Z',
  },
  {
    name: 'Pennant',
    body: 'M18,8H82V78L50,60L18,78Z',
  },
  {
    name: 'Ribbon',
    body: 'M8,20H92L74,50L92,80H8L26,50Z',
  },
  {
    name: 'Note',
    body: 'M10,10H90V72L68,92H10Z',
    peel: 'M90,72H68V92C74,80 80,72 90,72Z',
  },
  {
    name: 'Scallop',
    body: 'M50,4L60,12L72,9L78,20L91,23L91,36L99,46L91,56L91,69L78,72L72,83L60,80L50,88L40,80L28,83L22,72L9,69L9,56L1,46L9,36L9,23L22,20L28,9L40,12Z',
  },
  {
    name: 'Starburst',
    body: 'M50,2L57,16L72,8L73,25L89,22L82,37L98,42L86,52L98,62L82,67L89,82L73,79L72,96L57,88L50,99L43,88L28,96L27,79L11,82L18,67L2,62L14,52L2,42L18,37L11,22L27,25L28,8L43,16Z',
  },
  {
    name: 'Price tag',
    body: 'M50,6H92V48L46,94L6,54ZM78,20A7,7 0 1 0 78,34A7,7 0 0 0 78,20Z',
  },
  {
    name: 'Banner',
    body: 'M6,26C28,14 72,38 94,24V70C72,84 28,60 6,72Z',
  },
  {
    name: 'Bookmark',
    body: 'M24,4H76V96L50,74L24,96Z',
  },
  {
    name: 'Oval',
    body: 'M50,10A42,32 0 1 1 49.9,10Z',
    peel: 'M84,66A42,32 0 0 1 62,86C70,78 74,60 84,66Z',
  },
  {
    name: 'Shield',
    body: 'M50,4L90,18V52C90,74 72,88 50,96C28,88 10,74 10,52V18Z',
  },
  {
    name: 'Bubble',
    body: 'M14,10H86A10,10 0 0 1 96,20V62A10,10 0 0 1 86,72H44L22,92V72H14A10,10 0 0 1 4,62V20A10,10 0 0 1 14,10Z',
  },
]

function svgFor(form: (typeof FORMS)[number], color: (typeof PALETTE)[number], id: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
<linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${color.a}"/><stop offset="1" stop-color="${color.b}"/>
</linearGradient>
<linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</linearGradient>
</defs>
<g>
<path d="${form.body}" fill="url(#g${id})" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
<path d="${form.body}" fill="url(#s${id})" opacity="0.5"/>
${form.peel ? `<path d="${form.peel}" fill="#ffffff" opacity="0.92"/>` : ''}
</g></svg>`
}

function build(): StickerDef[] {
  const out: StickerDef[] = []
  FORMS.forEach((form, fi) => {
    PALETTE.forEach((color, ci) => {
      const id = `${fi}${ci}`
      out.push({
        id: `sticker-${form.name}-${color.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: `${form.name} ${color.name}`,
        group: form.name,
        svg: svgFor(form, color, id),
      })
    })
  })
  return out
}

export const STICKERS: StickerDef[] = build()

export const STICKER_GROUPS: string[] = FORMS.map((f) => f.name)

export function stickerDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\n/g, ''))}`
}
