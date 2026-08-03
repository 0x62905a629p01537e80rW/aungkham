/**
 * 50 Myanmar Facebook ad templates (1:1).
 * Each pairs a unique AI-generated ad background + AI avatar portrait with a
 * different premium Burmese typeface (`rf:` keys) from the font store.
 */
import { createGraphicLayer, createTextLayer, type TextLayer } from '@/lib/text-layer'
import { shapeDataUrl } from '@/lib/shapes'
import type { TemplateDef } from '@/lib/templates'

import bg01 from "@/assets/fbads/adbg01.jpg.asset.json"
import bg02 from "@/assets/fbads/adbg02.jpg.asset.json"
import bg03 from "@/assets/fbads/adbg03.jpg.asset.json"
import bg04 from "@/assets/fbads/adbg04.jpg.asset.json"
import bg05 from "@/assets/fbads/adbg05.jpg.asset.json"
import bg06 from "@/assets/fbads/adbg06.jpg.asset.json"
import bg07 from "@/assets/fbads/adbg07.jpg.asset.json"
import bg08 from "@/assets/fbads/adbg08.jpg.asset.json"
import bg09 from "@/assets/fbads/adbg09.jpg.asset.json"
import bg10 from "@/assets/fbads/adbg10.jpg.asset.json"
import bg11 from "@/assets/fbads/adbg11.jpg.asset.json"
import bg12 from "@/assets/fbads/adbg12.jpg.asset.json"
import bg13 from "@/assets/fbads/adbg13.jpg.asset.json"
import bg14 from "@/assets/fbads/adbg14.jpg.asset.json"
import bg15 from "@/assets/fbads/adbg15.jpg.asset.json"
import bg16 from "@/assets/fbads/adbg16.jpg.asset.json"
import bg17 from "@/assets/fbads/adbg17.jpg.asset.json"
import bg18 from "@/assets/fbads/adbg18.jpg.asset.json"
import bg19 from "@/assets/fbads/adbg19.jpg.asset.json"
import bg20 from "@/assets/fbads/adbg20.jpg.asset.json"
import bg21 from "@/assets/fbads/adbg21.jpg.asset.json"
import bg22 from "@/assets/fbads/adbg22.jpg.asset.json"
import bg23 from "@/assets/fbads/adbg23.jpg.asset.json"
import bg24 from "@/assets/fbads/adbg24.jpg.asset.json"
import bg25 from "@/assets/fbads/adbg25.jpg.asset.json"
import bg26 from "@/assets/fbads/adbg26.jpg.asset.json"
import bg27 from "@/assets/fbads/adbg27.jpg.asset.json"
import bg28 from "@/assets/fbads/adbg28.jpg.asset.json"
import bg29 from "@/assets/fbads/adbg29.jpg.asset.json"
import bg30 from "@/assets/fbads/adbg30.jpg.asset.json"
import bg31 from "@/assets/fbads/adbg31.jpg.asset.json"
import bg32 from "@/assets/fbads/adbg32.jpg.asset.json"
import bg33 from "@/assets/fbads/adbg33.jpg.asset.json"
import bg34 from "@/assets/fbads/adbg34.jpg.asset.json"
import bg35 from "@/assets/fbads/adbg35.jpg.asset.json"
import bg36 from "@/assets/fbads/adbg36.jpg.asset.json"
import bg37 from "@/assets/fbads/adbg37.jpg.asset.json"
import bg38 from "@/assets/fbads/adbg38.jpg.asset.json"
import bg39 from "@/assets/fbads/adbg39.jpg.asset.json"
import bg40 from "@/assets/fbads/adbg40.jpg.asset.json"
import bg41 from "@/assets/fbads/adbg41.jpg.asset.json"
import bg42 from "@/assets/fbads/adbg42.jpg.asset.json"
import bg43 from "@/assets/fbads/adbg43.jpg.asset.json"
import bg44 from "@/assets/fbads/adbg44.jpg.asset.json"
import bg45 from "@/assets/fbads/adbg45.jpg.asset.json"
import bg46 from "@/assets/fbads/adbg46.jpg.asset.json"
import bg47 from "@/assets/fbads/adbg47.jpg.asset.json"
import bg48 from "@/assets/fbads/adbg48.jpg.asset.json"
import bg49 from "@/assets/fbads/adbg49.jpg.asset.json"
import bg50 from "@/assets/fbads/adbg50.jpg.asset.json"
import av01 from "@/assets/fbads/avatar01.jpg.asset.json"
import av02 from "@/assets/fbads/avatar02.jpg.asset.json"
import av03 from "@/assets/fbads/avatar03.jpg.asset.json"
import av04 from "@/assets/fbads/avatar04.jpg.asset.json"
import av05 from "@/assets/fbads/avatar05.jpg.asset.json"
import av06 from "@/assets/fbads/avatar06.jpg.asset.json"
import av07 from "@/assets/fbads/avatar07.jpg.asset.json"
import av08 from "@/assets/fbads/avatar08.jpg.asset.json"
import av09 from "@/assets/fbads/avatar09.jpg.asset.json"
import av10 from "@/assets/fbads/avatar10.jpg.asset.json"
import av11 from "@/assets/fbads/avatar11.jpg.asset.json"
import av12 from "@/assets/fbads/avatar12.jpg.asset.json"

const BG: string[] = [bg01.url, bg02.url, bg03.url, bg04.url, bg05.url, bg06.url, bg07.url, bg08.url, bg09.url, bg10.url, bg11.url, bg12.url, bg13.url, bg14.url, bg15.url, bg16.url, bg17.url, bg18.url, bg19.url, bg20.url, bg21.url, bg22.url, bg23.url, bg24.url, bg25.url, bg26.url, bg27.url, bg28.url, bg29.url, bg30.url, bg31.url, bg32.url, bg33.url, bg34.url, bg35.url, bg36.url, bg37.url, bg38.url, bg39.url, bg40.url, bg41.url, bg42.url, bg43.url, bg44.url, bg45.url, bg46.url, bg47.url, bg48.url, bg49.url, bg50.url]
const AV: string[] = [av01.url, av02.url, av03.url, av04.url, av05.url, av06.url, av07.url, av08.url, av09.url, av10.url, av11.url, av12.url]

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
  "MasterpieceUniType",
]

const PAL: { ink: string; paper: string; accent: string }[] = [
  { ink: "#ffffff", paper: "#111111", accent: "#ff3b30" },
  { ink: "#0b1b2b", paper: "#ffffff", accent: "#ffb703" },
  { ink: "#ffffff", paper: "#0b2a4a", accent: "#00c2ff" },
  { ink: "#1a1200", paper: "#fff3c4", accent: "#f5b301" },
  { ink: "#ffffff", paper: "#2b0038", accent: "#c084fc" },
  { ink: "#062b18", paper: "#ffffff", accent: "#22c55e" },
  { ink: "#ffffff", paper: "#3a0010", accent: "#ff2d55" },
  { ink: "#04303d", paper: "#e6fbff", accent: "#00e0ff" },
  { ink: "#ffffff", paper: "#111111", accent: "#ff7a18" },
  { ink: "#12002b", paper: "#ffffff", accent: "var(--primary)" },
]

interface Row { m: string; s: string; c: string; f: number; p: number; l: number; a: number; bg: string }

const ROWS: Row[] = [
  { m: "ကော်ဖီအထူးလျှော့စျေး", s: "မနက်တိုင်း အရသာသစ်", c: "ယနေ့ မှာယူပါ", f: 0, p: 0, l: 0, a: 0, bg: BG[0] },
  { m: "လတ်ဆတ်သောဟင်းသီးဟင်းရွက်", s: "အိမ်တိုင်ရာရောက်", c: "ဖုန်းဆက်ပါ", f: 1, p: 1, l: 1, a: 1, bg: BG[1] },
  { m: "ဖုန်းအသစ်များ", s: "အရစ်ကျဝယ်ယူနိုင်", c: "အခုပဲ မှာယူပါ", f: 2, p: 2, l: 2, a: 2, bg: BG[2] },
  { m: "အလှကုန်အထူးအစီအစဉ်", s: "မူရင်းပစ္စည်း ၁၀၀%", c: "စျေးနှုန်းစုံစမ်းရန်", f: 3, p: 3, l: 3, a: 3, bg: BG[3] },
  { m: "ကြွက်သားလေ့ကျင့်ခန်း", s: "တစ်လစာ အခမဲ့", c: "စာရင်းသွင်းပါ", f: 4, p: 4, l: 4, a: 4, bg: BG[4] },
  { m: "အိမ်အလှဆင်ပစ္စည်း", s: "စျေးနှုန်းသက်သာ", c: "ဆက်သွယ်ရန်", f: 5, p: 5, l: 5, a: 5, bg: BG[5] },
  { m: "ဒီဇိုင်းဝန်ဆောင်မှု", s: "ပရော်ဖက်ရှင်နယ်", c: "မက်ဆေ့ပို့ပါ", f: 6, p: 6, l: 0, a: 6, bg: BG[6] },
  { m: "ညစျေးအရသာ", s: "မှာယူလို့ရပြီ", c: "Delivery ရသည်", f: 7, p: 7, l: 1, a: 7, bg: BG[7] },
  { m: "ဖက်ရှင်အဝတ်အထည်", s: "အသစ်ရောက်ရှိ", c: "ဝင်ရောက်ကြည့်ရှုပါ", f: 8, p: 8, l: 2, a: 8, bg: BG[8] },
  { m: "အွန်လိုင်းသင်တန်း", s: "အလုပ်အကိုင်အခွင့်အလမ်း", c: "အခုပဲ စာရင်းသွင်း", f: 9, p: 9, l: 3, a: 9, bg: BG[9] },
  { m: "အိမ်ခြံမြေရောင်းရန်", s: "တည်နေရာကောင်း", c: "အသေးစိတ်ကြည့်ရန်", f: 10, p: 0, l: 4, a: 10, bg: BG[10] },
  { m: "လေယာဉ်လက်မှတ်", s: "စျေးအသက်သာဆုံး", c: "ယခုပဲ ဘွတ်ကင်လုပ်ပါ", f: 11, p: 1, l: 5, a: 11, bg: BG[11] },
  { m: "မုန့်ဖုတ်လက်ရာ", s: "နေ့စဉ်လတ်ဆတ်", c: "ကြိုတင်မှာယူပါ", f: 12, p: 2, l: 0, a: 0, bg: BG[12] },
  { m: "ကားဆေးကြောခြင်း", s: "အထူးပရိုမိုးရှင်း", c: "ဖုန်းဆက်ပါ", f: 13, p: 3, l: 1, a: 1, bg: BG[13] },
  { m: "ကျန်းမာရေးစစ်ဆေးမှု", s: "ကျွမ်းကျင်ဆရာဝန်", c: "ချိန်းဆိုရန်", f: 14, p: 4, l: 2, a: 2, bg: BG[14] },
  { m: "စာအုပ်အထူးလျှော့စျေး", s: "၂၀% သက်သာ", c: "ယနေ့သာ", f: 15, p: 5, l: 3, a: 3, bg: BG[15] },
  { m: "ငွေစုဆောင်းအစီအစဉ်", s: "အတိုးနှုန်းမြင့်", c: "အသေးစိတ်သိရန်", f: 16, p: 6, l: 4, a: 4, bg: BG[16] },
  { m: "စပါးအေးခန်း", s: "ငြိမ်းချမ်းသောအချိန်", c: "ချိန်းဆိုပါ", f: 17, p: 7, l: 5, a: 5, bg: BG[17] },
  { m: "စမတ်အိမ်ပစ္စည်း", s: "တပ်ဆင်ခ အခမဲ့", c: "မှာယူရန်", f: 18, p: 8, l: 0, a: 6, bg: BG[18] },
  { m: "ဆောက်လုပ်ရေးပစ္စည်း", s: "လက်ကားစျေး", c: "ဆက်သွယ်ပါ", f: 19, p: 9, l: 1, a: 7, bg: BG[19] },
  { m: "သစ်သီးဖျော်ရည်", s: "သဘာဝ ၁၀၀%", c: "သောက်သုံးကြည့်ပါ", f: 20, p: 0, l: 2, a: 8, bg: BG[20] },
  { m: "ပင်လယ်စာအထူးဟင်း", s: "ယနေ့အထူးမီနူး", c: "စားပွဲကြိုတင်မှာ", f: 21, p: 1, l: 3, a: 9, bg: BG[21] },
  { m: "အထူးလျှော့စျေးရက်", s: "၃ ရက်သာ", c: "အခုပဲဝယ်ပါ", f: 22, p: 2, l: 4, a: 10, bg: BG[22] },
  { m: "ဖုန်းပြင်ဆင်ခြင်း", s: "အာမခံ ၃ လ", c: "လာရောက်ပါ", f: 23, p: 3, l: 5, a: 11, bg: BG[23] },
  { m: "မင်္ဂလာဆောင်ဓာတ်ပုံ", s: "အထူးပက်ကေ့ချ်", c: "ကြိုတင်ချိန်းဆိုပါ", f: 24, p: 4, l: 0, a: 0, bg: BG[24] },
  { m: "ဖိနပ်အသစ်များ", s: "လူငယ်ဒီဇိုင်း", c: "အခုပဲ မှာယူ", f: 25, p: 5, l: 1, a: 1, bg: BG[25] },
  { m: "နည်းပညာဝန်ဆောင်မှု", s: "၂၄ နာရီ", c: "ဆက်သွယ်ပါ", f: 26, p: 6, l: 2, a: 2, bg: BG[26] },
  { m: "ကုန်စုံပို့ဆောင်ရေး", s: "၁ နာရီအတွင်း", c: "အော်ဒါတင်ပါ", f: 27, p: 7, l: 3, a: 3, bg: BG[27] },
  { m: "လက်ဖက်ရည်ဆိုင်", s: "ရိုးရာအရသာ", c: "လာရောက်လည်ပတ်ပါ", f: 28, p: 8, l: 4, a: 4, bg: BG[28] },
  { m: "ကမ်းခြေခရီးစဉ်", s: "အထူးစျေးနှုန်း", c: "စာရင်းပေးပါ", f: 29, p: 9, l: 5, a: 5, bg: BG[29] },
  { m: "ဆံပင်ညှပ်ဆိုင်", s: "ကျွမ်းကျင်ဝန်ဆောင်မှု", c: "ချိန်းဆိုရန်", f: 0, p: 0, l: 0, a: 6, bg: BG[30] },
  { m: "ပုံနှိပ်လုပ်ငန်း", s: "အမြန်ဆုံးပြီးစီး", c: "စျေးနှုန်းမေးရန်", f: 1, p: 1, l: 1, a: 7, bg: BG[31] },
  { m: "ပန်းပင်ရောင်းချခြင်း", s: "အိမ်တွင်းပင်များ", c: "ကြည့်ရှုရန်", f: 2, p: 2, l: 2, a: 8, bg: BG[32] },
  { m: "ရွှေဆိုင်", s: "အရည်အသွေးမြင့်", c: "လာရောက်ကြည့်ပါ", f: 3, p: 3, l: 3, a: 9, bg: BG[33] },
  { m: "ကလေးအရုပ်ဆိုင်", s: "လုံခြုံစိတ်ချရ", c: "မှာယူပါ", f: 4, p: 4, l: 4, a: 10, bg: BG[34] },
  { m: "ဆိုင်ကယ်အရောင်း", s: "အရစ်ကျစနစ်", c: "စုံစမ်းရန်", f: 5, p: 5, l: 5, a: 11, bg: BG[35] },
  { m: "လယ်ယာထွက်ကုန်", s: "တိုက်ရိုက်ဝယ်ယူ", c: "ဆက်သွယ်ပါ", f: 6, p: 6, l: 0, a: 0, bg: BG[36] },
  { m: "မြို့တော်ညစားသောက်ဆိုင်", s: "ည ၁၂ နာရီအထိ", c: "လာရောက်ပါ", f: 7, p: 7, l: 1, a: 1, bg: BG[37] },
  { m: "အိမ်မွေးတိရစ္ဆာန်ဆေးခန်း", s: "ကျွမ်းကျင်ဝန်ထမ်း", c: "ချိန်းဆိုပါ", f: 8, p: 8, l: 2, a: 2, bg: BG[38] },
  { m: "ဟိုတယ်အခန်းငှား", s: "အထူးနှုန်းထား", c: "ဘွတ်ကင်လုပ်ပါ", f: 9, p: 9, l: 3, a: 3, bg: BG[39] },
  { m: "ဆိုလာစနစ်", s: "မီးအားပြည့်", c: "တပ်ဆင်ရန်", f: 10, p: 0, l: 4, a: 4, bg: BG[40] },
  { m: "ငွေပေးချေမှုစနစ်", s: "လွယ်ကူလုံခြုံ", c: "အသုံးပြုကြည့်ပါ", f: 11, p: 1, l: 5, a: 5, bg: BG[41] },
  { m: "အထည်လက်ကား", s: "ဆိုင်ဖွင့်သူများအတွက်", c: "ဆက်သွယ်ပါ", f: 12, p: 2, l: 0, a: 6, bg: BG[42] },
  { m: "ရေခဲမုန့်ဆိုင်", s: "အရသာ ၂၀ မျိုး", c: "လာရောက်မြည်းစမ်း", f: 13, p: 3, l: 1, a: 7, bg: BG[43] },
  { m: "ဂိမ်းပစ္စည်းများ", s: "အထူးလျှော့စျေး", c: "ဝယ်ယူရန်", f: 14, p: 4, l: 2, a: 8, bg: BG[44] },
  { m: "ရုံးသုံးပစ္စည်း", s: "လက်ကားစျေးနှုန်း", c: "အော်ဒါတင်ပါ", f: 15, p: 5, l: 3, a: 9, bg: BG[45] },
  { m: "ကြက်ဥလတ်လတ်", s: "နေ့စဉ်ပို့ဆောင်", c: "မှာယူပါ", f: 16, p: 6, l: 4, a: 10, bg: BG[46] },
  { m: "ရေသန့်စက်", s: "အိမ်သုံးအရည်အသွေး", c: "စုံစမ်းရန်", f: 17, p: 7, l: 5, a: 11, bg: BG[47] },
  { m: "နှစ်ပတ်လည်ပွဲတော်", s: "အထူးလက်ဆောင်", c: "ပါဝင်ဆင်နွှဲပါ", f: 18, p: 8, l: 0, a: 0, bg: BG[48] },
  { m: "စာရေးကိရိယာအထူး", s: "ကျောင်းဖွင့်ရာသီ", c: "ယခုပဲဝယ်ပါ", f: 19, p: 9, l: 1, a: 1, bg: BG[49] },
]

const DISC = 'M50,50m-46,0a46,46 0 1,0 92,0a46,46 0 1,0 -92,0'
const PILL = 'M20,0H80A20,20 0 0 1 100,20V80A20,20 0 0 1 80,100H20A20,20 0 0 1 0,80V20A20,20 0 0 1 20,0Z'
const BAR = 'M0,0H100V100H0Z'

let seq = 0
function T(text: string, o: Partial<TextLayer>): TextLayer {
  seq += 1
  return { ...createTextLayer(text), id: `fb-t-${Date.now()}-${seq}`, ...o }
}

function S(path: string, aspect: number, o: Partial<TextLayer>): TextLayer {
  seq += 1
  const color = o.color ?? '#000000'
  return {
    ...createGraphicLayer({ kind: 'shape', src: shapeDataUrl(path, color, false, 6), aspect, path }),
    id: `fb-s-${Date.now()}-${seq}`,
    ...o,
    color,
  }
}

function A(src: string, o: Partial<TextLayer>): TextLayer {
  seq += 1
  return {
    ...createGraphicLayer({ kind: 'image', src, aspect: 1 }, 'Avatar'),
    id: `fb-a-${Date.now()}-${seq}`,
    ...o,
  }
}

function build(r: Row): TextLayer[] {
  const f = `rf:${FONTS[r.f % FONTS.length]}`
  const k = PAL[r.p % PAL.length]
  const avatar = AV[r.a % AV.length]

  const head: Partial<TextLayer> = {
    fontKey: f,
    fontSize: 9,
    lineHeight: 1.45,
    color: k.paper,
    strokeWidth: 1.6,
    strokeColor: k.ink,
    shadowColor: 'rgba(0,0,0,0.45)',
    shadowBlur: 14,
    shadowOffsetY: 6,
  }
  const sub: Partial<TextLayer> = { fontKey: f, fontSize: 4.2, color: k.paper, lineHeight: 1.5 }
  const cta: Partial<TextLayer> = { fontKey: f, fontSize: 3.6, color: k.ink, lineHeight: 1.4 }

  switch (r.l) {
    case 0: // avatar disc top, copy below
      return [
        S(DISC, 1, { x: 50, y: 22, fontSize: 30, color: k.accent }),
        A(avatar, { x: 50, y: 22, fontSize: 27 }),
        T(r.m, { ...head, x: 50, y: 48 }),
        T(r.s, { ...sub, x: 50, y: 64 }),
        S(PILL, 3.4, { x: 50, y: 80, fontSize: 44, color: k.accent }),
        T(r.c, { ...cta, x: 50, y: 80 }),
      ]
    case 1: // avatar left, copy right
      return [
        S(BAR, 1, { x: 50, y: 78, fontSize: 100, color: k.ink, opacity: 0.55 } as Partial<TextLayer>),
        A(avatar, { x: 24, y: 70, fontSize: 30 }),
        T(r.m, { ...head, x: 62, y: 30, fontSize: 8.4, align: 'center' }),
        T(r.s, { ...sub, x: 62, y: 66 }),
        S(PILL, 3.4, { x: 62, y: 84, fontSize: 40, color: k.accent }),
        T(r.c, { ...cta, x: 62, y: 84 }),
      ]
    case 2: // bottom band with avatar badge
      return [
        T(r.m, { ...head, x: 50, y: 30, fontSize: 10 }),
        T(r.s, { ...sub, x: 50, y: 48 }),
        S(DISC, 1, { x: 26, y: 76, fontSize: 26, color: k.accent }),
        A(avatar, { x: 26, y: 76, fontSize: 23 }),
        S(PILL, 3, { x: 66, y: 76, fontSize: 38, color: k.accent }),
        T(r.c, { ...cta, x: 66, y: 76 }),
      ]
    case 3: // headline top, avatar bottom right
      return [
        T(r.m, { ...head, x: 50, y: 20, fontSize: 9.5 }),
        T(r.s, { ...sub, x: 50, y: 38 }),
        A(avatar, { x: 74, y: 72, fontSize: 34 }),
        S(PILL, 3.2, { x: 28, y: 84, fontSize: 40, color: k.accent }),
        T(r.c, { ...cta, x: 28, y: 84 }),
      ]
    case 4: // gradient headline, avatar disc left
      return [
        A(avatar, { x: 22, y: 32, fontSize: 28 }),
        T(r.m, {
          ...head,
          x: 50,
          y: 58,
          fontSize: 9.5,
          fillType: 'gradient',
          gradientFrom: k.paper,
          gradientTo: k.accent,
          gradientAngle: 90,
        }),
        T(r.s, { ...sub, x: 50, y: 74 }),
        S(PILL, 3.2, { x: 50, y: 89, fontSize: 40, color: k.accent }),
        T(r.c, { ...cta, x: 50, y: 89 }),
      ]
    default: // tilted headline + avatar corner badge
      return [
        S(DISC, 1, { x: 78, y: 24, fontSize: 26, color: k.accent }),
        A(avatar, { x: 78, y: 24, fontSize: 23 }),
        T(r.m, { ...head, x: 46, y: 56, rotation: -3, depthOn: true, depth: 6, depthColor: k.accent }),
        T(r.s, { ...sub, x: 46, y: 72 }),
        S(PILL, 3.2, { x: 46, y: 87, fontSize: 40, color: k.accent }),
        T(r.c, { ...cta, x: 46, y: 87 }),
      ]
  }
}

/** `rf:` font keys used by the Facebook ad pack. */
export const FBAD_FONT_KEYS = FONTS.map((n) => `rf:${n}`)

export const FBAD_TEMPLATES: TemplateDef[] = ROWS.map((r, i) => ({
  id: `mm-fbad-${i + 1}`,
  name: `${r.m} — ${r.s}`,
  lang: 'MM' as const,
  group: 'Facebook Ad',
  bg: r.bg,
  build: () => build(r),
}))
