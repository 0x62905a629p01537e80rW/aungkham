/**
 * Templates imported from a user-exported "My templates" file.
 * They are registered under the Myanmar language in the "New" group.
 */
import type { TextLayer } from '@/lib/text-layer'
import type { TemplateDef } from '@/lib/templates'

import bgBlueRays from '@/assets/templates/bg-blue-rays.jpg'
import bgYellowPop from '@/assets/templates/bg-yellow-pop.jpg'
import bgConcrete from '@/assets/templates/bg-concrete.jpg'
import bgBeach from '@/assets/templates/bg-beach.jpg'
import bgNeonCity from '@/assets/templates/bg-neon-city.jpg'
import bgPastelSky from '@/assets/templates/bg-pastel-sky.jpg'
import bgStadium from '@/assets/templates/bg-stadium.jpg'
import bgGoldBokeh from '@/assets/templates/bg-gold-bokeh.jpg'

import data from '@/lib/imported-templates.json'

const ASSETS: Record<string, string> = {
  'bg-blue-rays': bgBlueRays,
  'bg-yellow-pop': bgYellowPop,
  'bg-concrete': bgConcrete,
  'bg-beach': bgBeach,
  'bg-neon-city': bgNeonCity,
  'bg-pastel-sky': bgPastelSky,
  'bg-stadium': bgStadium,
  'bg-gold-bokeh': bgGoldBokeh,
}

interface RawTemplate {
  id: string
  name: string
  bg?: string
  layers: TextLayer[]
}

function resolveBg(bg?: string) {
  if (!bg) return undefined
  if (bg.startsWith('asset:')) return ASSETS[bg.slice(6)]
  return bg
}

const ORDINALS = [
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
]

export const IMPORTED_TEMPLATES: TemplateDef[] = (data.templates as unknown as RawTemplate[]).map(
  (t, i) => ({
    id: `MM-new-${t.id}`,
    name: ORDINALS[i] ?? `New ${i + 1}`,
    lang: 'MM' as const,
    group: 'New',
    bg: resolveBg(t.bg),
    build: () => t.layers.map((l, idx) => ({ ...l, id: `${t.id}-${idx}-${Date.now()}` })),
  }),
)
