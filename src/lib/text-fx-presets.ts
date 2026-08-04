import type { TextLayer } from '@/lib/text-layer'
import { TEXT_LABELS, type LabelKey } from '@/lib/text-labels'

/**
 * One-tap "Effects" presets — Featured / Glitch / Label / Festival.
 *
 * A preset is just a patch of look properties applied to the selected text
 * layer, so everything stays editable afterwards.
 */
export type FxGroup = 'featured' | 'glitch' | 'label' | 'festival'

export interface FxPreset {
  key: string
  label: string
  group: FxGroup
  pro?: boolean
  /** sample glyph shown on the tile */
  sample?: string
  patch: Partial<TextLayer>
}

/** Cleared by every preset so looks never stack on top of each other. */
export const FX_RESET: Partial<TextLayer> = {
  effect: 'none',
  fillType: 'solid',
  strokeWidth: 0,
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  depthOn: false,
  liquidOn: false,
  highlight: false,
  label: undefined,
  labelFill: undefined,
  labelAccent: undefined,
}

const p = (patch: Partial<TextLayer>): Partial<TextLayer> => ({ ...FX_RESET, ...patch })

const FEATURED: FxPreset[] = [
  {
    key: 'gold',
    label: 'Gold',
    group: 'featured',
    patch: p({
      fillType: 'gradient',
      gradientFrom: '#f9e08c',
      gradientTo: '#b8860b',
      gradientAngle: 100,
      strokeWidth: 6,
      strokeColor: '#5a3d05',
      fontWeight: 800,
      shadowColor: '#00000066',
      shadowBlur: 20,
      shadowOffsetY: 6,
    }),
  },
  {
    key: 'sticker',
    label: 'Sticker',
    group: 'featured',
    patch: p({
      color: '#ffffff',
      strokeWidth: 18,
      strokeColor: '#111827',
      fontWeight: 900,
      shadowColor: '#00000055',
      shadowBlur: 14,
      shadowOffsetY: 8,
    }),
  },
  {
    key: 'neon',
    label: 'Neon',
    group: 'featured',
    patch: p({ color: '#ffffff', effect: 'neon', effectColor: '#22d3ee', effectIntensity: 70 }),
  },
  {
    key: 'candy',
    label: 'Candy',
    group: 'featured',
    patch: p({
      fillType: 'gradient',
      gradientFrom: '#ff8fd0',
      gradientTo: '#7c5cff',
      gradientAngle: 120,
      strokeWidth: 8,
      strokeColor: '#ffffff',
      fontWeight: 800,
    }),
  },
  {
    key: 'retro',
    label: 'Retro',
    group: 'featured',
    patch: p({
      color: '#ffe066',
      effect: 'echo',
      effectColor: '#e0483a',
      effectOffset: 55,
      effectDirection: 30,
      fontWeight: 800,
    }),
  },
  {
    key: 'hollow',
    label: 'Hollow',
    group: 'featured',
    patch: p({ color: '#ffffff', effect: 'hollow', effectThickness: 45 }),
  },
  {
    key: 'chrome',
    label: 'Chrome',
    group: 'featured',
    pro: true,
    patch: p({
      fillType: 'gradient',
      gradientFrom: '#ffffff',
      gradientTo: '#7b8794',
      gradientAngle: 90,
      strokeWidth: 6,
      strokeColor: '#2f3640',
      effect: 'emboss',
      fontWeight: 900,
    }),
  },
  {
    key: 'fire',
    label: 'Fire',
    group: 'featured',
    patch: p({
      fillType: 'gradient',
      gradientFrom: '#ffd166',
      gradientTo: '#ef233c',
      gradientAngle: 90,
      shadowColor: '#ff6b0055',
      shadowBlur: 30,
      fontWeight: 900,
    }),
  },
  {
    key: 'shadow3d',
    label: '3D Pop',
    group: 'featured',
    patch: p({ color: '#ffffff', depthOn: true, depth: 14, depthColor: '#2563eb', depthDarken: 10, fontWeight: 900 }),
  },
  {
    key: 'longshadow',
    label: 'Long',
    group: 'featured',
    pro: true,
    patch: p({ color: '#ffffff', effect: 'longshadow', effectColor: '#111827', effectOffset: 70 }),
  },
  {
    key: 'lift',
    label: 'Lift',
    group: 'featured',
    patch: p({ color: '#ffffff', effect: 'lift', effectIntensity: 60 }),
  },
  {
    key: 'splice',
    label: 'Splice',
    group: 'featured',
    patch: p({ color: '#ffffff', effect: 'splice', effectColor: '#ff36c8', effectThickness: 45 }),
  },
]

const GLITCH: FxPreset[] = [
  {
    key: 'rgb',
    label: 'RGB',
    group: 'glitch',
    patch: p({ color: '#ffffff', effect: 'glitch', effectOffset: 45, effectDirection: 0, fontWeight: 800 }),
  },
  {
    key: 'vhs',
    label: 'VHS',
    group: 'glitch',
    patch: p({ color: '#e8f7ff', effect: 'glitch', effectOffset: 70, effectDirection: 90, skewX: -6 }),
  },
  {
    key: 'tear',
    label: 'Tear',
    group: 'glitch',
    pro: true,
    patch: p({ color: '#ffffff', effect: 'glitch', effectOffset: 90, effectDirection: 15, skewX: -12, italic: true }),
  },
  {
    key: 'ghost',
    label: 'Ghost',
    group: 'glitch',
    patch: p({ color: '#ffffff', opacity: 0.75, effect: 'echo', effectColor: '#8ecae6', effectOffset: 65, effectDirection: 180 }),
  },
  {
    key: 'chroma',
    label: 'Chroma',
    group: 'glitch',
    patch: p({
      fillType: 'gradient',
      gradientFrom: '#00f5d4',
      gradientTo: '#f15bb5',
      gradientAngle: 45,
      effect: 'glitch',
      effectOffset: 35,
      fontWeight: 800,
    }),
  },
  {
    key: 'matrix',
    label: 'Matrix',
    group: 'glitch',
    patch: p({ color: '#39ff14', effect: 'neon', effectColor: '#00b300', effectIntensity: 55, letterSpacing: 12 }),
  },
  {
    key: 'static',
    label: 'Static',
    group: 'glitch',
    pro: true,
    patch: p({
      color: '#ffffff',
      effect: 'glitch',
      effectOffset: 30,
      effectDirection: 135,
      strokeWidth: 4,
      strokeColor: '#7c3aed',
    }),
  },
  {
    key: 'signal',
    label: 'Signal',
    group: 'glitch',
    patch: p({ color: '#111827', highlight: true, highlightColor: '#f1f5f9', effect: 'glitch', effectOffset: 55 }),
  },
]

function labelPresets(group: 'label' | 'festival'): FxPreset[] {
  return TEXT_LABELS.filter((l) => l.group === group).map((l) => ({
    key: `${group}-${l.key}`,
    label: l.label,
    group,
    pro: l.pro,
    patch: p({
      label: l.key as LabelKey,
      labelFill: l.fill,
      labelAccent: l.accent,
      color: l.ink,
      fontWeight: 700,
      ...(l.key === 'neonsign'
        ? { effect: 'neon' as const, effectColor: l.accent, effectIntensity: 60 }
        : {}),
      ...(l.key === 'gold'
        ? { fillType: 'gradient' as const, gradientFrom: '#ffe9a8', gradientTo: '#c99b34', gradientAngle: 95 }
        : {}),
    }),
  }))
}

export const FX_GROUPS: { key: FxGroup; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'glitch', label: 'Glitch' },
  { key: 'label', label: 'Label' },
  { key: 'festival', label: 'Festival' },
]

export const FX_PRESETS: FxPreset[] = [
  ...FEATURED,
  ...GLITCH,
  ...labelPresets('label'),
  ...labelPresets('festival'),
]

export function fxPresets(group: FxGroup): FxPreset[] {
  return FX_PRESETS.filter((f) => f.group === group)
}
