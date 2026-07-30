/**
 * Premium text-effect templates.
 * Each one is a layered "graphic style" composition (3D extrude + hard outline +
 * offset shadow) sitting on a generated photographic / poster background.
 * Every design exists in both English and Myanmar with its own typeface.
 */
import { createTextLayer, type TextLayer } from '@/lib/text-layer'
import { fitScale, measurable } from '@/lib/template-fit'


import bgBlueRays from '@/assets/templates/bg-blue-rays.jpg'
import bgYellowPop from '@/assets/templates/bg-yellow-pop.jpg'
import bgConcrete from '@/assets/templates/bg-concrete.jpg'
import bgBeach from '@/assets/templates/bg-beach.jpg'
import bgNeonCity from '@/assets/templates/bg-neon-city.jpg'
import bgPastelSky from '@/assets/templates/bg-pastel-sky.jpg'
import bgStadium from '@/assets/templates/bg-stadium.jpg'
import bgGoldBokeh from '@/assets/templates/bg-gold-bokeh.jpg'

export interface PremiumDesign {
  key: string
  label: string
  bg: string
  en: { main: string; sub: string; font: string; subFont: string }
  mm: { main: string; sub: string; font: string; subFont: string }
  /** main headline styling */
  main: Partial<TextLayer>
  /** caption styling */
  sub: Partial<TextLayer>
}

export const PREMIUM_DESIGNS: PremiumDesign[] = [
  {
    key: 'goal-blast',
    label: 'Goal Blast',
    bg: bgBlueRays,
    en: { main: 'GOAL!', sub: 'MATCH DAY HIGHLIGHT', font: 'mochi-boom-extrude', subFont: 'montserrat' },
    mm: { main: 'ဂိုး ဝင်!', sub: 'ပွဲစဉ်အထူးအစီအစဉ်', font: 'myanmarsquare', subFont: 'layaungthit-k26' },
    main: {
      x: 50, y: 44, fontSize: 15, color: '#ffffff',
      strokeWidth: 1.6, strokeColor: '#0b1b3a',
      depthOn: true, depth: 14, depthColor: '#f25c05', depthDarken: 0.35,
      shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 12, shadowOffsetX: 4, shadowOffsetY: 8,
    },
    sub: { x: 50, y: 70, fontSize: 3.4, letterSpacing: 5, color: '#ffffff', fontWeight: 700 },
  },
  {
    key: 'oops-pop',
    label: 'Oops Pop',
    bg: bgYellowPop,
    en: { main: 'OOPS!', sub: 'COMIC TEXT EFFECT', font: 'mochi-boom', subFont: 'montserrat' },
    mm: { main: 'အိုး!', sub: 'ကာတွန်းစာလုံးအထူး', font: 'myanmarsabae', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 17, color: '#ffd400',
      strokeWidth: 1.8, strokeColor: '#14203d',
      depthOn: true, depth: 10, depthColor: '#14203d', depthDarken: 0.1,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: { x: 50, y: 72, fontSize: 3.2, letterSpacing: 6, color: '#14203d', fontWeight: 800 },
  },
  {
    key: 'whoosh-speed',
    label: 'Whoosh',
    bg: bgYellowPop,
    en: { main: 'WHOOSH', sub: 'FULLY EDITABLE', font: 'the-last-trunks', subFont: 'oswald' },
    mm: { main: 'ဝှုန်း', sub: 'အပြည့်အဝ ပြင်နိုင်', font: 'koz033', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 46, fontSize: 12, color: '#14203d',
      strokeWidth: 1.2, strokeColor: '#ffffff',
      depthOn: true, depth: 8, depthColor: '#ffffff', depthDarken: 0.05,
      rotation: -3,
      shadowColor: 'rgba(0,0,0,0.35)', shadowBlur: 10, shadowOffsetX: 3, shadowOffsetY: 6,
    },
    sub: { x: 50, y: 73, fontSize: 3, letterSpacing: 6, color: '#14203d', fontWeight: 700 },
  },
  {
    key: 'spoof-sticker',
    label: 'Spoof Sticker',
    bg: bgPastelSky,
    en: { main: 'SPOOF', sub: 'STICKER STYLE', font: 'milkyway', subFont: 'poppins' },
    mm: { main: 'ဟာသ', sub: 'စတစ်ကာ ပုံစံ', font: 'myanmargantgaw', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 46, fontSize: 14, color: '#ffffff',
      strokeWidth: 2.2, strokeColor: '#2b2350',
      depthOn: true, depth: 9, depthColor: '#8ad6b3', depthDarken: 0.2,
      shadowColor: 'rgba(43,35,80,0.25)', shadowBlur: 14, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: { x: 50, y: 72, fontSize: 3.2, letterSpacing: 5, color: '#2b2350', fontWeight: 700 },
  },
  {
    key: 'swoosh-gradient',
    label: 'Swoosh',
    bg: bgConcrete,
    en: { main: 'SWOOSH', sub: 'WORDS CAN BE CHANGED', font: 'moldie', subFont: 'montserrat' },
    mm: { main: 'လွှင့်', sub: 'စာသားပြောင်းနိုင်သည်', font: 'abrush', subFont: 'layaungthit-k48' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#fdf3ef',
      strokeWidth: 1.4, strokeColor: '#0d1b34',
      depthOn: true, depth: 11, depthColor: '#e94f6a', depthDarken: 0.25,
      shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 10,
    },
    sub: { x: 50, y: 71, fontSize: 3, letterSpacing: 5, color: '#f3d9e2', fontWeight: 600 },
  },
  {
    key: 'stylish-script',
    label: 'Stylish Script',
    bg: bgBlueRays,
    en: { main: 'Stylish', sub: 'IN GRAPHIC STYLE PANEL', font: 'gladolia', subFont: 'montserrat' },
    mm: { main: 'ဆန်းပြား', sub: 'ဒီဇိုင်းစတိုင်အထူး', font: 'myanmaryinmar', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 45, fontSize: 16, color: '#ffffff',
      strokeWidth: 2, strokeColor: '#111111',
      depthOn: true, depth: 10, depthColor: '#111111', depthDarken: 0.1,
      rotation: -4,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 16, shadowOffsetX: 6, shadowOffsetY: 10,
    },
    sub: { x: 50, y: 74, fontSize: 3.2, letterSpacing: 5, color: '#ffffff', fontWeight: 600 },
  },
  {
    key: 'summer-beach',
    label: 'Summer',
    bg: bgBeach,
    en: { main: 'SUMMER', sub: 'GOLDEN HOUR EDITION', font: 'beachday', subFont: 'poppins' },
    mm: { main: 'နွေရာသီ', sub: 'ရွှေရောင်အချိန်', font: 'layaungthit-k16', subFont: 'layaungthit-k57' },
    main: {
      x: 50, y: 44, fontSize: 14, color: '#fff6e0',
      strokeWidth: 1.2, strokeColor: '#7a3b00',
      depthOn: true, depth: 9, depthColor: '#ff9c2b', depthDarken: 0.3,
      shadowColor: 'rgba(60,20,0,0.45)', shadowBlur: 16, shadowOffsetX: 2, shadowOffsetY: 8,
    },
    sub: { x: 50, y: 70, fontSize: 3.2, letterSpacing: 6, color: '#fff1d6', fontWeight: 600 },
  },
  {
    key: 'neon-glow',
    label: 'Neon Glow',
    bg: bgNeonCity,
    en: { main: 'MIDNIGHT', sub: 'CITY LIGHTS', font: 'the-last-trunks', subFont: 'oswald' },
    mm: { main: 'သန်းခေါင်', sub: 'မြို့ပြအလင်းများ', font: 'koz008', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 44, fontSize: 11, color: '#ffffff',
      strokeWidth: 0.6, strokeColor: '#ff2bd1',
      shadowColor: '#22d3ee', shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
      letterSpacing: 2,
    },
    sub: { x: 50, y: 66, fontSize: 3, letterSpacing: 8, color: '#22d3ee', fontWeight: 600 },
  },
  {
    key: 'champion',
    label: 'Champion',
    bg: bgStadium,
    en: { main: 'CHAMPION', sub: 'SEASON 2026', font: 'mochi-boom-extrude', subFont: 'oswald' },
    mm: { main: 'ချန်ပီယံ', sub: 'ရာသီ ၂၀၂၆', font: 'myanmarkuttar', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 42, fontSize: 10, color: '#ffe57a',
      strokeWidth: 1.3, strokeColor: '#2b1a00',
      depthOn: true, depth: 12, depthColor: '#b8860b', depthDarken: 0.35,
      shadowColor: 'rgba(0,0,0,0.55)', shadowBlur: 20, shadowOffsetX: 0, shadowOffsetY: 10,
    },
    sub: { x: 50, y: 62, fontSize: 3.2, letterSpacing: 7, color: '#ffffff', fontWeight: 700 },
  },
  {
    key: 'golden-party',
    label: 'Golden Party',
    bg: bgGoldBokeh,
    en: { main: 'CELEBRATE', sub: 'A NIGHT TO REMEMBER', font: 'talina', subFont: 'playfair' },
    mm: { main: 'ဂုဏ်ပြုပွဲ', sub: 'မမေ့နိုင်သောညတစ်ည', font: 'myanmaryinmar', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#ffd98a',
      strokeWidth: 0.8, strokeColor: '#3a1f00',
      fillType: 'gradient', gradientFrom: '#ffe9b0', gradientTo: '#e0952a', gradientAngle: 120,
      shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 22, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: { x: 50, y: 70, fontSize: 3, letterSpacing: 6, color: '#ffe6bd', fontWeight: 500 },
  },
  {
    key: 'candy-kids',
    label: 'Candy Kids',
    bg: bgPastelSky,
    en: { main: 'HELLO!', sub: 'SWEET & PLAYFUL', font: 'child-hood', subFont: 'poppins' },
    mm: { main: 'မင်္ဂလာပါ', sub: 'ချိုမြိန်ပျော်ရွှင်', font: 'myanmargantgaw', subFont: 'layaungthit-k6' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ff7fae',
      strokeWidth: 2, strokeColor: '#ffffff',
      depthOn: true, depth: 8, depthColor: '#7ac6ff', depthDarken: 0.15,
      shadowColor: 'rgba(90,60,120,0.28)', shadowBlur: 14, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: { x: 50, y: 71, fontSize: 3.2, letterSpacing: 5, color: '#5b4a7a', fontWeight: 700 },
  },
  {
    key: 'street-bold',
    label: 'Street Bold',
    bg: bgConcrete,
    en: { main: 'STREET', sub: 'URBAN TYPE SERIES', font: 'molen-friend', subFont: 'oswald' },
    mm: { main: 'လမ်းမ', sub: 'မြို့ပြစာလုံးစီးရီး', font: 'koz052', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 44, fontSize: 13, color: '#f5f5f5',
      strokeWidth: 1.5, strokeColor: '#000000',
      depthOn: true, depth: 13, depthColor: '#3b82f6', depthDarken: 0.4,
      rotation: -2,
      shadowColor: 'rgba(0,0,0,0.6)', shadowBlur: 18, shadowOffsetX: 4, shadowOffsetY: 10,
    },
    sub: { x: 50, y: 70, fontSize: 3, letterSpacing: 7, color: '#93c5fd', fontWeight: 700 },
  },
]

/** Global headline/caption upscale, capped so type stays inside the canvas. */
const MAIN_SCALE = 3
const MAIN_MAX = 34
const SUB_MAX = 12

function build(d: PremiumDesign, mm: boolean): TextLayer[] {
  const copy = mm ? d.mm : d.en
  const head = createTextLayer(copy.main)
  const cap = createTextLayer(copy.sub)
  const headLh = mm ? 1.5 : 1.05
  const capLh = mm ? 1.5 : 1.2
  const scale = fitScale(
    [
      measurable({ ...d.main, text: copy.main, lineHeight: headLh }),
      measurable({ ...d.sub, text: copy.sub, lineHeight: capLh }),
    ],
    MAIN_SCALE,
    MAIN_MAX,
  )
  const mainSize = Math.min((d.main.fontSize ?? 12) * scale, MAIN_MAX)
  const subSize = Math.min((d.sub.fontSize ?? 3) * scale, SUB_MAX)
  return [
    {
      ...head,
      ...d.main,
      fontSize: mainSize,
      text: copy.main,
      fontKey: copy.font,
      lineHeight: headLh,
    },
    {
      ...cap,
      ...d.sub,
      fontSize: subSize,
      text: copy.sub,
      fontKey: copy.subFont,
      lineHeight: capLh,
    },
  ]
}


export const PREMIUM_TEMPLATES = PREMIUM_DESIGNS.flatMap((d) => [
  {
    id: `EN-premium-${d.key}`,
    name: d.label,
    lang: 'EN' as const,
    group: 'Premium',
    bg: d.bg,
    build: () => build(d, false),
  },
  {
    id: `MM-premium-${d.key}`,
    name: d.label,
    lang: 'MM' as const,
    group: 'Premium',
    bg: d.bg,
    build: () => build(d, true),
  },
])
