/**
 * Ready-made design templates (title packs).
 * Each template is a full multi-layer composition: shapes + styled text.
 */
import { createGraphicLayer, createTextLayer, type TextLayer } from '@/lib/text-layer'
import { shapeDataUrl } from '@/lib/shapes'

export type TemplateLang = 'EN' | 'MM'

export interface TemplateDef {
  id: string
  name: string
  lang: TemplateLang
  group: string
  build: () => TextLayer[]
}

type Spec =
  | { kind: 'text'; text: string; o: Partial<TextLayer> }
  | { kind: 'shape'; path: string; aspect: number; o: Partial<TextLayer> }

/* ---------- local shape paths (0 0 100 100 viewBox) ---------- */
const P = {
  rect: 'M0,0H100V100H0Z',
  round: 'M12,0H88A12,12 0 0 1 100,12V88A12,12 0 0 1 88,100H12A12,12 0 0 1 0,88V12A12,12 0 0 1 12,0Z',
  frame: 'M0,0H100V100H0ZM6,6V94H94V6Z',
  dot: 'M50,50m-46,0a46,46 0 1,0 92,0a46,46 0 1,0 -92,0',
  tri: 'M50,4L96,96H4Z',
  banner: 'M0,0H100V78L84,62L68,78L52,62L36,78L20,62L0,78Z',
  chevron: 'M0,0H72L100,50L72,100H0L28,50Z',
}

const shape = (path: string, aspect: number, o: Partial<TextLayer>): Spec => ({
  kind: 'shape',
  path,
  aspect,
  o,
})
const text = (t: string, o: Partial<TextLayer>): Spec => ({ kind: 'text', text: t, o })

/* ---------- palettes ---------- */
interface Palette {
  key: string
  accent: string
  ink: string
  paper: string
}

const PALETTES: Palette[] = [
  { key: 'red', accent: '#e8323c', ink: '#111111', paper: '#ffffff' },
  { key: 'amber', accent: '#f5b301', ink: '#111111', paper: '#ffffff' },
  { key: 'ink', accent: '#111111', ink: '#111111', paper: '#ffffff' },
  { key: 'ocean', accent: '#2f6fed', ink: '#0b1b3a', paper: '#ffffff' },
]

/* ---------- content ---------- */
interface Content {
  key: string
  main: string
  sub: string
  tail: string
}

const EN_CONTENT: Content[] = [
  { key: 'modern', main: 'MODERN\nTITLES', sub: 'TYPOGRAPHY TITLE PACK', tail: 'CREATIVE' },
  { key: 'new', main: 'NEW\nDESIGN', sub: 'CLEAN & MINIMAL', tail: 'STUDIO' },
  { key: 'fast', main: 'VERY FAST\nRENDER', sub: 'MAIN TEXT HERE', tail: 'PRO' },
  { key: 'awesome', main: 'AWESOME\nDESIGN', sub: 'SECOND TEXT HERE', tail: 'NEW' },
  { key: 'kinetic', main: 'KINETIC\nTITLES', sub: 'MODERN TITLE PACK', tail: '2026' },
]

const MM_CONTENT: Content[] = [
  { key: 'mm-main', main: 'ခေတ်မီ\nစာလုံးများ', sub: 'ဒီဇိုင်းအထူးထုတ်', tail: 'အသစ်' },
  { key: 'mm-new', main: 'အသစ်\nဒီဇိုင်း', sub: 'ရိုးရှင်းလှပသော', tail: 'စတူဒီယို' },
  { key: 'mm-title', main: 'ခေါင်းစဉ်\nစာသား', sub: 'ဒုတိယစာသားနေရာ', tail: 'ပရို' },
  { key: 'mm-photo', main: 'ဓာတ်ပုံ\nစာသား', sub: 'သင့်စာသားထည့်ပါ', tail: 'မြန်' },
  { key: 'mm-create', main: 'ဖန်တီးမှု\nအနုပညာ', sub: 'မြန်မာ ဒီဇိုင်း', tail: '၂၀၂၆' },
]

const EN_FONT = { display: 'anton', body: 'montserrat', serif: 'playfair' }
const MM_FONT = { display: 'myanmar-khittar', body: 'pyidaungsu', serif: 'myanmar-taunggyi' }

/* ---------- recipes ---------- */
interface Recipe {
  key: string
  label: string
  group: string
  make: (c: Content, p: Palette, f: typeof EN_FONT, mm: boolean) => Spec[]
}

const lh = (mm: boolean) => (mm ? 1.55 : 1.05)

const RECIPES: Recipe[] = [
  {
    key: 'bar',
    label: 'Bar Title',
    group: 'Bold',
    make: (c, p, f, mm) => [
      shape(P.rect, 16, { x: 50, y: 50, fontSize: 4.6, color: p.accent }),
      text(c.main.replace('\n', ' '), {
        x: 50,
        y: 50,
        fontKey: f.display,
        fontSize: 6.4,
        color: p.paper,
        lineHeight: lh(mm),
      }),
      text(c.sub, {
        x: 50,
        y: 68,
        fontKey: f.body,
        fontSize: 4,
        letterSpacing: 3,
        color: p.ink,
        fontWeight: 600,
      }),
    ],
  },
  {
    key: 'stack',
    label: 'Stacked Block',
    group: 'Bold',
    make: (c, p, f, mm) => [
      text(c.main, {
        x: 50,
        y: 44,
        fontKey: f.display,
        fontSize: 14,
        color: p.ink,
        lineHeight: lh(mm),
      }),
      shape(P.rect, 40, { x: 50, y: 63, fontSize: 0.7, color: p.accent }),
      text(c.sub, { x: 50, y: 70, fontKey: f.body, fontSize: 4.4, letterSpacing: 2, color: p.ink }),
    ],
  },
  {
    key: 'accent-left',
    label: 'Accent Bar',
    group: 'Minimal',
    make: (c, p, f, mm) => [
      shape(P.rect, 0.18, { x: 16, y: 50, fontSize: 9, color: p.accent }),
      text(c.main, {
        x: 52,
        y: 50,
        align: 'left',
        fontKey: f.display,
        fontSize: 10,
        color: p.ink,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'outline',
    label: 'Outline',
    group: 'Minimal',
    make: (c, p, f, mm) => [
      text(c.main, {
        x: 50,
        y: 46,
        fontKey: f.display,
        fontSize: 13,
        color: 'transparent',
        strokeWidth: 1.4,
        strokeColor: p.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 68, fontKey: f.body, fontSize: 4.2, letterSpacing: 4, color: p.accent }),
    ],
  },
  {
    key: 'frame',
    label: 'Framed',
    group: 'Boxed',
    make: (c, p, f, mm) => [
      shape(P.frame, 2.1, { x: 50, y: 50, fontSize: 18, color: p.ink }),
      text(c.main.replace('\n', ' '), {
        x: 50,
        y: 50,
        fontKey: f.display,
        fontSize: 8,
        color: p.ink,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'tag',
    label: 'Highlight Tag',
    group: 'Boxed',
    make: (c, p, f, mm) => [
      text(c.main.split('\n')[0], {
        x: 50,
        y: 42,
        fontKey: f.display,
        fontSize: 11,
        color: p.ink,
        lineHeight: lh(mm),
      }),
      shape(P.round, 5, { x: 50, y: 60, fontSize: 4.6, color: p.accent }),
      text(c.sub, { x: 50, y: 60, fontKey: f.body, fontSize: 4, color: p.paper, fontWeight: 700 }),
    ],
  },
  {
    key: 'slash',
    label: 'Slash',
    group: 'Bold',
    make: (c, p, f, mm) => [
      shape(P.rect, 0.12, { x: 74, y: 48, fontSize: 12, rotation: 18, color: p.accent }),
      text(c.main, {
        x: 44,
        y: 48,
        fontKey: f.display,
        fontSize: 11,
        color: p.ink,
        lineHeight: lh(mm),
      }),
      text(c.tail, { x: 82, y: 66, fontKey: f.body, fontSize: 4.2, letterSpacing: 3, color: p.accent }),
    ],
  },
  {
    key: 'lines',
    label: 'Thin Lines',
    group: 'Minimal',
    make: (c, p, f, mm) => [
      shape(P.rect, 90, { x: 50, y: 34, fontSize: 0.3, color: p.ink }),
      text(c.main.replace('\n', ' '), {
        x: 50,
        y: 50,
        fontKey: f.body,
        fontWeight: 700,
        fontSize: 7,
        letterSpacing: 4,
        color: p.ink,
        lineHeight: lh(mm),
      }),
      shape(P.rect, 90, { x: 50, y: 66, fontSize: 0.3, color: p.ink }),
    ],
  },
  {
    key: 'shadow-pop',
    label: 'Hard Shadow',
    group: 'Retro',
    make: (c, p, f, mm) => [
      text(c.main, {
        x: 50,
        y: 50,
        fontKey: f.display,
        fontSize: 13,
        color: p.paper,
        strokeWidth: 0.8,
        strokeColor: p.ink,
        shadowColor: p.accent,
        shadowBlur: 0,
        shadowOffsetX: 6,
        shadowOffsetY: 6,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'depth',
    label: '3D Extrude',
    group: 'Retro',
    make: (c, p, f, mm) => [
      text(c.main.replace('\n', ' '), {
        x: 50,
        y: 50,
        fontKey: f.display,
        fontSize: 11,
        color: p.paper,
        depthOn: true,
        depth: 14,
        depthColor: p.accent,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'gradient',
    label: 'Gradient Fill',
    group: 'Colorful',
    make: (c, p, f, mm) => [
      text(c.main, {
        x: 50,
        y: 46,
        fontKey: f.display,
        fontSize: 13,
        fillType: 'gradient',
        gradientFrom: p.accent,
        gradientTo: '#7a3ff2',
        gradientAngle: 110,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 68, fontKey: f.body, fontSize: 4.2, letterSpacing: 3, color: p.ink }),
    ],
  },
  {
    key: 'neon',
    label: 'Neon Glow',
    group: 'Colorful',
    make: (c, p, f, mm) => [
      text(c.main.replace('\n', ' '), {
        x: 50,
        y: 50,
        fontKey: f.display,
        fontSize: 11,
        color: p.paper,
        strokeWidth: 0.6,
        strokeColor: p.accent,
        shadowColor: p.accent,
        shadowBlur: 26,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'dot',
    label: 'Dot Mark',
    group: 'Minimal',
    make: (c, p, f, mm) => [
      shape(P.dot, 1, { x: 50, y: 30, fontSize: 2.2, color: p.accent }),
      text(c.main, {
        x: 50,
        y: 52,
        fontKey: f.serif,
        fontSize: 10,
        color: p.ink,
        lineHeight: lh(mm),
      }),
      text(c.tail, { x: 50, y: 72, fontKey: f.body, fontSize: 3.8, letterSpacing: 5, color: p.ink }),
    ],
  },
  {
    key: 'banner',
    label: 'Banner',
    group: 'Boxed',
    make: (c, p, f, mm) => [
      shape(P.banner, 2.6, { x: 50, y: 46, fontSize: 12, color: p.accent }),
      text(c.main.replace('\n', ' '), {
        x: 50,
        y: 42,
        fontKey: f.display,
        fontSize: 7,
        color: p.paper,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'chevron',
    label: 'Chevron',
    group: 'Bold',
    make: (c, p, f, mm) => [
      shape(P.chevron, 3.4, { x: 50, y: 50, fontSize: 7, color: p.ink }),
      text(c.main.replace('\n', ' '), {
        x: 50,
        y: 50,
        fontKey: f.body,
        fontWeight: 800,
        fontSize: 5.6,
        letterSpacing: 2,
        color: p.paper,
        lineHeight: lh(mm),
      }),
    ],
  },
]

function buildAll(): TemplateDef[] {
  const out: TemplateDef[] = []
  const langs: { lang: TemplateLang; content: Content[]; fonts: typeof EN_FONT; mm: boolean }[] = [
    { lang: 'EN', content: EN_CONTENT, fonts: EN_FONT, mm: false },
    { lang: 'MM', content: MM_CONTENT, fonts: MM_FONT, mm: true },
  ]

  langs.forEach(({ lang, content, fonts, mm }) => {
    RECIPES.forEach((recipe, ri) => {
      content.forEach((c, ci) => {
        const palette = PALETTES[(ri + ci) % PALETTES.length]
        out.push({
          id: `${lang}-${recipe.key}-${c.key}`,
          name: recipe.label,
          lang,
          group: recipe.group,
          build: () => specsToLayers(recipe.make(c, palette, fonts, mm)),
        })
      })
    })
  })

  return out
}

function specsToLayers(specs: Spec[]): TextLayer[] {
  return specs.map((spec) => {
    if (spec.kind === 'shape') {
      const color = (spec.o.color as string) ?? '#000000'
      const base = createGraphicLayer(
        { kind: 'shape', src: shapeDataUrl(spec.path, color), aspect: spec.aspect },
        'Shape',
      )
      return { ...base, ...spec.o, color }
    }
    const base = createTextLayer(spec.text)
    return { ...base, ...spec.o, text: spec.text }
  })
}

export const TEMPLATES: TemplateDef[] = buildAll()

export const TEMPLATE_GROUPS: string[] = ['All', 'Bold', 'Minimal', 'Boxed', 'Retro', 'Colorful']
