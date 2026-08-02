/**
 * 50 Burmese logo templates (square compositions).
 * Each design uses a typeface from the Premium font download page
 * (`rf:` keys → jsDelivr /Fonts), so previews load the real face.
 */
import { createGraphicLayer, createTextLayer, type TextLayer } from '@/lib/text-layer'
import { shapeDataUrl } from '@/lib/shapes'
import type { TemplateDef } from '@/lib/templates'

const FONTS: string[] = [
  "Aka011 Regular",,
  "Aka03 Regular",,
  "Aka05 Regular",,
  "Aka06 Regular",,
  "Aka08 Regular",,
  "Aka09 Regular",,
  "BurmaArt007Uni Regular",,
  "MasterpieceCTL",,
  "MasterpieceDaung",,
  "MasterpieceDaungRound",,
  "MasterpieceLakwel",,
  "MasterpieceSpringRev",,
  "MasterpieceStadium",,
  "MasterpieceUniHand",,
  "MasterpieceUniType",,
  "MasterpieceYayChanZin",,
  "OneTypeChiangMai",,
  "OneTypeMMDot",,
  "SM01 WaTokeLay Regular",,
  "SM02 KanBaung Regular",,
  "SM03 KaWai Regular",,
  "SM04 Moon Regular",,
  "SM06 LaikPyar Regular",,
  "SM06 LaikPyar Straight",,
  "SM07 Virus Regular",,
  "SM08 AntiVirus Regular",,
  "SM09 BeeZee Regular.otf",,
  "Thit Sar Shwe Si",,
  "ThitSarShweSi",
]

const PAL: { a: string; ink: string; paper: string }[] = [
  { a: "#e8323c", ink: "#111111", paper: "#ffffff" },
  { a: "#0f766e", ink: "#053b36", paper: "#ffffff" },
  { a: "#2f6fed", ink: "#0b1b3a", paper: "#ffffff" },
  { a: "#f5b301", ink: "#2b2200", paper: "#ffffff" },
  { a: "#7c3aed", ink: "#1b0f3a", paper: "#ffffff" },
  { a: "#db2777", ink: "#3b0722", paper: "#ffffff" },
  { a: "#059669", ink: "#04281c", paper: "#ffffff" },
  { a: "#ea580c", ink: "#3a1602", paper: "#ffffff" },
  { a: "#0891b2", ink: "#062b33", paper: "#ffffff" },
  { a: "#b45309", ink: "#33200a", paper: "#ffffff" },
]

const SHAPES = {
  dot: 'M50,50m-46,0a46,46 0 1,0 92,0a46,46 0 1,0 -92,0',
  ring: 'M50,50m-46,0a46,46 0 1,0 92,0a46,46 0 1,0 -92,0ZM50,50m-38,0a38,38 0 1,1 76,0a38,38 0 1,1 -76,0',
  hex: 'M25,4H75L100,50L75,96H25L0,50Z',
  diamond: 'M50,2L98,50L50,98L2,50Z',
  tape: 'M0,18H100V82H0Z',
  arch: 'M0,100V44A50,44 0 0 1 100,44V100Z',
  frame: 'M0,0H100V100H0ZM6,6V94H94V6Z',
  rule: 'M0,0H100V100H0Z',
}

interface Row {
  n: string
  s: string
  f: number
  p: number
  l: number
}

const ROWS: Row[] = [
{ n: "ရွှေမြို့တော်", s: "ကော်ဖီဆိုင်", f: 0, p: 0, l: 0 },
  { n: "မိုးပြာ", s: "ဒီဇိုင်းစတူဒီယို", f: 1, p: 1, l: 1 },
  { n: "နေခြည်", s: "ဓာတ်ပုံလုပ်ငန်း", f: 2, p: 2, l: 2 },
  { n: "ပန်းအိမ်", s: "ပန်းခြံဆိုင်", f: 3, p: 3, l: 3 },
  { n: "စိန်ရတု", s: "ရွှေဆိုင်", f: 4, p: 4, l: 4 },
  { n: "ရေစင်", s: "ရေသန့်စက်ရုံ", f: 5, p: 5, l: 5 },
  { n: "မြေလတ်", s: "စိုက်ပျိုးရေး", f: 6, p: 6, l: 6 },
  { n: "လမင်း", s: "ည စားသောက်ဆိုင်", f: 7, p: 7, l: 7 },
  { n: "ကြယ်စင်", s: "ပညာရေးဌာန", f: 8, p: 8, l: 0 },
  { n: "အောင်မြေ", s: "ဆောက်လုပ်ရေး", f: 9, p: 9, l: 1 },
  { n: "သဇင်", s: "အလှကုန်", f: 10, p: 0, l: 2 },
  { n: "ရတနာ", s: "ကျောက်မျက်", f: 11, p: 1, l: 3 },
  { n: "မြတ်နိုးမှု", s: "လက်ဖက်ရည်ဆိုင်", f: 12, p: 2, l: 4 },
  { n: "နွေဦး", s: "အဝတ်အထည်", f: 13, p: 3, l: 5 },
  { n: "ဟိန်းလင်း", s: "အသံစနစ်", f: 14, p: 4, l: 6 },
  { n: "ပိုးအိမ်", s: "ရိုးရာထည်", f: 15, p: 5, l: 7 },
  { n: "မိုးဇာ", s: "ဂီတသင်တန်း", f: 16, p: 6, l: 0 },
  { n: "ရွှေရည်", s: "ရေခဲမုန့်", f: 17, p: 7, l: 1 },
  { n: "ပြည့်စုံ", s: "ကုန်စုံဆိုင်", f: 18, p: 8, l: 2 },
  { n: "သီရိ", s: "ဟိုတယ်", f: 19, p: 9, l: 3 },
  { n: "ဗမာ့ဟင်း", s: "ရိုးရာမီးဖို", f: 20, p: 0, l: 4 },
  { n: "ကံ့ကော်", s: "စာပေတိုက်", f: 21, p: 1, l: 5 },
  { n: "နဂါးနီ", s: "အားကစား", f: 22, p: 2, l: 6 },
  { n: "ဧရာ", s: "ခရီးသွားလုပ်ငန်း", f: 23, p: 3, l: 7 },
  { n: "စမ်းရေ", s: "ကျန်းမာရေး", f: 24, p: 4, l: 0 },
  { n: "ရိပ်သာ", s: "အနားယူစခန်း", f: 25, p: 5, l: 1 },
  { n: "မိုးရေစက်", s: "ဓာတ်ပုံပညာ", f: 26, p: 6, l: 2 },
  { n: "ရွှေပြည်", s: "ဈေးဝယ်စင်တာ", f: 27, p: 7, l: 3 },
  { n: "ခိုင်မာ", s: "အင်ဂျင်နီယာ", f: 28, p: 8, l: 4 },
  { n: "နှင်းဆီ", s: "ပန်းအလှဆင်", f: 0, p: 9, l: 5 },
  { n: "မြင့်မိုရ်", s: "ဗိသုကာ", f: 1, p: 0, l: 6 },
  { n: "သဲသောင်", s: "ကမ်းခြေဟိုတယ်", f: 2, p: 1, l: 7 },
  { n: "မီးအိမ်", s: "လျှပ်စစ်ပစ္စည်း", f: 3, p: 2, l: 0 },
  { n: "ရွက်လွှင့်", s: "ခရီးဆောင်အိတ်", f: 4, p: 3, l: 1 },
  { n: "ပုလဲ", s: "ဖက်ရှင်", f: 5, p: 4, l: 2 },
  { n: "မြသီရိ", s: "မိသားစုဆေးခန်း", f: 6, p: 5, l: 3 },
  { n: "ဇွဲကပင်", s: "လေ့ကျင့်ရေးခန်းမ", f: 7, p: 6, l: 4 },
  { n: "စိမ်းလန်း", s: "သဘာဝထွက်ကုန်", f: 8, p: 7, l: 5 },
  { n: "ရွှေဝါ", s: "ဆန်စက်", f: 9, p: 8, l: 6 },
  { n: "နတ်မောက်", s: "ရိုးရာအစားအစာ", f: 10, p: 9, l: 7 },
  { n: "မြစ်ဆုံ", s: "သယ်ယူပို့ဆောင်", f: 11, p: 0, l: 0 },
  { n: "ရေကြည်", s: "အအေးဆိုင်", f: 12, p: 1, l: 1 },
  { n: "ထွန်းလင်း", s: "ပုံနှိပ်တိုက်", f: 13, p: 2, l: 2 },
  { n: "မြဝတီ", s: "မီဒီယာ", f: 14, p: 3, l: 3 },
  { n: "ချယ်ရီ", s: "ကိတ်မုန့်ဆိုင်", f: 15, p: 4, l: 4 },
  { n: "ပညာရိပ်", s: "စာကြည့်တိုက်", f: 16, p: 5, l: 5 },
  { n: "ဆည်းဆာ", s: "ဓာတ်ပုံရုံ", f: 17, p: 6, l: 6 },
  { n: "ရွှေလမင်း", s: "လက်ဝတ်ရတနာ", f: 18, p: 7, l: 7 },
  { n: "ခိုင်ရွှေဝါ", s: "အထည်ချုပ်", f: 19, p: 8, l: 0 },
  { n: "မိုးနတ်", s: "နည်းပညာ", f: 20, p: 9, l: 1 },
]

let seq = 0
function T(text: string, o: Partial<TextLayer>): TextLayer {
  seq += 1
  return { ...createTextLayer(text), id: `logo-t-${Date.now()}-${seq}`, ...o }
}

function S(path: string, aspect: number, o: Partial<TextLayer>): TextLayer {
  seq += 1
  const color = o.color ?? '#000000'
  const outline = Boolean(o.graphic?.outline)
  return {
    ...createGraphicLayer({
      kind: 'shape',
      src: shapeDataUrl(path, color, outline, 6),
      aspect,
      path,
      outline,
      strokeWidth: 6,
      strokeColor: color,
    }),
    id: `logo-s-${Date.now()}-${seq}`,
    ...o,
    color,
  }
}

function build(r: Row): TextLayer[] {
  const f = `rf:${FONTS[r.f % FONTS.length]}`
  const k = PAL[r.p % PAL.length]
  const name = r.n
  const sub = r.s

  switch (r.l) {
    case 0: // solid disc mark
      return [
        S(SHAPES.dot, 1, { x: 50, y: 41, fontSize: 34, color: k.a }),
        T(name, { x: 50, y: 41, fontKey: f, fontSize: 9, color: k.paper, lineHeight: 1.4 }),
        T(sub, { x: 50, y: 66, fontKey: f, fontSize: 3.4, letterSpacing: 3, color: k.ink }),
      ]
    case 1: // outlined ring badge
      return [
        S(SHAPES.ring, 1, { x: 50, y: 44, fontSize: 40, color: k.a }),
        T(name, { x: 50, y: 44, fontKey: f, fontSize: 8.5, color: k.ink, lineHeight: 1.4 }),
        T(sub, { x: 50, y: 74, fontKey: f, fontSize: 3.2, letterSpacing: 4, color: k.a }),
      ]
    case 2: // hexagon emblem
      return [
        S(SHAPES.hex, 1.1, { x: 50, y: 40, fontSize: 32, color: k.a }),
        T(name, { x: 50, y: 40, fontKey: f, fontSize: 8, color: k.paper, lineHeight: 1.4 }),
        S(SHAPES.rule, 40, { x: 50, y: 60, fontSize: 0.8, color: k.ink }),
        T(sub, { x: 50, y: 68, fontKey: f, fontSize: 3.4, letterSpacing: 2, color: k.ink }),
      ]
    case 3: // tape banner
      return [
        S(SHAPES.tape, 5, { x: 50, y: 46, fontSize: 12, color: k.a }),
        T(name, { x: 50, y: 46, fontKey: f, fontSize: 10, color: k.paper, lineHeight: 1.35 }),
        T(sub, { x: 50, y: 64, fontKey: f, fontSize: 3.4, letterSpacing: 3, color: k.ink }),
      ]
    case 4: // minimal rule
      return [
        T(name, { x: 50, y: 43, fontKey: f, fontSize: 12, color: k.ink, lineHeight: 1.3 }),
        S(SHAPES.rule, 24, { x: 50, y: 56, fontSize: 0.7, color: k.a }),
        T(sub, { x: 50, y: 64, fontKey: f, fontSize: 3.6, letterSpacing: 5, color: k.a }),
      ]
    case 5: // gradient fill
      return [
        T(name, {
          x: 50,
          y: 45,
          fontKey: f,
          fontSize: 13,
          lineHeight: 1.3,
          fillType: 'gradient',
          gradientFrom: k.a,
          gradientTo: k.ink,
          gradientAngle: 45,
          shadowColor: 'rgba(0,0,0,0.25)',
          shadowBlur: 14,
          shadowOffsetY: 7,
        }),
        T(sub, { x: 50, y: 64, fontKey: f, fontSize: 3.4, letterSpacing: 4, color: k.ink }),
      ]
    case 6: // outline type + dot
      return [
        S(SHAPES.dot, 1, { x: 50, y: 27, fontSize: 8, color: k.a }),
        T(name, {
          x: 50,
          y: 47,
          fontKey: f,
          fontSize: 12,
          color: 'transparent',
          strokeWidth: 1.6,
          strokeColor: k.ink,
          lineHeight: 1.3,
        }),
        T(sub, { x: 50, y: 66, fontKey: f, fontSize: 3.3, letterSpacing: 4, color: k.ink }),
      ]
    default: // 3D extrude inside a frame
      return [
        S(SHAPES.frame, 1, { x: 50, y: 50, fontSize: 46, color: k.a }),
        T(name, {
          x: 50,
          y: 46,
          fontKey: f,
          fontSize: 11,
          color: k.paper,
          strokeWidth: 1.4,
          strokeColor: k.ink,
          lineHeight: 1.3,
          depthOn: true,
          depth: 7,
          depthColor: k.a,
          depthDarken: 0.15,
        }),
        T(sub, { x: 50, y: 65, fontKey: f, fontSize: 3.2, letterSpacing: 3, color: k.ink }),
      ]
  }
}

/** `rf:` font keys used by the logo pack — preload these for previews. */
export const LOGO_FONT_KEYS = FONTS.map((n) => `rf:${n}`)

export const LOGO_TEMPLATES: TemplateDef[] = ROWS.map((r, i) => ({
  id: `mm-logo-${i + 1}`,
  name: `${r.n} — ${r.s}`,
  lang: 'MM' as const,
  group: 'Logo',
  build: () => build(r),
}))
