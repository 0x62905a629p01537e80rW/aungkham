/**
 * Featured Myanmar text-effect templates — shown first everywhere.
 * Same layered "graphic style" composition as the premium set.
 */
import { premiumTemplatePair, type PremiumDesign } from '@/lib/premium-templates'

import bgSunsetSea from '@/assets/templates/bg-sunset-sea.jpg'
import bgGreenField from '@/assets/templates/bg-green-field.jpg'
import bgDesertDunes from '@/assets/templates/bg-desert-dunes.jpg'
import bgEmbers from '@/assets/templates/bg-embers.jpg'
import bgBlossom from '@/assets/templates/bg-blossom.jpg'
import bgMemphis from '@/assets/templates/bg-memphis.jpg'
import bgStarryNight from '@/assets/templates/bg-starry-night.jpg'

const FEATURED_DESIGNS: PremiumDesign[] = [
  {
    key: 'maung-lay',
    label: 'မောင်လေး',
    bg: bgSunsetSea,
    en: { main: 'Maung Lay', sub: 'MYANMAR TEXT STYLE', font: 'gladolia', subFont: 'montserrat' },
    mm: { main: 'မောင်လေး', sub: 'မြန်မာစာလုံး အထူးဒီဇိုင်း', font: 'myanmaryinmar', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 45, fontSize: 15, color: '#fff6e8',
      strokeWidth: 1.8, strokeColor: '#3b1d12',
      depthOn: true, depth: 9, depthColor: '#f0803c', depthDarken: 0.18,
      rotation: -3,
      shadowColor: 'rgba(59,29,18,0.45)', shadowBlur: 16, shadowOffsetX: 4, shadowOffsetY: 9,
    },
    sub: { x: 50, y: 73, fontSize: 3.2, letterSpacing: 4, color: '#ffe6c9', fontWeight: 700 },
  },
  {
    key: 'tamar-ywet',
    label: 'တမာရွက်စား',
    bg: bgGreenField,
    en: { main: 'Tamar Leaf', sub: 'CLASSIC MYANMAR SONG', font: 'moldie', subFont: 'montserrat' },
    mm: { main: 'လေးတမာရွက်စား\nပေးရတယ်', sub: 'မြန်မာ့ ရိုးရာ သီချင်း', font: 'myanmargantgaw', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 44, fontSize: 11, color: '#ffffff',
      strokeWidth: 1.6, strokeColor: '#12341f',
      depthOn: true, depth: 8, depthColor: '#2f7a45', depthDarken: 0.2,
      shadowColor: 'rgba(8,32,17,0.45)', shadowBlur: 14, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: { x: 50, y: 76, fontSize: 3, letterSpacing: 4, color: '#dff5e4', fontWeight: 600 },
  },
  {
    key: 'khayee-thwar',
    label: 'ခရီးသွား',
    bg: bgDesertDunes,
    en: { main: 'Travel', sub: 'WANDER MORE, WORRY LESS', font: 'talina', subFont: 'poppins' },
    mm: { main: 'ခရီးသွား', sub: 'ခရီးများများ သွားပါ', font: 'myanmar-khittar', subFont: 'layaungthit-k48' },
    main: {
      x: 50, y: 46, fontSize: 15, color: '#fffaf0',
      strokeWidth: 1.4, strokeColor: '#5a3c1b',
      depthOn: true, depth: 9, depthColor: '#c98a3f', depthDarken: 0.2,
      shadowColor: 'rgba(70,44,18,0.4)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 10,
    },
    sub: { x: 50, y: 73, fontSize: 3.1, letterSpacing: 5, color: '#ffeccd', fontWeight: 600 },
  },
  {
    key: 'yee-yint',
    label: 'ရဲရင့်',
    bg: bgEmbers,
    en: { main: 'BRAVE', sub: 'STAY STRONG', font: 'mochi-boom', subFont: 'montserrat' },
    mm: { main: 'ရဲရင့်', sub: 'ခိုင်မာစွာ ရပ်တည်ပါ', font: 'myanmarsquare', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 17, color: '#ffd98a',
      strokeWidth: 2, strokeColor: '#2b0d05',
      depthOn: true, depth: 11, depthColor: '#c22f14', depthDarken: 0.22,
      shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 12, shadowOffsetX: 4, shadowOffsetY: 8,
    },
    sub: { x: 50, y: 73, fontSize: 3.2, letterSpacing: 6, color: '#ffcf9c', fontWeight: 800 },
  },
  {
    key: 'a-may-lay',
    label: 'အမယ်လေး',
    bg: bgBlossom,
    en: { main: 'Oh My!', sub: 'CUTE STICKER STYLE', font: 'milkyway', subFont: 'poppins' },
    mm: { main: 'အမယ်လေး', sub: 'ချစ်စရာ စတစ်ကာ ပုံစံ', font: 'myanmarsabae', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 46, fontSize: 14, color: '#ffffff',
      strokeWidth: 2.2, strokeColor: '#7a2b52',
      depthOn: true, depth: 9, depthColor: '#f18cb3', depthDarken: 0.15,
      shadowColor: 'rgba(122,43,82,0.28)', shadowBlur: 14, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: { x: 50, y: 73, fontSize: 3.1, letterSpacing: 4, color: '#7a2b52', fontWeight: 700 },
  },
  {
    key: 'spoof-fun',
    label: 'Spoof',
    bg: bgMemphis,
    en: { main: 'SPOOF', sub: 'FUN COMIC EFFECT', font: 'mochi-boom-extrude', subFont: 'montserrat' },
    mm: { main: 'ဟာသ', sub: 'ပျော်စရာ ကာတွန်း အထူး', font: 'myanmargantgaw', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 16, color: '#ffe14d',
      strokeWidth: 2, strokeColor: '#1d2340',
      depthOn: true, depth: 10, depthColor: '#1d2340', depthDarken: 0.1,
      rotation: -4,
      shadowColor: 'rgba(0,0,0,0.35)', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: { x: 50, y: 72, fontSize: 3.2, letterSpacing: 6, color: '#1d2340', fontWeight: 800 },
  },
  {
    key: 'magic-glow',
    label: 'Magic',
    bg: bgStarryNight,
    en: { main: 'MAGIC', sub: 'GLOW TEXT EFFECT', font: 'saphifen', subFont: 'montserrat' },
    mm: { main: 'မှော်ဆန်', sub: 'အလင်းရောင် စာလုံးအထူး', font: 'myanmaryinmar', subFont: 'layaungthit-k48' },
    main: {
      x: 50, y: 45, fontSize: 15, color: '#eae2ff',
      strokeWidth: 1.2, strokeColor: '#2a1b5c',
      depthOn: true, depth: 8, depthColor: '#7c5cff', depthDarken: 0.25,
      shadowColor: 'rgba(140,110,255,0.75)', shadowBlur: 26, shadowOffsetX: 0, shadowOffsetY: 0,
    },
    sub: { x: 50, y: 73, fontSize: 3.1, letterSpacing: 5, color: '#c9bcff', fontWeight: 600 },
  },
]

export const FEATURED_TEMPLATES = FEATURED_DESIGNS.flatMap((d) =>
  premiumTemplatePair(d).map((t) => ({ ...t, group: 'New' })),
)