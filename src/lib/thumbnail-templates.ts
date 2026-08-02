/**
 * 50 Myanmar YouTube thumbnail templates (16:9).
 * Every design pairs a unique AI-generated background with a different
 * premium Burmese typeface from the font store (`rf:` keys).
 */
import { createTextLayer, type TextLayer } from '@/lib/text-layer'
import type { TemplateDef } from '@/lib/templates'

import bg01 from "@/assets/thumbs/thumb01.jpg.asset.json"
import bg02 from "@/assets/thumbs/thumb02.jpg.asset.json"
import bg03 from "@/assets/thumbs/thumb03.jpg.asset.json"
import bg04 from "@/assets/thumbs/thumb04.jpg.asset.json"
import bg05 from "@/assets/thumbs/thumb05.jpg.asset.json"
import bg06 from "@/assets/thumbs/thumb06.jpg.asset.json"
import bg07 from "@/assets/thumbs/thumb07.jpg.asset.json"
import bg08 from "@/assets/thumbs/thumb08.jpg.asset.json"
import bg09 from "@/assets/thumbs/thumb09.jpg.asset.json"
import bg10 from "@/assets/thumbs/thumb10.jpg.asset.json"
import bg11 from "@/assets/thumbs/thumb11.jpg.asset.json"
import bg12 from "@/assets/thumbs/thumb12.jpg.asset.json"
import bg13 from "@/assets/thumbs/thumb13.jpg.asset.json"
import bg14 from "@/assets/thumbs/thumb14.jpg.asset.json"
import bg15 from "@/assets/thumbs/thumb15.jpg.asset.json"
import bg16 from "@/assets/thumbs/thumb16.jpg.asset.json"
import bg17 from "@/assets/thumbs/thumb17.jpg.asset.json"
import bg18 from "@/assets/thumbs/thumb18.jpg.asset.json"
import bg19 from "@/assets/thumbs/thumb19.jpg.asset.json"
import bg20 from "@/assets/thumbs/thumb20.jpg.asset.json"
import bg21 from "@/assets/thumbs/thumb21.jpg.asset.json"
import bg22 from "@/assets/thumbs/thumb22.jpg.asset.json"
import bg23 from "@/assets/thumbs/thumb23.jpg.asset.json"
import bg24 from "@/assets/thumbs/thumb24.jpg.asset.json"
import bg25 from "@/assets/thumbs/thumb25.jpg.asset.json"
import bg26 from "@/assets/thumbs/thumb26.jpg.asset.json"
import bg27 from "@/assets/thumbs/thumb27.jpg.asset.json"
import bg28 from "@/assets/thumbs/thumb28.jpg.asset.json"
import bg29 from "@/assets/thumbs/thumb29.jpg.asset.json"
import bg30 from "@/assets/thumbs/thumb30.jpg.asset.json"
import bg31 from "@/assets/thumbs/thumb31.jpg.asset.json"
import bg32 from "@/assets/thumbs/thumb32.jpg.asset.json"
import bg33 from "@/assets/thumbs/thumb33.jpg.asset.json"
import bg34 from "@/assets/thumbs/thumb34.jpg.asset.json"
import bg35 from "@/assets/thumbs/thumb35.jpg.asset.json"
import bg36 from "@/assets/thumbs/thumb36.jpg.asset.json"
import bg37 from "@/assets/thumbs/thumb37.jpg.asset.json"
import bg38 from "@/assets/thumbs/thumb38.jpg.asset.json"
import bg39 from "@/assets/thumbs/thumb39.jpg.asset.json"
import bg40 from "@/assets/thumbs/thumb40.jpg.asset.json"
import bg41 from "@/assets/thumbs/thumb41.jpg.asset.json"
import bg42 from "@/assets/thumbs/thumb42.jpg.asset.json"
import bg43 from "@/assets/thumbs/thumb43.jpg.asset.json"
import bg44 from "@/assets/thumbs/thumb44.jpg.asset.json"
import bg45 from "@/assets/thumbs/thumb45.jpg.asset.json"
import bg46 from "@/assets/thumbs/thumb46.jpg.asset.json"
import bg47 from "@/assets/thumbs/thumb47.jpg.asset.json"
import bg48 from "@/assets/thumbs/thumb48.jpg.asset.json"
import bg49 from "@/assets/thumbs/thumb49.jpg.asset.json"
import bg50 from "@/assets/thumbs/thumb50.jpg.asset.json"

const FONTS: string[] = [
  "Aka011 Regular",
  "Aka03 Regular",
  "Aka05 Regular",
  "Aka06 Regular",
  "Aka08 Regular",
  "Aka09 Regular",
  "BurmaArt007Uni Regular",
  "MasterpieceCTL",
  "MasterpieceDaung",
  "MasterpieceDaungRound",
  "MasterpieceLakwel",
  "MasterpieceSpringRev",
  "MasterpieceStadium",
  "MasterpieceUniHand",
  "MasterpieceUniType",
  "MasterpieceYayChanZin",
  "OneTypeChiangMai",
  "OneTypeMMDot",
  "SM01 WaTokeLay Regular",
  "SM02 KanBaung Regular",
  "SM03 KaWai Regular",
  "SM04 Moon Regular",
  "SM06 LaikPyar Regular",
  "SM06 LaikPyar Straight",
  "SM07 Virus Regular",
  "SM08 AntiVirus Regular",
  "SM09 BeeZee Regular.otf",
  "Thit Sar Shwe Si",
  "ThitSarShweSi",
]

const PAL: { fill: string; stroke: string; accent: string }[] = [
  { fill: "#ffffff", stroke: "#111111", accent: "#ffd400" },
  { fill: "#fff200", stroke: "#1a1a1a", accent: "#ff2d55" },
  { fill: "#ffffff", stroke: "#0b2a4a", accent: "#00e0ff" },
  { fill: "#ffe9a8", stroke: "#3a1a00", accent: "#ff7a18" },
  { fill: "#ffffff", stroke: "#2b0038", accent: "#c084fc" },
  { fill: "#ffffff", stroke: "#111111", accent: "#22c55e" },
  { fill: "#ffffff", stroke: "#3a0010", accent: "#ff3b30" },
  { fill: "#e6fbff", stroke: "#00303d", accent: "#00c2ff" },
  { fill: "#fff7d6", stroke: "#231a00", accent: "#f5b301" },
  { fill: "#ffffff", stroke: "#001b12", accent: "#00ffa3" },
]

interface Row {
  m: string
  s: string
  f: number
  p: number
  l: number
  bg: string
}

const ROWS: Row[] = [
  { m: "မနက်ခင်း ခရီး", s: "တောင်တန်းခရီးစဉ်", f: 0, p: 0, l: 0, bg: bg01.url },
  { m: "ရွှေတိဂုံ", s: "ဘုရားဖူးခရီး", f: 1, p: 1, l: 1, bg: bg02.url },
  { m: "ညစျေး", s: "စားစရာ ၁၀ မျိုး", f: 2, p: 2, l: 2, bg: bg03.url },
  { m: "စတူဒီယို", s: "အကြံပြုချက်", f: 3, p: 3, l: 3, bg: bg04.url },
  { m: "မိုးရာသီ", s: "လယ်ယာဘဝ", f: 4, p: 4, l: 4, bg: bg05.url },
  { m: "အသစ်", s: "ဒီဇိုင်းနည်းလမ်း", f: 5, p: 5, l: 0, bg: bg06.url },
  { m: "ဂိမ်းကစား", s: "အနိုင်ရနည်း", f: 6, p: 6, l: 1, bg: bg07.url },
  { m: "ကမ်းခြေ", s: "အပန်းဖြေခရီး", f: 7, p: 7, l: 2, bg: bg08.url },
  { m: "ပုဂံ", s: "သမိုင်းလမ်း", f: 8, p: 8, l: 3, bg: bg09.url },
  { m: "မြို့တော်ည", s: "လမ်းလျှောက်", f: 9, p: 9, l: 4, bg: bg10.url },
  { m: "ကော်ဖီ", s: "ဖျော်နည်းများ", f: 10, p: 0, l: 0, bg: bg11.url },
  { m: "ဘောလုံးပွဲ", s: "အကြိုသုံးသပ်ချက်", f: 11, p: 1, l: 1, bg: bg12.url },
  { m: "အထူးပြုလုပ်", s: "ဗီဒီယိုအသစ်", f: 12, p: 2, l: 2, bg: bg13.url },
  { m: "သဘာဝ", s: "ခရီးထွက်", f: 13, p: 3, l: 3, bg: bg14.url },
  { m: "ချက်ပြုတ်နည်း", s: "အလွယ်ဆုံး", f: 14, p: 4, l: 4, bg: bg15.url },
  { m: "နည်းပညာ", s: "သုံးသပ်ချက်", f: 15, p: 5, l: 0, bg: bg16.url },
  { m: "ရိုးရာ", s: "အမှတ်တရ", f: 16, p: 6, l: 1, bg: bg17.url },
  { m: "ရေတံခွန်", s: "ခရီးစဉ်", f: 17, p: 7, l: 2, bg: bg18.url },
  { m: "ဆိုင်ကယ်", s: "လမ်းခရီး", f: 18, p: 8, l: 3, bg: bg19.url },
  { m: "မိုးရွာည", s: "စကားဝိုင်း", f: 19, p: 9, l: 4, bg: bg20.url },
  { m: "ကြယ်စင်ည", s: "ဓာတ်ပုံရိုက်နည်း", f: 20, p: 0, l: 0, bg: bg21.url },
  { m: "ရွှေရောင်", s: "အထူးအစီအစဉ်", f: 21, p: 1, l: 1, bg: bg22.url },
  { m: "သဲကန္တာရ", s: "စွန့်စားခန်း", f: 22, p: 2, l: 2, bg: bg23.url },
  { m: "စာသင်ခန်း", s: "သင်ခန်းစာ", f: 23, p: 3, l: 3, bg: bg24.url },
  { m: "ငွေကြေး", s: "စီမံခန့်ခွဲမှု", f: 24, p: 4, l: 4, bg: bg25.url },
  { m: "ရိုးရှင်း", s: "လမ်းညွှန်", f: 25, p: 5, l: 0, bg: bg26.url },
  { m: "မီးတောက်", s: "စိန်ခေါ်မှု", f: 26, p: 6, l: 1, bg: bg27.url },
  { m: "အအေးဓာတ်", s: "စမ်းသပ်ချက်", f: 27, p: 7, l: 2, bg: bg28.url },
  { m: "ရိုးရာထည်", s: "ဖက်ရှင်", f: 28, p: 8, l: 3, bg: bg29.url },
  { m: "မီးပုံးပျံ", s: "ပွဲတော်", f: 0, p: 9, l: 4, bg: bg30.url },
  { m: "နည်းပညာသစ်", s: "မိတ်ဆက်", f: 1, p: 0, l: 0, bg: bg31.url },
  { m: "မီးဖိုချောင်", s: "လျှို့ဝှက်ချက်", f: 2, p: 1, l: 1, bg: bg32.url },
  { m: "စင်မြင့်", s: "ဖျော်ဖြေပွဲ", f: 3, p: 2, l: 2, bg: bg33.url },
  { m: "ကိုယ်ခန္ဓာ", s: "လေ့ကျင့်ခန်း", f: 4, p: 3, l: 3, bg: bg34.url },
  { m: "နေဝင်ချိန်", s: "အတွေးများ", f: 5, p: 4, l: 4, bg: bg35.url },
  { m: "နူးညံ့", s: "အလှတရား", f: 6, p: 5, l: 0, bg: bg36.url },
  { m: "ဝါးတော", s: "ငြိမ်းချမ်းရေး", f: 7, p: 6, l: 1, bg: bg37.url },
  { m: "ဆောက်လုပ်ရေး", s: "စီမံကိန်း", f: 8, p: 7, l: 2, bg: bg38.url },
  { m: "စာအုပ်", s: "မျှဝေခြင်း", f: 9, p: 8, l: 3, bg: bg39.url },
  { m: "မြို့ပြ", s: "ဘဝ", f: 10, p: 9, l: 4, bg: bg40.url },
  { m: "ကျေးရွာ", s: "နေ့စဉ်ဘဝ", f: 11, p: 0, l: 0, bg: bg41.url },
  { m: "မီးရောင်စုံ", s: "ပွဲတော်ည", f: 12, p: 1, l: 1, bg: bg42.url },
  { m: "အနာဂတ်", s: "မြို့တော်", f: 13, p: 2, l: 2, bg: bg43.url },
  { m: "နှင်းတောင်", s: "စွန့်စားခန်း", f: 14, p: 3, l: 3, bg: bg44.url },
  { m: "ပန်းများ", s: "အနီးကပ်", f: 15, p: 4, l: 4, bg: bg45.url },
  { m: "ဂီတ", s: "ဖန်တီးမှု", f: 16, p: 5, l: 0, bg: bg46.url },
  { m: "အင်းလေး", s: "ခရီးသွား", f: 17, p: 6, l: 1, bg: bg47.url },
  { m: "ဒစ်ဂျစ်တယ်", s: "လောက", f: 18, p: 7, l: 2, bg: bg48.url },
  { m: "ကျောက်စိမ်း", s: "ဇိမ်ခံ", f: 19, p: 8, l: 3, bg: bg49.url },
  { m: "ရောင်စုံ", s: "ပျော်ရွှင်စရာ", f: 20, p: 9, l: 4, bg: bg50.url },
]

let seq = 0
function T(text: string, o: Partial<TextLayer>): TextLayer {
  seq += 1
  return { ...createTextLayer(text), id: `yt-${Date.now()}-${seq}`, ...o }
}

function build(r: Row): TextLayer[] {
  const f = `rf:${FONTS[r.f % FONTS.length]}`
  const k = PAL[r.p % PAL.length]

  const head: Partial<TextLayer> = {
    fontKey: f,
    fontSize: 15,
    lineHeight: 1.45,
    color: k.fill,
    strokeWidth: 2.4,
    strokeColor: k.stroke,
    shadowColor: 'rgba(0,0,0,0.55)',
    shadowBlur: 18,
    shadowOffsetY: 10,
  }

  const cap: Partial<TextLayer> = {
    fontKey: f,
    fontSize: 4.4,
    letterSpacing: 2,
    color: k.accent,
    strokeWidth: 1,
    strokeColor: k.stroke,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 10,
    shadowOffsetY: 5,
  }

  switch (r.l) {
    case 0: // centered stack
      return [T(r.m, { ...head, x: 50, y: 42 }), T(r.s, { ...cap, x: 50, y: 70 })]
    case 1: // left aligned
      return [
        T(r.m, { ...head, x: 32, y: 40, align: 'left', fontSize: 13 }),
        T(r.s, { ...cap, x: 32, y: 68, align: 'left' }),
      ]
    case 2: // bottom band
      return [
        T(r.m, { ...head, x: 50, y: 62, fontSize: 14 }),
        T(r.s, { ...cap, x: 50, y: 84 }),
      ]
    case 3: // tilted headline with depth
      return [
        T(r.m, {
          ...head,
          x: 50,
          y: 44,
          rotation: -4,
          depthOn: true,
          depth: 8,
          depthColor: k.accent,
          depthDarken: 0.15,
        }),
        T(r.s, { ...cap, x: 50, y: 74 }),
      ]
    default: // gradient headline top
      return [
        T(r.m, {
          ...head,
          x: 50,
          y: 34,
          fillType: 'gradient',
          gradientFrom: k.fill,
          gradientTo: k.accent,
          gradientAngle: 90,
        }),
        T(r.s, { ...cap, x: 50, y: 62 }),
      ]
  }
}

/** `rf:` font keys used by the thumbnail pack. */
export const THUMB_FONT_KEYS = FONTS.map((n) => `rf:${n}`)

export const THUMBNAIL_TEMPLATES: TemplateDef[] = ROWS.map((r, i) => ({
  id: `mm-thumb-${i + 1}`,
  name: `${r.m} — ${r.s}`,
  lang: 'MM' as const,
  group: 'Thumbnail',
  bg: r.bg,
  build: () => build(r),
}))
