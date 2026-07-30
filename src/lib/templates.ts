/**
 * Ready-made design templates.
 * Every template is a one-of-a-kind composition: its own layout, colors and copy.
 * No recipe is reused — each entry below appears exactly once per language.
 */
import { createGraphicLayer, createTextLayer, type TextLayer } from '@/lib/text-layer'
import { shapeDataUrl } from '@/lib/shapes'
import { PREMIUM_TEMPLATES } from '@/lib/premium-templates'

export type TemplateLang = 'EN' | 'MM'

export interface TemplateDef {
  id: string
  name: string
  lang: TemplateLang
  group: string
  /** optional background image applied with the template */
  bg?: string
  build: () => TextLayer[]
}

type Spec =
  | { kind: 'text'; text: string; o: Partial<TextLayer> }
  | { kind: 'shape'; path: string; aspect: number; o: Partial<TextLayer> }

/* ---------- shape paths (0 0 100 100 viewBox) ---------- */
const P = {
  rect: 'M0,0H100V100H0Z',
  round: 'M12,0H88A12,12 0 0 1 100,12V88A12,12 0 0 1 88,100H12A12,12 0 0 1 0,88V12A12,12 0 0 1 12,0Z',
  frame: 'M0,0H100V100H0ZM6,6V94H94V6Z',
  dot: 'M50,50m-46,0a46,46 0 1,0 92,0a46,46 0 1,0 -92,0',
  ring: 'M50,50m-46,0a46,46 0 1,0 92,0a46,46 0 1,0 -92,0ZM50,50m-38,0a38,38 0 1,1 76,0a38,38 0 1,1 -76,0',
  tri: 'M50,4L96,96H4Z',
  banner: 'M0,0H100V78L84,62L68,78L52,62L36,78L20,62L0,78Z',
  chevron: 'M0,0H72L100,50L72,100H0L28,50Z',
  ribbon: 'M0,14H100V86H0L14,50Z',
  tape: 'M0,18H100V82H0Z',
  flag: 'M0,0H100V100L50,74L0,100Z',
  hex: 'M25,4H75L100,50L75,96H25L0,50Z',
  diamond: 'M50,2L98,50L50,98L2,50Z',
  plus: 'M38,0H62V38H100V62H62V100H38V62H0V38H38Z',
  slantL: 'M18,0H100V100H0Z',
  slantR: 'M0,0H82L100,100H0Z',
  arch: 'M0,100V44A50,44 0 0 1 100,44V100Z',
  bracketL: 'M0,0H34V10H10V90H34V100H0Z',
  bracketR: 'M100,0H66V10H90V90H66V100H100Z',
  star: 'M50,2L62,36H98L69,58L80,94L50,72L20,94L31,58L2,36H38Z',
  burst:
    'M50,0L59,16L76,9L78,27L96,28L88,44L100,56L84,64L90,81L72,82L69,99L54,90L40,100L33,84L16,88L17,70L0,64L11,50L1,35L18,28L16,10L34,14Z',
}

const shape = (path: string, aspect: number, o: Partial<TextLayer>): Spec => ({
  kind: 'shape',
  path,
  aspect,
  o,
})
const text = (t: string, o: Partial<TextLayer>): Spec => ({ kind: 'text', text: t, o })

interface Copy {
  main: string
  sub: string
  tail: string
}

interface Colors {
  a: string // accent
  b: string // secondary accent
  ink: string
  paper: string
}

const EN_FONT = { display: 'anton', body: 'montserrat', serif: 'playfair' }
const MM_FONT = { display: 'myanmarsquare', body: 'layaungthit-k26', serif: 'myanmaryinmar' }
type Fonts = typeof EN_FONT

interface Design {
  key: string
  label: string
  group: string
  en: Copy
  mm: Copy
  c: Colors
  make: (c: Copy, k: Colors, f: Fonts, mm: boolean) => Spec[]
}

const lh = (mm: boolean) => (mm ? 1.5 : 1.05)
const one = (s: string) => s.replace(/\n/g, ' ')

/* ---------- 32 unique designs ---------- */
const DESIGNS: Design[] = [
  {
    key: 'headline-bar',
    label: 'Headline Bar',
    group: 'Bold',
    en: { main: 'MODERN\nTITLES', sub: 'TYPOGRAPHY PACK', tail: 'STUDIO' },
    mm: { main: 'ခေတ်မီ\nစာလုံးများ', sub: 'ဒီဇိုင်းအထူးထုတ်', tail: 'စတူဒီယို' },
    c: { a: '#e8323c', b: '#111111', ink: '#111111', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.rect, 12, { x: 50, y: 44, fontSize: 5.6, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 44,
        fontKey: f.display,
        fontSize: 7,
        color: k.paper,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 61, fontKey: f.body, fontSize: 3.6, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'giant-stack',
    label: 'Giant Stack',
    group: 'Bold',
    en: { main: 'BIG\nIDEAS', sub: 'CREATIVE DIRECTION', tail: '01' },
    mm: { main: 'ကြီးမား\nအတွေးများ', sub: 'ဖန်တီးမှုလမ်းညွှန်', tail: '၀၁' },
    c: { a: '#f5b301', b: '#111111', ink: '#111111', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      text(c.main, {
        x: 50,
        y: 46,
        fontKey: f.display,
        fontSize: 17,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      shape(P.rect, 26, { x: 50, y: 66, fontSize: 1.2, color: k.a }),
      text(c.sub, { x: 50, y: 73, fontKey: f.body, fontSize: 3.6, letterSpacing: 3, color: k.ink }),
    ],
  },
  {
    key: 'side-rule',
    label: 'Side Rule',
    group: 'Minimal',
    en: { main: 'QUIET\nDESIGN', sub: 'LESS, BUT BETTER', tail: '—' },
    mm: { main: 'ရိုးရှင်း\nဒီဇိုင်း', sub: 'နည်းသော်လည်း ကောင်း', tail: '—' },
    c: { a: '#2f6fed', b: '#0b1b3a', ink: '#0b1b3a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.rect, 0.14, { x: 16, y: 50, fontSize: 12, color: k.a }),
      text(c.main, {
        x: 24,
        y: 44,
        align: 'left',
        fontKey: f.display,
        fontSize: 11,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, {
        x: 24,
        y: 63,
        align: 'left',
        fontKey: f.body,
        fontSize: 3.4,
        letterSpacing: 3,
        color: k.a,
      }),
    ],
  },
  {
    key: 'hollow',
    label: 'Hollow',
    group: 'Minimal',
    en: { main: 'OUTLINE\nSERIES', sub: 'EDITION NO. 4', tail: '2026' },
    mm: { main: 'အနားသတ်\nစာလုံး', sub: 'အမှတ်စဉ် ၄', tail: '၂၀၂၆' },
    c: { a: '#111111', b: '#8a8a8a', ink: '#111111', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      text(c.main, {
        x: 50,
        y: 45,
        fontKey: f.display,
        fontSize: 14,
        color: 'transparent',
        strokeWidth: 1.3,
        strokeColor: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 67, fontKey: f.body, fontSize: 3.4, letterSpacing: 6, color: k.b }),
    ],
  },
  {
    key: 'double-frame',
    label: 'Double Frame',
    group: 'Boxed',
    en: { main: 'CLASSIC', sub: 'EST. MMXXVI', tail: 'PREMIUM' },
    mm: { main: 'ဂန္ထဝင်', sub: 'တည်ထောင် ၂၀၂၆', tail: 'အထူး' },
    c: { a: '#0f9d63', b: '#06301f', ink: '#06301f', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.frame, 2.4, { x: 50, y: 50, fontSize: 20, color: k.ink }),
      shape(P.frame, 2.1, { x: 50, y: 50, fontSize: 16, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 47,
        fontKey: f.serif,
        fontSize: 8,
        letterSpacing: 2,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 58, fontKey: f.body, fontSize: 3, letterSpacing: 4, color: k.a }),
    ],
  },
  {
    key: 'pill-tag',
    label: 'Pill Tag',
    group: 'Boxed',
    en: { main: 'LAUNCH\nDAY', sub: 'NEW ARRIVAL', tail: 'GO' },
    mm: { main: 'စတင်\nမိတ်ဆက်', sub: 'အသစ်ရောက်ရှိ', tail: 'သွား' },
    c: { a: '#7a3ff2', b: '#241046', ink: '#241046', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.round, 4.4, { x: 50, y: 34, fontSize: 4.2, color: k.a }),
      text(c.sub, { x: 50, y: 34, fontKey: f.body, fontSize: 3.2, color: k.paper, fontWeight: 700 }),
      text(c.main, {
        x: 50,
        y: 55,
        fontKey: f.display,
        fontSize: 12,
        color: k.ink,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'diagonal-slash',
    label: 'Diagonal',
    group: 'Bold',
    en: { main: 'FAST\nFORWARD', sub: 'MOTION TITLES', tail: 'RUN' },
    mm: { main: 'အရှိန်\nမြှင့်', sub: 'လှုပ်ရှားခေါင်းစဉ်', tail: 'ပြေး' },
    c: { a: '#f2711c', b: '#4a1f00', ink: '#4a1f00', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.rect, 0.1, { x: 76, y: 46, fontSize: 15, rotation: 20, color: k.a }),
      text(c.main, {
        x: 42,
        y: 46,
        fontKey: f.display,
        fontSize: 12,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.tail, { x: 82, y: 68, fontKey: f.body, fontSize: 3.6, letterSpacing: 4, color: k.a }),
    ],
  },
  {
    key: 'rule-sandwich',
    label: 'Rule Sandwich',
    group: 'Minimal',
    en: { main: 'ELEGANT LINES', sub: 'FINE TYPOGRAPHY', tail: '' },
    mm: { main: 'လှပသောမျဉ်း', sub: 'သပ်ရပ်စာလုံး', tail: '' },
    c: { a: '#0d9aa8', b: '#04333a', ink: '#04333a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.rect, 120, { x: 50, y: 38, fontSize: 0.35, color: k.ink }),
      text(one(c.main), {
        x: 50,
        y: 50,
        fontKey: f.body,
        fontWeight: 700,
        fontSize: 6,
        letterSpacing: 4,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      shape(P.rect, 120, { x: 50, y: 62, fontSize: 0.35, color: k.a }),
      text(c.sub, { x: 50, y: 70, fontKey: f.body, fontSize: 3, letterSpacing: 5, color: k.a }),
    ],
  },
  {
    key: 'hard-shadow',
    label: 'Hard Shadow',
    group: 'Retro',
    en: { main: 'POP\nSHOW', sub: 'RETRO TITLE', tail: '80s' },
    mm: { main: 'ပေါ့ပ်\nရှိုး', sub: 'ရက်ထရိုခေါင်းစဉ်', tail: '၈၀' },
    c: { a: '#ec4899', b: '#111111', ink: '#111111', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      text(c.main, {
        x: 50,
        y: 48,
        fontKey: f.display,
        fontSize: 14,
        color: k.paper,
        strokeWidth: 0.9,
        strokeColor: k.ink,
        shadowColor: k.a,
        shadowBlur: 0,
        shadowOffsetX: 7,
        shadowOffsetY: 7,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'extrude',
    label: 'Extruded',
    group: 'Retro',
    en: { main: 'DEEP TITLE', sub: 'THREE DIMENSIONS', tail: '3D' },
    mm: { main: 'သုံးဖက်မြင်', sub: 'အထူချဲ့စာလုံး', tail: '၃ဒီ' },
    c: { a: '#4338ca', b: '#14124a', ink: '#14124a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      text(one(c.main), {
        x: 50,
        y: 48,
        fontKey: f.display,
        fontSize: 11,
        color: k.paper,
        depthOn: true,
        depth: 16,
        depthColor: k.a,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 70, fontKey: f.body, fontSize: 3.2, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'gradient-wash',
    label: 'Gradient Wash',
    group: 'Colorful',
    en: { main: 'COLOR\nFLOW', sub: 'GRADIENT SERIES', tail: '' },
    mm: { main: 'အရောင်\nစီးဆင်း', sub: 'ရောင်စဉ်စီးရီး', tail: '' },
    c: { a: '#ff5f6d', b: '#7a3ff2', ink: '#1a1a1a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      text(c.main, {
        x: 50,
        y: 46,
        fontKey: f.display,
        fontSize: 14,
        fillType: 'gradient',
        gradientFrom: k.a,
        gradientTo: k.b,
        gradientAngle: 110,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 68, fontKey: f.body, fontSize: 3.4, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'neon-night',
    label: 'Neon Night',
    group: 'Colorful',
    en: { main: 'NEON CITY', sub: 'AFTER MIDNIGHT', tail: '' },
    mm: { main: 'နီယွန်မြို့', sub: 'သန်းခေါင်နောက်ပိုင်း', tail: '' },
    c: { a: '#22d3ee', b: '#0b1020', ink: '#0b1020', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.round, 2.6, { x: 50, y: 50, fontSize: 22, color: k.b }),
      text(one(c.main), {
        x: 50,
        y: 46,
        fontKey: f.display,
        fontSize: 9,
        color: k.paper,
        strokeWidth: 0.5,
        strokeColor: k.a,
        shadowColor: k.a,
        shadowBlur: 26,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 60, fontKey: f.body, fontSize: 3, letterSpacing: 5, color: k.a }),
    ],
  },
  {
    key: 'dot-serif',
    label: 'Dot & Serif',
    group: 'Minimal',
    en: { main: 'GRACE', sub: 'A QUIET MARK', tail: 'NO. 07' },
    mm: { main: 'သိမ်မွေ့', sub: 'တိတ်ဆိတ်သောအမှတ်', tail: 'အမှတ် ၇' },
    c: { a: '#be123c', b: '#3f0416', ink: '#1a1a1a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.dot, 1, { x: 50, y: 28, fontSize: 2, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 50,
        fontKey: f.serif,
        fontSize: 11,
        letterSpacing: 3,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.tail, { x: 50, y: 70, fontKey: f.body, fontSize: 3, letterSpacing: 6, color: k.b }),
    ],
  },
  {
    key: 'award-banner',
    label: 'Award Banner',
    group: 'Boxed',
    en: { main: 'WINNER', sub: 'BEST OF THE YEAR', tail: '2026' },
    mm: { main: 'အနိုင်ရ', sub: 'နှစ်၏အကောင်းဆုံး', tail: '၂၀၂၆' },
    c: { a: '#c9a84c', b: '#3a2c00', ink: '#3a2c00', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.banner, 2.4, { x: 50, y: 44, fontSize: 13, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 38,
        fontKey: f.display,
        fontSize: 7,
        letterSpacing: 2,
        color: k.paper,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 68, fontKey: f.body, fontSize: 3.2, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'arrow-lane',
    label: 'Arrow Lane',
    group: 'Bold',
    en: { main: 'NEXT LEVEL', sub: 'KEEP GOING', tail: '' },
    mm: { main: 'နောက်တစ်ဆင့်', sub: 'ဆက်လက်လုပ်ဆောင်', tail: '' },
    c: { a: '#111111', b: '#65a30d', ink: '#111111', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.chevron, 3.6, { x: 50, y: 46, fontSize: 8, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 46,
        fontKey: f.body,
        fontWeight: 800,
        fontSize: 5.4,
        letterSpacing: 2,
        color: k.paper,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 62, fontKey: f.body, fontSize: 3.2, letterSpacing: 4, color: k.b }),
    ],
  },
  {
    key: 'tape-strip',
    label: 'Tape Strip',
    group: 'Retro',
    en: { main: 'MIXTAPE', sub: 'SIDE A', tail: '' },
    mm: { main: 'သီချင်းစု', sub: 'အပိုင်း က', tail: '' },
    c: { a: '#f59e0b', b: '#1f2937', ink: '#1f2937', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.tape, 5, { x: 50, y: 48, fontSize: 8, rotation: -6, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 48,
        rotation: -6,
        fontKey: f.display,
        fontSize: 8,
        letterSpacing: 2,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 68, fontKey: f.body, fontSize: 3.2, letterSpacing: 5, color: k.ink }),
    ],
  },
  {
    key: 'brackets',
    label: 'Brackets',
    group: 'Minimal',
    en: { main: 'FOCUS', sub: 'ONE THING AT A TIME', tail: '' },
    mm: { main: 'အာရုံစူး', sub: 'တစ်ခုချင်းလုပ်ပါ', tail: '' },
    c: { a: '#2563eb', b: '#0b1b3a', ink: '#0b1b3a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.bracketL, 0.75, { x: 24, y: 46, fontSize: 9, color: k.a }),
      shape(P.bracketR, 0.75, { x: 76, y: 46, fontSize: 9, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 46,
        fontKey: f.display,
        fontSize: 9,
        letterSpacing: 3,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 64, fontKey: f.body, fontSize: 3, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'hex-badge',
    label: 'Hex Badge',
    group: 'Boxed',
    en: { main: 'PRO', sub: 'CERTIFIED QUALITY', tail: '' },
    mm: { main: 'ပရို', sub: 'အရည်အသွေးအာမခံ', tail: '' },
    c: { a: '#0f766e', b: '#042f2e', ink: '#042f2e', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.hex, 1.1, { x: 50, y: 40, fontSize: 11, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 40,
        fontKey: f.display,
        fontSize: 6.5,
        color: k.paper,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 63, fontKey: f.body, fontSize: 3.2, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'arch-poster',
    label: 'Arch Poster',
    group: 'Boxed',
    en: { main: 'GALLERY', sub: 'OPEN DAILY', tail: '' },
    mm: { main: 'ပြခန်း', sub: 'နေ့စဉ်ဖွင့်သည်', tail: '' },
    c: { a: '#e9d5a1', b: '#5a3d1e', ink: '#5a3d1e', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.arch, 1, { x: 50, y: 52, fontSize: 15, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 44,
        fontKey: f.serif,
        fontSize: 8,
        letterSpacing: 3,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 58, fontKey: f.body, fontSize: 3, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'split-slant',
    label: 'Split Slant',
    group: 'Bold',
    en: { main: 'SPLIT\nSCREEN', sub: 'DUAL TONE', tail: '' },
    mm: { main: 'နှစ်ခြမ်း\nဖန်သား', sub: 'အရောင်နှစ်မျိုး', tail: '' },
    c: { a: '#111111', b: '#f5b301', ink: '#111111', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.slantL, 1.2, { x: 34, y: 50, fontSize: 18, color: k.a }),
      shape(P.slantR, 1.2, { x: 72, y: 50, fontSize: 18, color: k.b }),
      text(one(c.main), {
        x: 50,
        y: 50,
        fontKey: f.display,
        fontSize: 8,
        color: k.paper,
        strokeWidth: 0.5,
        strokeColor: k.ink,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'ribbon-lower',
    label: 'Lower Third',
    group: 'Bold',
    en: { main: 'JANE DOE', sub: 'CREATIVE DIRECTOR', tail: '' },
    mm: { main: 'မမြင့်မြင့်', sub: 'ဖန်တီးမှုဒါရိုက်တာ', tail: '' },
    c: { a: '#facc15', b: '#111111', ink: '#111111', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.rect, 7, { x: 42, y: 62, fontSize: 5, color: k.b }),
      shape(P.rect, 0.5, { x: 12, y: 62, fontSize: 5, color: k.a }),
      text(one(c.main), {
        x: 44,
        y: 60,
        align: 'left',
        fontKey: f.body,
        fontWeight: 800,
        fontSize: 4.6,
        color: k.paper,
        lineHeight: lh(mm),
      }),
      text(c.sub, {
        x: 44,
        y: 67,
        align: 'left',
        fontKey: f.body,
        fontSize: 2.8,
        letterSpacing: 3,
        color: k.a,
      }),
    ],
  },
  {
    key: 'star-seal',
    label: 'Star Seal',
    group: 'Retro',
    en: { main: 'TOP PICK', sub: 'CHOSEN BY EDITORS', tail: '' },
    mm: { main: 'ရွေးချယ်မှု', sub: 'အယ်ဒီတာများရွေးချယ်', tail: '' },
    c: { a: '#dc2626', b: '#450a0a', ink: '#450a0a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.star, 1, { x: 50, y: 32, fontSize: 4.5, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 52,
        fontKey: f.display,
        fontSize: 10,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 68, fontKey: f.body, fontSize: 3, letterSpacing: 4, color: k.a }),
    ],
  },
  {
    key: 'burst-sale',
    label: 'Burst',
    group: 'Colorful',
    en: { main: 'SALE', sub: 'LIMITED TIME', tail: '50%' },
    mm: { main: 'လျှော့ဈေး', sub: 'အချိန်အကန့်အသတ်', tail: '၅၀%' },
    c: { a: '#ef4444', b: '#fde047', ink: '#111111', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.burst, 1, { x: 50, y: 44, fontSize: 14, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 42,
        fontKey: f.display,
        fontSize: 7,
        color: k.paper,
        lineHeight: lh(mm),
      }),
      text(c.tail, { x: 50, y: 52, fontKey: f.body, fontWeight: 800, fontSize: 4, color: k.b }),
      text(c.sub, { x: 50, y: 70, fontKey: f.body, fontSize: 3, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'ring-mono',
    label: 'Ring Mono',
    group: 'Minimal',
    en: { main: 'ORBIT', sub: 'A STUDY IN CIRCLES', tail: '' },
    mm: { main: 'လည်ပတ်', sub: 'စက်ဝိုင်းလေ့လာမှု', tail: '' },
    c: { a: '#334155', b: '#94a3b8', ink: '#0f172a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.ring, 1, { x: 50, y: 46, fontSize: 13, color: k.b }),
      text(one(c.main), {
        x: 50,
        y: 46,
        fontKey: f.body,
        fontWeight: 700,
        fontSize: 5,
        letterSpacing: 5,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 70, fontKey: f.body, fontSize: 2.8, letterSpacing: 4, color: k.a }),
    ],
  },
  {
    key: 'diamond-luxe',
    label: 'Diamond Luxe',
    group: 'Boxed',
    en: { main: 'LUXE', sub: 'FINE COLLECTION', tail: '' },
    mm: { main: 'ဇိမ်ခံ', sub: 'အထူးစုစည်းမှု', tail: '' },
    c: { a: '#0d0d0d', b: '#c9a84c', ink: '#0d0d0d', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.diamond, 1, { x: 50, y: 46, fontSize: 13, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 46,
        fontKey: f.serif,
        fontSize: 6.5,
        letterSpacing: 3,
        color: k.b,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 70, fontKey: f.body, fontSize: 2.8, letterSpacing: 5, color: k.a }),
    ],
  },
  {
    key: 'plus-grid',
    label: 'Plus Mark',
    group: 'Colorful',
    en: { main: 'ADD MORE', sub: 'EXTRA FEATURES', tail: '' },
    mm: { main: 'ထပ်ထည့်', sub: 'အပိုလုပ်ဆောင်ချက်', tail: '' },
    c: { a: '#06b6d4', b: '#a855f7', ink: '#0f172a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.plus, 1, { x: 22, y: 30, fontSize: 4, color: k.a }),
      shape(P.plus, 1, { x: 78, y: 66, fontSize: 4, color: k.b }),
      text(one(c.main), {
        x: 50,
        y: 48,
        fontKey: f.display,
        fontSize: 10,
        fillType: 'gradient',
        gradientFrom: k.a,
        gradientTo: k.b,
        gradientAngle: 90,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 62, fontKey: f.body, fontSize: 3, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'flag-mark',
    label: 'Flag Mark',
    group: 'Boxed',
    en: { main: 'FEATURED', sub: 'PICK OF THE WEEK', tail: '' },
    mm: { main: 'အထူးပြ', sub: 'အပတ်စဉ်ရွေးချယ်မှု', tail: '' },
    c: { a: '#1d4ed8', b: '#eff6ff', ink: '#0b1b3a', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.flag, 0.62, { x: 22, y: 40, fontSize: 10, color: k.a }),
      text(one(c.main), {
        x: 58,
        y: 44,
        align: 'left',
        fontKey: f.display,
        fontSize: 8,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, {
        x: 58,
        y: 58,
        align: 'left',
        fontKey: f.body,
        fontSize: 3,
        letterSpacing: 3,
        color: k.a,
      }),
    ],
  },
  {
    key: 'triangle-peak',
    label: 'Peak',
    group: 'Minimal',
    en: { main: 'SUMMIT', sub: 'REACH HIGHER', tail: '' },
    mm: { main: 'ထိပ်ဆုံး', sub: 'ပိုမိုမြင့်မားစွာ', tail: '' },
    c: { a: '#16a34a', b: '#052e16', ink: '#052e16', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.tri, 1.1, { x: 50, y: 32, fontSize: 8, color: k.a }),
      text(one(c.main), {
        x: 50,
        y: 55,
        fontKey: f.display,
        fontSize: 10,
        letterSpacing: 2,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 70, fontKey: f.body, fontSize: 3, letterSpacing: 5, color: k.a }),
    ],
  },
  {
    key: 'stacked-blocks',
    label: 'Stacked Blocks',
    group: 'Bold',
    en: { main: 'BUILD\nBETTER', sub: 'STEP BY STEP', tail: '' },
    mm: { main: 'ပိုကောင်း\nတည်ဆောက်', sub: 'တစ်ဆင့်ချင်း', tail: '' },
    c: { a: '#f97316', b: '#111111', ink: '#111111', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.rect, 8, { x: 42, y: 40, fontSize: 6, color: k.b }),
      shape(P.rect, 8, { x: 58, y: 56, fontSize: 6, color: k.a }),
      text(c.main.split('\n')[0], {
        x: 42,
        y: 40,
        fontKey: f.display,
        fontSize: 5.5,
        color: k.paper,
        lineHeight: lh(mm),
      }),
      text(c.main.split('\n')[1] ?? '', {
        x: 58,
        y: 56,
        fontKey: f.display,
        fontSize: 5.5,
        color: k.paper,
        lineHeight: lh(mm),
      }),
    ],
  },
  {
    key: 'ribbon-quote',
    label: 'Ribbon Quote',
    group: 'Retro',
    en: { main: 'STAY BOLD', sub: 'DAILY REMINDER', tail: '' },
    mm: { main: 'ရဲရင့်ပါ', sub: 'နေ့စဉ်သတိပေးချက်', tail: '' },
    c: { a: '#9333ea', b: '#faf5ff', ink: '#2e1065', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.ribbon, 3.4, { x: 50, y: 46, fontSize: 10, color: k.a }),
      text(one(c.main), {
        x: 52,
        y: 46,
        fontKey: f.serif,
        fontSize: 6.5,
        color: k.paper,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 66, fontKey: f.body, fontSize: 3, letterSpacing: 4, color: k.ink }),
    ],
  },
  {
    key: 'mono-caption',
    label: 'Mono Caption',
    group: 'Minimal',
    en: { main: 'FIELD NOTES', sub: 'ENTRY 014 / ARCHIVE', tail: '' },
    mm: { main: 'မှတ်စုများ', sub: 'မှတ်တမ်း ၀၁၄', tail: '' },
    c: { a: '#525252', b: '#171717', ink: '#171717', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      text(one(c.main), {
        x: 50,
        y: 48,
        fontKey: f.body,
        fontWeight: 600,
        fontSize: 6,
        letterSpacing: 2,
        color: k.ink,
        lineHeight: lh(mm),
      }),
      shape(P.rect, 40, { x: 50, y: 58, fontSize: 0.4, color: k.a }),
      text(c.sub, { x: 50, y: 64, fontKey: f.body, fontSize: 2.6, letterSpacing: 4, color: k.a }),
    ],
  },
  {
    key: 'sunrise-gradient',
    label: 'Sunrise',
    group: 'Colorful',
    en: { main: 'GOLDEN\nHOUR', sub: 'WARM LIGHT', tail: '' },
    mm: { main: 'ရွှေရောင်\nအချိန်', sub: 'နွေးထွေးအလင်း', tail: '' },
    c: { a: '#fb923c', b: '#db2777', ink: '#7c2d12', paper: '#ffffff' },
    make: (c, k, f, mm) => [
      shape(P.dot, 1, { x: 50, y: 42, fontSize: 13, color: k.a, opacity: 0.25 }),
      text(c.main, {
        x: 50,
        y: 44,
        fontKey: f.display,
        fontSize: 12,
        fillType: 'gradient',
        gradientFrom: k.a,
        gradientTo: k.b,
        gradientAngle: 140,
        lineHeight: lh(mm),
      }),
      text(c.sub, { x: 50, y: 68, fontKey: f.body, fontSize: 3.2, letterSpacing: 4, color: k.ink }),
    ],
  },
]

/** Upscale every template so type reads large on canvas, without overflowing. */
const TEXT_SCALE = 3
const TEXT_MAX = 34

function specsToLayers(specs: Spec[]): TextLayer[] {
  const texts = specs.filter((s) => s.kind === 'text') as Extract<Spec, { kind: 'text' }>[]
  const scale = fitScale(
    texts.map((s) => measurable({ ...s.o, text: s.text })),
    TEXT_SCALE,
    TEXT_MAX,
  )
  return specs.map((spec) => {
    if (spec.kind === 'shape') {
      const color = (spec.o.color as string) ?? '#000000'
      const base = createGraphicLayer(
        { kind: 'shape', src: shapeDataUrl(spec.path, color), aspect: spec.aspect },
        'Shape',
      )
      return { ...base, ...spec.o, color, fontSize: (spec.o.fontSize ?? 6) * scale }
    }
    const base = createTextLayer(spec.text)
    const size = Math.min((spec.o.fontSize ?? 6) * scale, TEXT_MAX)
    return { ...base, ...spec.o, fontSize: size, text: spec.text }
  })
}


function buildAll(): TemplateDef[] {
  const out: TemplateDef[] = []
  const langs: { lang: TemplateLang; fonts: Fonts; mm: boolean }[] = [
    { lang: 'EN', fonts: EN_FONT, mm: false },
    { lang: 'MM', fonts: MM_FONT, mm: true },
  ]
  langs.forEach(({ lang, fonts, mm }) => {
    DESIGNS.forEach((d) => {
      const copy = mm ? d.mm : d.en
      out.push({
        id: `${lang}-${d.key}`,
        name: d.label,
        lang,
        group: d.group,
        build: () => specsToLayers(d.make(copy, d.c, fonts, mm)),
      })
    })
  })
  return out
}

export const TEMPLATES: TemplateDef[] = [...PREMIUM_TEMPLATES, ...buildAll()]

export const TEMPLATE_GROUPS: string[] = ['All', 'Premium', 'Bold', 'Minimal', 'Boxed', 'Retro', 'Colorful']
