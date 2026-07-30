/**
 * Premium templates — volume 2.
 * 50 additional designs, each available in English and Myanmar with its own
 * typeface pairing, colour system and generated background photo.
 */
import type { PremiumDesign } from '@/lib/premium-templates'
import { premiumTemplatePair } from '@/lib/premium-templates'

import bgAutumn from '@/assets/templates/bg-autumn.jpg'
import bgBeach from '@/assets/templates/bg-beach.jpg'
import bgBlackMarble from '@/assets/templates/bg-black-marble.jpg'
import bgBlossom from '@/assets/templates/bg-blossom.jpg'
import bgBlueRays from '@/assets/templates/bg-blue-rays.jpg'
import bgBlueSmoke from '@/assets/templates/bg-blue-smoke.jpg'
import bgConcrete from '@/assets/templates/bg-concrete.jpg'
import bgConfetti from '@/assets/templates/bg-confetti.jpg'
import bgCyberGrid from '@/assets/templates/bg-cyber-grid.jpg'
import bgDesertDunes from '@/assets/templates/bg-desert-dunes.jpg'
import bgEmbers from '@/assets/templates/bg-embers.jpg'
import bgForestMist from '@/assets/templates/bg-forest-mist.jpg'
import bgGoldBokeh from '@/assets/templates/bg-gold-bokeh.jpg'
import bgGraffiti from '@/assets/templates/bg-graffiti.jpg'
import bgGreenField from '@/assets/templates/bg-green-field.jpg'
import bgGrungePaper from '@/assets/templates/bg-grunge-paper.jpg'
import bgLiquidPurple from '@/assets/templates/bg-liquid-purple.jpg'
import bgMemphis from '@/assets/templates/bg-memphis.jpg'
import bgNeonCity from '@/assets/templates/bg-neon-city.jpg'
import bgOceanWave from '@/assets/templates/bg-ocean-wave.jpg'
import bgRainWindow from '@/assets/templates/bg-rain-window.jpg'
import bgSnowPeaks from '@/assets/templates/bg-snow-peaks.jpg'
import bgStadium from '@/assets/templates/bg-stadium.jpg'
import bgStarryNight from '@/assets/templates/bg-starry-night.jpg'
import bgSunsetSea from '@/assets/templates/bg-sunset-sea.jpg'
import bgVhs from '@/assets/templates/bg-vhs.jpg'
import bgYellowPop from '@/assets/templates/bg-yellow-pop.jpg'

export const PREMIUM_DESIGNS_2: PremiumDesign[] = [
  {
    key: 'sunset-vibes',
    label: 'Sunset Vibes',
    bg: bgSunsetSea,
    en: { main: 'SUNSET', sub: 'GOLDEN HOUR VIBES', font: 'puffberry', subFont: 'montserrat' },
    mm: { main: 'နေဝင်ချိန်', sub: 'ရွှေရောင်အလှတရား', font: 'abrush', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#fff3d6',
      strokeWidth: 1.6, strokeColor: '#5a1a00',
      depthOn: true, depth: 9, depthColor: '#ff7a29', depthDarken: 0.3,
      rotation: -4,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 70, fontSize: 3.2, letterSpacing: 5, color: '#fff3d6', fontWeight: 700,
    },
  },
  {
    key: 'ocean-dream',
    label: 'Ocean Dream',
    bg: bgOceanWave,
    en: { main: 'OCEAN', sub: 'DEEP BLUE SERIES', font: 'saphifen', subFont: 'poppins' },
    mm: { main: 'သမုဒ္ဒရာ', sub: 'အပြာရောင်စီးရီး', font: 'layaungthit-k16', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ffffff',
      strokeWidth: 2.4, strokeColor: '#04384a',
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 6,
      letterSpacing: 1,
    },
    sub: {
      x: 50, y: 72, fontSize: 3, letterSpacing: 6, color: '#0ea5b7', fontWeight: 700,
    },
  },
  {
    key: 'forest-calm',
    label: 'Forest Calm',
    bg: bgForestMist,
    en: { main: 'CALM', sub: 'BREATHE SLOWLY', font: 'mocka', subFont: 'oswald' },
    mm: { main: 'ငြိမ်းချမ်း', sub: 'ဖြည်းညှင်းစွာ', font: 'layaungthit-k19', subFont: 'layaungthit-k26' },
    main: {
      x: 50, y: 46, fontSize: 13, color: '#f2fbf3',
      strokeWidth: 0, strokeColor: '#123123',
      letterSpacing: 3,
      shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 72, fontSize: 2.9, letterSpacing: 7, color: '#7fbf9a', fontWeight: 500,
    },
  },
  {
    key: 'snow-white',
    label: 'Snow White',
    bg: bgSnowPeaks,
    en: { main: 'WINTER', sub: 'COLD & CLEAN', font: 'outline-bubble', subFont: 'bebas' },
    mm: { main: 'ဆောင်းရာသီ', sub: 'အေးမြသန့်ရှင်း', font: 'layaungthit-k25', subFont: 'layaungthit-k57' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#0d2a45',
      strokeWidth: 2.4, strokeColor: '#ffffff',
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 6,
      letterSpacing: 1,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 6, color: '#4a90d9', fontWeight: 700,
    },
  },
  {
    key: 'liquid-wave',
    label: 'Liquid Wave',
    bg: bgLiquidPurple,
    en: { main: 'LIQUID', sub: 'FLUID TYPE STUDY', font: 'molen-friend', subFont: 'inter' },
    mm: { main: 'အရည်', sub: 'စာလုံးစမ်းသပ်ချက်', font: 'layaungthit-k26', subFont: 'layaungthit-k6' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ffffff',
      strokeWidth: 0.9, strokeColor: '#2b0b5e',
      fillType: 'gradient', gradientFrom: '#ffffff', gradientTo: '#f0abfc', gradientAngle: 90,
      shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 20, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 6, color: '#ffffff', fontWeight: 500,
    },
  },
  {
    key: 'paper-craft',
    label: 'Paper Craft',
    bg: bgGrungePaper,
    en: { main: 'CRAFT', sub: 'HANDMADE EDITION', font: 'baby-gemoy', subFont: 'playfair' },
    mm: { main: 'လက်ရာ', sub: 'လက်လုပ်ထုတ်ဝေမှု', font: 'layaungthit-k36', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#3a2410',
      strokeWidth: 1.2, strokeColor: '#e8d3a9',
      rotation: -3,
      shadowColor: '#c2762b', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 73, fontSize: 3.1, letterSpacing: 6, color: '#3a2410', fontWeight: 800,
    },
  },
  {
    key: 'cyber-run',
    label: 'Cyber Run',
    bg: bgCyberGrid,
    en: { main: 'CYBER', sub: 'RUN THE GRID', font: 'the-last-trunks', subFont: 'montserrat' },
    mm: { main: 'ဆိုက်ဘာ', sub: 'ကွန်ရက်အပြေး', font: 'layaungthit-k39', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 44, fontSize: 11, color: '#ffffff',
      strokeWidth: 0.6, strokeColor: '#ff2bd1',
      shadowColor: '#22d3ee', shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
      letterSpacing: 2,
    },
    sub: {
      x: 50, y: 70, fontSize: 3, letterSpacing: 8, color: '#22d3ee', fontWeight: 600,
    },
  },
  {
    key: 'dune-gold',
    label: 'Dune Gold',
    bg: bgDesertDunes,
    en: { main: 'DUNES', sub: 'SANDS OF TIME', font: 'dream-kudos', subFont: 'poppins' },
    mm: { main: 'သဲကုန်း', sub: 'အချိန်ရဲ့သဲများ', font: 'layaungthit-k48', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 15, color: '#fff4dd',
      strokeWidth: 1.6, strokeColor: '#5c2f00',
      depthOn: true, depth: 11, depthColor: '#e0952a', depthDarken: 0.3,
      rotation: -2,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 73, fontSize: 3.2, letterSpacing: 5, color: '#fff4dd', fontWeight: 700,
    },
  },
  {
    key: 'party-time',
    label: 'Party Time',
    bg: bgConfetti,
    en: { main: 'PARTY!', sub: 'LETS CELEBRATE', font: 'gladolia', subFont: 'oswald' },
    mm: { main: 'ပါတီပွဲ', sub: 'အတူဆင်နွှဲကြစို့', font: 'layaungthit-k49', subFont: 'layaungthit-k26' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#ffe600',
      strokeWidth: 1.6, strokeColor: '#083b5e',
      depthOn: true, depth: 12, depthColor: '#ff4d6d', depthDarken: 0.3,
      rotation: 0,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 70, fontSize: 3.2, letterSpacing: 5, color: '#ffe600', fontWeight: 700,
    },
  },
  {
    key: 'luxe-noir',
    label: 'Luxe Noir',
    bg: bgBlackMarble,
    en: { main: 'LUXE', sub: 'BLACK & GOLD', font: 'beachday', subFont: 'bebas' },
    mm: { main: 'ဇိမ်ခံ', sub: 'အနက်ရောင်နှင့်ရွှေ', font: 'layaungthit-k54', subFont: 'layaungthit-k57' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#ffe9b0',
      strokeWidth: 0.9, strokeColor: '#1a1200',
      fillType: 'gradient', gradientFrom: '#ffe9b0', gradientTo: '#e0952a', gradientAngle: 120,
      shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 20, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 70, fontSize: 3, letterSpacing: 6, color: '#ffe9b0', fontWeight: 500,
    },
  },
  {
    key: 'bloom-soft',
    label: 'Bloom',
    bg: bgBlossom,
    en: { main: 'SOFT BLOOM', sub: 'SPRING COLLECTION', font: 'moldie', subFont: 'inter' },
    mm: { main: 'ပန်းပွင့်', sub: 'နွေဦးစုစည်းမှု', font: 'layaungthit-k56', subFont: 'layaungthit-k6' },
    main: {
      x: 50, y: 46, fontSize: 12, color: '#ffffff',
      strokeWidth: 0, strokeColor: '#8a2b57',
      letterSpacing: 3,
      shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 72, fontSize: 2.9, letterSpacing: 7, color: '#ff9ec4', fontWeight: 500,
    },
  },
  {
    key: 'rainy-mood',
    label: 'Rainy Mood',
    bg: bgRainWindow,
    en: { main: 'RAINY', sub: 'CITY IN THE RAIN', font: 'child-hood', subFont: 'playfair' },
    mm: { main: 'မိုးရွာ', sub: 'မိုးထဲကမြို့တော်', font: 'layaungthit-k58', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 44, fontSize: 13, color: '#e8f4ff',
      strokeWidth: 0.6, strokeColor: '#0b2233',
      shadowColor: '#38bdf8', shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
      letterSpacing: 2,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 8, color: '#38bdf8', fontWeight: 600,
    },
  },
  {
    key: 'fire-power',
    label: 'Fire Power',
    bg: bgEmbers,
    en: { main: 'BLAZE', sub: 'BURN IT DOWN', font: 'mochi-boom', subFont: 'montserrat' },
    mm: { main: 'မီးတောက်', sub: 'အားပြင်းစွာ', font: 'layaungthit-k60', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#ffd166',
      strokeWidth: 1.6, strokeColor: '#2b0a00',
      depthOn: true, depth: 11, depthColor: '#ff4d00', depthDarken: 0.3,
      rotation: -4,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 70, fontSize: 3.2, letterSpacing: 5, color: '#ffd166', fontWeight: 700,
    },
  },
  {
    key: 'autumn-warm',
    label: 'Autumn',
    bg: bgAutumn,
    en: { main: 'AUTUMN', sub: 'FALLING LEAVES', font: 'mochi-boom-extrude', subFont: 'poppins' },
    mm: { main: 'ဆောင်းဦး', sub: 'ကြွေကျသောရွက်များ', font: 'layaungthit-k61', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#fff2df',
      strokeWidth: 1.2, strokeColor: '#5c1a00',
      rotation: -2,
      shadowColor: '#c2410c', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 72, fontSize: 3.1, letterSpacing: 6, color: '#fff2df', fontWeight: 800,
    },
  },
  {
    key: 'street-art',
    label: 'Street Art',
    bg: bgGraffiti,
    en: { main: 'BOLD!', sub: 'PAINT THE CITY', font: 'milkyway', subFont: 'oswald' },
    mm: { main: 'ရဲရင့်', sub: 'မြို့ကိုဆေးခြယ်', font: 'layaungthit-k65', subFont: 'layaungthit-k26' },
    main: {
      x: 50, y: 45, fontSize: 14, color: '#ffffff',
      strokeWidth: 2.4, strokeColor: '#111111',
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 6,
      letterSpacing: 1,
    },
    sub: {
      x: 50, y: 73, fontSize: 3, letterSpacing: 6, color: '#f43f5e', fontWeight: 700,
    },
  },
  {
    key: 'smoke-mystic',
    label: 'Mystic',
    bg: bgBlueSmoke,
    en: { main: 'MYSTIC', sub: 'INTO THE SMOKE', font: 'talina', subFont: 'bebas' },
    mm: { main: 'လျှို့ဝှက်', sub: 'မီးခိုးထဲသို့', font: 'myanmargantgaw', subFont: 'layaungthit-k57' },
    main: {
      x: 50, y: 44, fontSize: 11, color: '#dbeafe',
      strokeWidth: 0.6, strokeColor: '#1d4ed8',
      shadowColor: '#60a5fa', shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
      letterSpacing: 2,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 8, color: '#60a5fa', fontWeight: 600,
    },
  },
  {
    key: 'retro-tape',
    label: 'Retro Tape',
    bg: bgVhs,
    en: { main: 'RETRO', sub: 'REWIND THE 80s', font: 'puffberry', subFont: 'inter' },
    mm: { main: 'ရက်ထရို', sub: '၈၀ ပြည့်နှစ်များ', font: 'myanmarkuttar', subFont: 'layaungthit-k6' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#fff7ff',
      strokeWidth: 1.2, strokeColor: '#3b0764',
      rotation: 3,
      shadowColor: '#f0abfc', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 72, fontSize: 3.1, letterSpacing: 6, color: '#fff7ff', fontWeight: 800,
    },
  },
  {
    key: 'memphis-fun',
    label: 'Memphis',
    bg: bgMemphis,
    en: { main: 'PLAYFUL', sub: 'GEOMETRY CLUB', font: 'saphifen', subFont: 'playfair' },
    mm: { main: 'ပျော်ရွှင်', sub: 'ဂျီဩမေတြီ', font: 'myanmarsabae', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ffffff',
      strokeWidth: 1.6, strokeColor: '#334155',
      depthOn: true, depth: 11, depthColor: '#f472b6', depthDarken: 0.3,
      rotation: -3,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 71, fontSize: 3.2, letterSpacing: 5, color: '#ffffff', fontWeight: 700,
    },
  },
  {
    key: 'star-gaze',
    label: 'Star Gaze',
    bg: bgStarryNight,
    en: { main: 'DREAM', sub: 'UNDER THE STARS', font: 'mocka', subFont: 'montserrat' },
    mm: { main: 'အိပ်မက်', sub: 'ကြယ်များအောက်တွင်', font: 'myanmarsquare', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 46, fontSize: 11, color: '#e2e8f0',
      strokeWidth: 0, strokeColor: '#0b1120',
      letterSpacing: 3,
      shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 72, fontSize: 2.9, letterSpacing: 7, color: '#a5b4fc', fontWeight: 500,
    },
  },
  {
    key: 'green-peace',
    label: 'Green Peace',
    bg: bgGreenField,
    en: { main: 'NATURE', sub: 'FRESH & FREE', font: 'outline-bubble', subFont: 'poppins' },
    mm: { main: 'သဘာဝ', sub: 'လန်းဆန်းလွတ်လပ်', font: 'myanmaryinmar', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ffffff',
      strokeWidth: 2.4, strokeColor: '#14532d',
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 6,
      letterSpacing: 1,
    },
    sub: {
      x: 50, y: 72, fontSize: 3, letterSpacing: 6, color: '#4ade80', fontWeight: 700,
    },
  },
  {
    key: 'bold-move',
    label: 'Bold Move',
    bg: bgConcrete,
    en: { main: 'MOVE', sub: 'MAKE IT LOUD', font: 'molen-friend', subFont: 'oswald' },
    mm: { main: 'လှုပ်ရှား', sub: 'အသံကျယ်စွာ', font: 'koz008', subFont: 'layaungthit-k26' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#ffffff',
      strokeWidth: 1.6, strokeColor: '#0f172a',
      depthOn: true, depth: 9, depthColor: '#f59e0b', depthDarken: 0.3,
      rotation: 0,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 70, fontSize: 3.2, letterSpacing: 5, color: '#ffffff', fontWeight: 700,
    },
  },
  {
    key: 'wedding-day',
    label: 'Wedding',
    bg: bgGoldBokeh,
    en: { main: 'FOREVER', sub: 'TWO HEARTS ONE STORY', font: 'baby-gemoy', subFont: 'bebas' },
    mm: { main: 'ထာဝရ', sub: 'နှလုံးသားနှစ်ခု', font: 'koz033', subFont: 'layaungthit-k57' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#fff4de',
      strokeWidth: 0.9, strokeColor: '#4a2b00',
      fillType: 'gradient', gradientFrom: '#fff4de', gradientTo: '#e8b96a', gradientAngle: 120,
      shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 20, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 70, fontSize: 3, letterSpacing: 6, color: '#fff4de', fontWeight: 500,
    },
  },
  {
    key: 'birthday-pop',
    label: 'Birthday',
    bg: bgConfetti,
    en: { main: 'HAPPY DAY', sub: 'MAKE A WISH', font: 'the-last-trunks', subFont: 'inter' },
    mm: { main: 'မွေးနေ့', sub: 'ဆုတောင်းလိုက်ပါ', font: 'koz052', subFont: 'layaungthit-k6' },
    main: {
      x: 50, y: 45, fontSize: 14, color: '#fff200',
      strokeWidth: 1.6, strokeColor: '#7c2d12',
      depthOn: true, depth: 11, depthColor: '#ff5c8a', depthDarken: 0.3,
      rotation: 3,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 72, fontSize: 3.2, letterSpacing: 5, color: '#fff200', fontWeight: 700,
    },
  },
  {
    key: 'sale-blast',
    label: 'Sale Blast',
    bg: bgYellowPop,
    en: { main: 'BIG SALE', sub: 'UP TO 50% OFF', font: 'dream-kudos', subFont: 'playfair' },
    mm: { main: 'အရောင်းမြှင့်', sub: '၅၀% အထိလျှော့', font: 'abrush', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 45, fontSize: 15, color: '#e11d48',
      strokeWidth: 1.2, strokeColor: '#ffffff',
      rotation: -3,
      shadowColor: '#111827', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 73, fontSize: 3.1, letterSpacing: 6, color: '#e11d48', fontWeight: 800,
    },
  },
  {
    key: 'gym-power',
    label: 'Gym Power',
    bg: bgConcrete,
    en: { main: 'NO LIMIT', sub: 'TRAIN HARD DAILY', font: 'gladolia', subFont: 'montserrat' },
    mm: { main: 'အကန့်အသတ်မဲ့', sub: 'နေ့စဉ်လေ့ကျင့်', font: 'layaungthit-k16', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#f8fafc',
      strokeWidth: 2.4, strokeColor: '#020617',
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 6,
      letterSpacing: 1,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 6, color: '#22d3ee', fontWeight: 700,
    },
  },
  {
    key: 'food-fresh',
    label: 'Food Fresh',
    bg: bgGrungePaper,
    en: { main: 'TASTY', sub: 'FRESH EVERY DAY', font: 'beachday', subFont: 'poppins' },
    mm: { main: 'အရသာ', sub: 'နေ့စဉ်လတ်ဆတ်', font: 'layaungthit-k19', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 46, fontSize: 12, color: '#7c2d12',
      strokeWidth: 0, strokeColor: '#fff7ed',
      letterSpacing: 3,
      shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 71, fontSize: 2.9, letterSpacing: 7, color: '#f97316', fontWeight: 500,
    },
  },
  {
    key: 'travel-far',
    label: 'Travel',
    bg: bgSnowPeaks,
    en: { main: 'EXPLORE', sub: 'GO SEE THE WORLD', font: 'moldie', subFont: 'oswald' },
    mm: { main: 'ခရီးသွား', sub: 'ကမ္ဘာကိုလှည့်လည်', font: 'layaungthit-k25', subFont: 'layaungthit-k26' },
    main: {
      x: 50, y: 45, fontSize: 14, color: '#0f172a',
      strokeWidth: 2.4, strokeColor: '#ffffff',
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 6,
      letterSpacing: 1,
    },
    sub: {
      x: 50, y: 73, fontSize: 3, letterSpacing: 6, color: '#0284c7', fontWeight: 700,
    },
  },
  {
    key: 'music-night',
    label: 'Music Night',
    bg: bgNeonCity,
    en: { main: 'LIVE', sub: 'SOUND OF THE NIGHT', font: 'child-hood', subFont: 'bebas' },
    mm: { main: 'တေးဂီတ', sub: 'ညရဲ့အသံ', font: 'layaungthit-k26', subFont: 'layaungthit-k57' },
    main: {
      x: 50, y: 44, fontSize: 11, color: '#ffffff',
      strokeWidth: 0.6, strokeColor: '#a21caf',
      shadowColor: '#22d3ee', shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
      letterSpacing: 2,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 8, color: '#22d3ee', fontWeight: 600,
    },
  },
  {
    key: 'coffee-time',
    label: 'Coffee',
    bg: bgGrungePaper,
    en: { main: 'COFFEE', sub: 'SLOW MORNINGS', font: 'mochi-boom', subFont: 'inter' },
    mm: { main: 'ကော်ဖီ', sub: 'နှေးကွေးသောနံနက်', font: 'layaungthit-k36', subFont: 'layaungthit-k6' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#3b2314',
      strokeWidth: 1.2, strokeColor: '#f5e6cf',
      rotation: 3,
      shadowColor: '#a16207', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 72, fontSize: 3.1, letterSpacing: 6, color: '#3b2314', fontWeight: 800,
    },
  },
  {
    key: 'love-note',
    label: 'Love Note',
    bg: bgBlossom,
    en: { main: 'LOVE', sub: 'WORDS FROM HEART', font: 'mochi-boom-extrude', subFont: 'playfair' },
    mm: { main: 'ချစ်ခြင်း', sub: 'နှလုံးသားစကား', font: 'layaungthit-k39', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 45, fontSize: 14, color: '#ffffff',
      strokeWidth: 0.9, strokeColor: '#831843',
      fillType: 'gradient', gradientFrom: '#ffffff', gradientTo: '#fb7185', gradientAngle: 120,
      shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 20, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 72, fontSize: 3, letterSpacing: 6, color: '#ffffff', fontWeight: 500,
    },
  },
  {
    key: 'game-on',
    label: 'Game On',
    bg: bgCyberGrid,
    en: { main: 'GAME ON', sub: 'LEVEL UP NOW', font: 'milkyway', subFont: 'montserrat' },
    mm: { main: 'ဂိမ်းစ', sub: 'အဆင့်တိုးမြှင့်', font: 'layaungthit-k48', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 45, fontSize: 14, color: '#a3e635',
      strokeWidth: 1.6, strokeColor: '#0b1120',
      depthOn: true, depth: 9, depthColor: '#7c3aed', depthDarken: 0.3,
      rotation: -4,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 72, fontSize: 3.2, letterSpacing: 5, color: '#a3e635', fontWeight: 700,
    },
  },
  {
    key: 'news-flash',
    label: 'News Flash',
    bg: bgBlueRays,
    en: { main: 'BREAKING', sub: 'LATEST UPDATE', font: 'talina', subFont: 'poppins' },
    mm: { main: 'သတင်းအမြန်', sub: 'နောက်ဆုံးရသတင်း', font: 'layaungthit-k49', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 15, color: '#ffffff',
      strokeWidth: 1.2, strokeColor: '#7f1d1d',
      rotation: -2,
      shadowColor: '#dc2626', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 72, fontSize: 3.1, letterSpacing: 6, color: '#ffffff', fontWeight: 800,
    },
  },
  {
    key: 'quote-day',
    label: 'Quote',
    bg: bgForestMist,
    en: { main: 'BE KIND', sub: 'QUOTE OF THE DAY', font: 'puffberry', subFont: 'oswald' },
    mm: { main: 'ကြင်နာပါ', sub: 'ယနေ့စကားပုံ', font: 'layaungthit-k54', subFont: 'layaungthit-k26' },
    main: {
      x: 50, y: 46, fontSize: 13, color: '#0f2a1e',
      strokeWidth: 0, strokeColor: '#ffffff',
      letterSpacing: 3,
      shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 70, fontSize: 2.9, letterSpacing: 7, color: '#65a30d', fontWeight: 500,
    },
  },
  {
    key: 'sport-run',
    label: 'Sport Run',
    bg: bgStadium,
    en: { main: 'FASTER', sub: 'BEAT YOUR RECORD', font: 'saphifen', subFont: 'bebas' },
    mm: { main: 'ပိုမြန်စွာ', sub: 'စံချိန်ချိုးပါ', font: 'layaungthit-k56', subFont: 'layaungthit-k57' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ffffff',
      strokeWidth: 1.6, strokeColor: '#0b1b3a',
      depthOn: true, depth: 12, depthColor: '#f97316', depthDarken: 0.3,
      rotation: 2,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 71, fontSize: 3.2, letterSpacing: 5, color: '#ffffff', fontWeight: 700,
    },
  },
  {
    key: 'beach-club',
    label: 'Beach Club',
    bg: bgBeach,
    en: { main: 'VACAY', sub: 'SUN SAND SEA', font: 'mocka', subFont: 'inter' },
    mm: { main: 'အားလပ်ရက်', sub: 'နေ သဲ ပင်လယ်', font: 'layaungthit-k58', subFont: 'layaungthit-k6' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#fffaf0',
      strokeWidth: 2.4, strokeColor: '#7c3f00',
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 6,
      letterSpacing: 1,
    },
    sub: {
      x: 50, y: 72, fontSize: 3, letterSpacing: 6, color: '#06b6d4', fontWeight: 700,
    },
  },
  {
    key: 'moon-light',
    label: 'Moon Light',
    bg: bgStarryNight,
    en: { main: 'MOONLIT', sub: 'QUIET HOURS', font: 'outline-bubble', subFont: 'playfair' },
    mm: { main: 'လမင်း', sub: 'တိတ်ဆိတ်နာရီများ', font: 'layaungthit-k60', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 44, fontSize: 13, color: '#f8fafc',
      strokeWidth: 0.6, strokeColor: '#312e81',
      shadowColor: '#c4b5fd', shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
      letterSpacing: 2,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 8, color: '#c4b5fd', fontWeight: 600,
    },
  },
  {
    key: 'thunder-hit',
    label: 'Thunder',
    bg: bgBlueSmoke,
    en: { main: 'THUNDER', sub: 'LOUD & PROUD', font: 'molen-friend', subFont: 'montserrat' },
    mm: { main: 'မိုးကြိုး', sub: 'ကျယ်လောင်စွာ', font: 'layaungthit-k61', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 45, fontSize: 12, color: '#fde047',
      strokeWidth: 1.6, strokeColor: '#0b1120',
      depthOn: true, depth: 10, depthColor: '#3b82f6', depthDarken: 0.3,
      rotation: -4,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 70, fontSize: 3.2, letterSpacing: 5, color: '#fde047', fontWeight: 700,
    },
  },
  {
    key: 'candy-shop',
    label: 'Candy Shop',
    bg: bgMemphis,
    en: { main: 'SWEET', sub: 'SUGAR RUSH', font: 'baby-gemoy', subFont: 'poppins' },
    mm: { main: 'ချိုမြိန်', sub: 'သကြားအရသာ', font: 'layaungthit-k65', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ffffff',
      strokeWidth: 1.6, strokeColor: '#be185d',
      depthOn: true, depth: 11, depthColor: '#fb7185', depthDarken: 0.3,
      rotation: -2,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 71, fontSize: 3.2, letterSpacing: 5, color: '#ffffff', fontWeight: 700,
    },
  },
  {
    key: 'art-studio',
    label: 'Art Studio',
    bg: bgGraffiti,
    en: { main: 'CREATE', sub: 'MAKE SOMETHING', font: 'the-last-trunks', subFont: 'oswald' },
    mm: { main: 'ဖန်တီး', sub: 'တစ်ခုခုဖန်တီးပါ', font: 'myanmargantgaw', subFont: 'layaungthit-k26' },
    main: {
      x: 50, y: 45, fontSize: 14, color: '#111827',
      strokeWidth: 1.2, strokeColor: '#ffffff',
      rotation: 0,
      shadowColor: '#facc15', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 73, fontSize: 3.1, letterSpacing: 6, color: '#111827', fontWeight: 800,
    },
  },
  {
    key: 'tech-future',
    label: 'Tech',
    bg: bgVhs,
    en: { main: 'FUTURE', sub: 'NEXT GENERATION', font: 'dream-kudos', subFont: 'bebas' },
    mm: { main: 'အနာဂတ်', sub: 'နောက်မျိုးဆက်', font: 'myanmarkuttar', subFont: 'layaungthit-k57' },
    main: {
      x: 50, y: 44, fontSize: 11, color: '#ffffff',
      strokeWidth: 0.6, strokeColor: '#0891b2',
      shadowColor: '#f472b6', shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
      letterSpacing: 2,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 8, color: '#f472b6', fontWeight: 600,
    },
  },
  {
    key: 'harvest-day',
    label: 'Harvest',
    bg: bgGreenField,
    en: { main: 'HARVEST', sub: 'GOLDEN FIELDS', font: 'gladolia', subFont: 'inter' },
    mm: { main: 'ရိတ်သိမ်း', sub: 'ရွှေရောင်လယ်ကွင်း', font: 'myanmarsabae', subFont: 'layaungthit-k6' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#fffbeb',
      strokeWidth: 2.4, strokeColor: '#14532d',
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 6,
      letterSpacing: 1,
    },
    sub: {
      x: 50, y: 72, fontSize: 3, letterSpacing: 6, color: '#ca8a04', fontWeight: 700,
    },
  },
  {
    key: 'desert-road',
    label: 'Desert Road',
    bg: bgDesertDunes,
    en: { main: 'JOURNEY', sub: 'LONG WAY HOME', font: 'beachday', subFont: 'playfair' },
    mm: { main: 'ခရီးရှည်', sub: 'အိမ်ပြန်လမ်း', font: 'myanmarsquare', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 46, fontSize: 13, color: '#fff7ed',
      strokeWidth: 0, strokeColor: '#7c2d12',
      letterSpacing: 3,
      shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 71, fontSize: 2.9, letterSpacing: 7, color: '#fdba74', fontWeight: 500,
    },
  },
  {
    key: 'rain-lofi',
    label: 'Lo-Fi Rain',
    bg: bgRainWindow,
    en: { main: 'LO-FI', sub: 'CHILL BEATS', font: 'moldie', subFont: 'montserrat' },
    mm: { main: 'လိုဖိုင်', sub: 'အေးဆေးသံစဉ်', font: 'myanmaryinmar', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 46, fontSize: 11, color: '#e0f2fe',
      strokeWidth: 0, strokeColor: '#082f49',
      letterSpacing: 3,
      shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 72, fontSize: 2.9, letterSpacing: 7, color: '#7dd3fc', fontWeight: 500,
    },
  },
  {
    key: 'gold-invite',
    label: 'Gold Invite',
    bg: bgBlackMarble,
    en: { main: 'INVITE', sub: 'YOU ARE INVITED', font: 'child-hood', subFont: 'poppins' },
    mm: { main: 'ဖိတ်ကြား', sub: 'သင့်ကိုဖိတ်ကြားပါသည်', font: 'koz008', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ffe9b0',
      strokeWidth: 0.9, strokeColor: '#241a00',
      fillType: 'gradient', gradientFrom: '#ffe9b0', gradientTo: '#c9962c', gradientAngle: 180,
      shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 20, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 6, color: '#ffe9b0', fontWeight: 500,
    },
  },
  {
    key: 'fresh-start',
    label: 'Fresh Start',
    bg: bgSunsetSea,
    en: { main: 'NEW DAY', sub: 'START AGAIN', font: 'mochi-boom', subFont: 'oswald' },
    mm: { main: 'နေ့သစ်', sub: 'အသစ်ပြန်စ', font: 'koz033', subFont: 'layaungthit-k26' },
    main: {
      x: 50, y: 45, fontSize: 14, color: '#ffffff',
      strokeWidth: 2.4, strokeColor: '#7c2d12',
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 6,
      letterSpacing: 1,
    },
    sub: {
      x: 50, y: 73, fontSize: 3, letterSpacing: 6, color: '#fb923c', fontWeight: 700,
    },
  },
  {
    key: 'power-up',
    label: 'Power Up',
    bg: bgEmbers,
    en: { main: 'POWER', sub: 'ENERGY BOOST', font: 'mochi-boom-extrude', subFont: 'bebas' },
    mm: { main: 'စွမ်းအား', sub: 'စွမ်းအင်တိုးမြှင့်', font: 'koz052', subFont: 'layaungthit-k57' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ffffff',
      strokeWidth: 1.6, strokeColor: '#450a0a',
      depthOn: true, depth: 9, depthColor: '#f59e0b', depthDarken: 0.3,
      rotation: 2,
      shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 14, shadowOffsetX: 3, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 71, fontSize: 3.2, letterSpacing: 5, color: '#ffffff', fontWeight: 700,
    },
  },
  {
    key: 'mono-line',
    label: 'Mono Line',
    bg: bgGrungePaper,
    en: { main: 'MINIMAL', sub: 'LESS IS MORE', font: 'milkyway', subFont: 'inter' },
    mm: { main: 'ရိုးရှင်း', sub: 'နည်းလေလှလေ', font: 'abrush', subFont: 'layaungthit-k6' },
    main: {
      x: 50, y: 46, fontSize: 12, color: '#1c1917',
      strokeWidth: 0, strokeColor: '#fafaf9',
      letterSpacing: 3,
      shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 72, fontSize: 2.9, letterSpacing: 7, color: '#78716c', fontWeight: 500,
    },
  },
  {
    key: 'wild-life',
    label: 'Wild Life',
    bg: bgForestMist,
    en: { main: 'WILD', sub: 'FREE SPIRIT', font: 'talina', subFont: 'playfair' },
    mm: { main: 'တောရိုင်း', sub: 'လွတ်လပ်စိတ်', font: 'layaungthit-k16', subFont: 'layaungthit-k54' },
    main: {
      x: 50, y: 45, fontSize: 15, color: '#f0fdf4',
      strokeWidth: 1.2, strokeColor: '#052e16',
      rotation: -3,
      shadowColor: '#16a34a', shadowBlur: 0, shadowOffsetX: 6, shadowOffsetY: 6,
    },
    sub: {
      x: 50, y: 73, fontSize: 3.1, letterSpacing: 6, color: '#f0fdf4', fontWeight: 800,
    },
  },
  {
    key: 'city-pulse',
    label: 'City Pulse',
    bg: bgNeonCity,
    en: { main: 'PULSE', sub: 'NEVER SLEEPS', font: 'puffberry', subFont: 'montserrat' },
    mm: { main: 'မြို့ရဲ့နှလုံးခုန်', sub: 'ဘယ်တော့မှမအိပ်', font: 'layaungthit-k19', subFont: 'layaungthit-k44' },
    main: {
      x: 50, y: 44, fontSize: 11, color: '#ffffff',
      strokeWidth: 0.6, strokeColor: '#f43f5e',
      shadowColor: '#38bdf8', shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
      letterSpacing: 2,
    },
    sub: {
      x: 50, y: 68, fontSize: 3, letterSpacing: 8, color: '#38bdf8', fontWeight: 600,
    },
  },
  {
    key: 'magic-hour',
    label: 'Magic Hour',
    bg: bgLiquidPurple,
    en: { main: 'MAGIC', sub: 'LIGHT & SHADOW', font: 'saphifen', subFont: 'poppins' },
    mm: { main: 'မှော်ဆန်', sub: 'အလင်းနှင့်အရိပ်', font: 'layaungthit-k25', subFont: 'layaungthit-k39' },
    main: {
      x: 50, y: 45, fontSize: 13, color: '#ffffff',
      strokeWidth: 0.9, strokeColor: '#3b0764',
      fillType: 'gradient', gradientFrom: '#ffffff', gradientTo: '#c084fc', gradientAngle: 120,
      shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 20, shadowOffsetX: 0, shadowOffsetY: 8,
    },
    sub: {
      x: 50, y: 71, fontSize: 3, letterSpacing: 6, color: '#ffffff', fontWeight: 500,
    },
  },
]

export const PREMIUM_TEMPLATES_2 = PREMIUM_DESIGNS_2.flatMap(premiumTemplatePair)
