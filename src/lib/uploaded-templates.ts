/**
 * Templates imported from the user's exported "My templates" files.
 * Backgrounds live on the asset CDN; shown on the home screen under gradients.
 */
import type { TextLayer } from '@/lib/text-layer'
import type { TemplateDef, TemplateLang } from '@/lib/templates'

import a0 from '@/assets/templates/en-premium-luxe-noir.jpg.asset.json'
import a1 from '@/assets/templates/en-premium-magic-glow.jpg.asset.json'
import a2 from '@/assets/templates/en-premium-magic-hour.jpg.asset.json'
import a3 from '@/assets/templates/en-premium-moon-light.jpg.asset.json'
import a4 from '@/assets/templates/en-premium-ocean-dream.jpg.asset.json'
import a5 from '@/assets/templates/en-premium-smoke-mystic.jpg.asset.json'
import a6 from '@/assets/templates/en-premium-spoof-sticker.jpg.asset.json'
import a7 from '@/assets/templates/mm-new-my-1785428030631-foud4.jpg.asset.json'
import a8 from '@/assets/templates/mm-new-my-1785428509553-rv521.jpg.asset.json'
import a9 from '@/assets/templates/mm-new-my-1785428917141-h4fcm.jpg.asset.json'
import a10 from '@/assets/templates/mm-premium-liquid-wave.jpg.asset.json'
import a11 from '@/assets/templates/mm-premium-travel-far.jpg.asset.json'

import data from '@/lib/uploaded-templates.json'

const ASSETS: Record<string, string> = {
  'en-premium-luxe-noir.jpg': a0.url,
  'en-premium-magic-glow.jpg': a1.url,
  'en-premium-magic-hour.jpg': a2.url,
  'en-premium-moon-light.jpg': a3.url,
  'en-premium-ocean-dream.jpg': a4.url,
  'en-premium-smoke-mystic.jpg': a5.url,
  'en-premium-spoof-sticker.jpg': a6.url,
  'mm-new-my-1785428030631-foud4.jpg': a7.url,
  'mm-new-my-1785428509553-rv521.jpg': a8.url,
  'mm-new-my-1785428917141-h4fcm.jpg': a9.url,
  'mm-premium-liquid-wave.jpg': a10.url,
  'mm-premium-travel-far.jpg': a11.url,
}

interface RawTemplate {
  id: string
  name: string
  lang: TemplateLang
  group: string
  bg?: string
  layers: TextLayer[]
}

export const UPLOADED_TEMPLATES: TemplateDef[] = (
  data.templates as unknown as RawTemplate[]
).map((t) => ({
  id: `up-${t.id}`,
  name: t.name,
  lang: t.lang,
  group: t.group,
  bg: t.bg?.startsWith('asset:') ? ASSETS[t.bg.slice(6)] : t.bg,
  build: () => t.layers.map((l, idx) => ({ ...l, id: `${t.id}-${idx}-${Date.now()}` })),
}))
