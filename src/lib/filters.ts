import { DEFAULT_ADJUSTMENTS, renderAdjusted, type Adjustments } from './image-adjust'

export type FilterGroup = 'classic' | 'aesthetic' | 'vsco'

export interface FilterPreset {
  id: string
  name: string
  group: FilterGroup
  adjust: Partial<Adjustments>
}

export const FILTER_GROUPS: { key: FilterGroup; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'aesthetic', label: 'Aesthetic' },
  { key: 'vsco', label: 'VSCO' },
]

const c = (adjust: Partial<Adjustments>, name: string, group: FilterGroup): FilterPreset => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  group,
  adjust,
})

export const FILTERS: FilterPreset[] = [
  // --- Classic ---
  c({ contrast: 20, saturation: 25, warmth: 8, highlights: -10 }, 'Clarendon', 'classic'),
  c({ contrast: 10, saturation: 30, warmth: 18, shadows: 8 }, 'Juno', 'classic'),
  c({ exposure: 10, contrast: -6, saturation: -8, tint: 10, shadows: 12 }, 'Lark', 'classic'),
  c({ warmth: 22, saturation: -12, contrast: 8, fade: 18 }, 'Valencia', 'classic'),
  c({ saturation: -30, fade: 22, brightness: 6, contrast: -8 }, 'Gingham', 'classic'),
  c({ warmth: 12, saturation: 10, contrast: 12, vignette: 12 }, 'Ludwig', 'classic'),
  c({ fade: 30, saturation: -20, brightness: 10, contrast: -12 }, 'Reyes', 'classic'),
  c({ warmth: 14, saturation: 14, brightness: 6, clarity: 10 }, 'Crema', 'classic'),
  c({ warmth: 18, saturation: -6, fade: 14, highlights: -12 }, 'Amaro', 'classic'),
  c({ tint: 14, saturation: 18, brightness: 8, contrast: 6 }, 'Mayfair', 'classic'),
  c({ warmth: 20, brightness: 8, saturation: 6, fade: 10 }, 'Rise', 'classic'),
  c({ tint: -16, brightness: 6, saturation: -6, vignette: 16 }, 'Hudson', 'classic'),
  c({ contrast: 26, saturation: 16, vignette: 26, warmth: -8 }, 'X-Pro II', 'classic'),
  c({ contrast: 22, saturation: 22, vignette: 18, shadows: -10 }, 'Lo-fi', 'classic'),
  c({ fade: 24, contrast: -10, vignette: 22, tint: 8 }, 'Sierra', 'classic'),
  c({ warmth: 16, contrast: 12, saturation: -10, vignette: 20 }, 'Earlybird', 'classic'),
  c({ contrast: 18, saturation: -24, vignette: 30, warmth: 10 }, 'Sutro', 'classic'),
  c({ warmth: 24, contrast: 14, vignette: 24, saturation: -8 }, 'Toaster', 'classic'),
  c({ warmth: 12, contrast: 16, saturation: 8, shadows: 10 }, 'Brannan', 'classic'),
  c({ saturation: -100, contrast: 18 }, 'Inkwell', 'classic'),

  // --- Aesthetic & Trendy ---
  c({ brightness: 14, fade: 20, saturation: -14, tint: 8 }, 'White Rose', 'aesthetic'),
  c({ saturation: 30, hue: 12, contrast: 14, vibrance: 20 }, 'Prism', 'aesthetic'),
  c({ saturation: -100, contrast: 22, clarity: 16 }, 'BW Preview', 'aesthetic'),
  c({ saturation: -100, fade: 24, grain: 24, contrast: 10 }, 'Muybridge', 'aesthetic'),
  c({ fade: 26, warmth: 10, contrast: -8, vignette: 10, grain: 12 }, 'Polaroid', 'aesthetic'),
  c({ hue: 30, saturation: 40, contrast: 16, dispersion: 30 }, 'Trippy Vibe', 'aesthetic'),
  c({ denoise: 60, clarity: -30, brightness: 4 }, 'Blurred Face', 'aesthetic'),
  c({ fade: 18, contrast: 14, tint: 12, saturation: 10 }, 'Double Expo', 'aesthetic'),
  c({ warmth: 16, saturation: 26, brightness: 8, vibrance: 18 }, 'Summer Prism', 'aesthetic'),
  c({ warmth: 18, saturation: 12, fade: 12, highlights: -8 }, 'Sicily', 'aesthetic'),
  c({ brightness: 10, highlights: 14, warmth: 12, fade: 14 }, 'Delicate Rays', 'aesthetic'),
  c({ exposure: -12, contrast: 22, shadows: -18, saturation: -10, vignette: 20 }, 'Moody Dark', 'aesthetic'),
  c({ warmth: 14, tint: 10, saturation: -8, brightness: 8, fade: 16 }, 'Soft Peach', 'aesthetic'),
  c({ warmth: 26, brightness: 8, saturation: 18, highlights: 10 }, 'Golden Hour', 'aesthetic'),
  c({ fade: 22, grain: 26, warmth: 12, contrast: 8 }, 'Retro Film', 'aesthetic'),
  c({ warmth: 18, saturation: -16, fade: 20, grain: 18, vignette: 14 }, 'Vintage Vibe', 'aesthetic'),
  c({ fade: 28, saturation: -12, brightness: 12, contrast: -10 }, 'Pastel Dream', 'aesthetic'),
  c({ warmth: -22, contrast: 20, shadows: -12, saturation: -6 }, 'Cinematic Blue', 'aesthetic'),
  c({ saturation: 42, vibrance: 28, contrast: 18, hue: -12 }, 'Neon Glow', 'aesthetic'),
  c({ warmth: 24, saturation: 14, highlights: -12, vignette: 16 }, 'Warm Sunset', 'aesthetic'),

  // --- VSCO style presets ---
  c({ fade: 18, warmth: 10, saturation: -6, contrast: 8 }, 'A6', 'vsco'),
  c({ warmth: 14, fade: 12, brightness: 6, saturation: 8 }, 'C1', 'vsco'),
  c({ warmth: -10, fade: 16, contrast: 10, saturation: -8 }, 'F2', 'vsco'),
  c({ fade: 20, tint: 10, brightness: 6, saturation: -10 }, 'M5', 'vsco'),
  c({ contrast: 16, saturation: -14, fade: 14, shadows: -8 }, 'S2', 'vsco'),
  c({ saturation: -100, contrast: 14, fade: 12 }, 'HB1', 'vsco'),
  c({ warmth: 12, contrast: 12, saturation: 10, fade: 10 }, 'T1', 'vsco'),
  c({ tint: 14, fade: 18, brightness: 8, saturation: -6 }, 'P5', 'vsco'),
  c({ warmth: -14, contrast: 14, fade: 10, saturation: -4 }, 'K1', 'vsco'),
  c({ warmth: 8, fade: 22, contrast: -6, saturation: -12, grain: 14 }, 'N1', 'vsco'),
]

export function filterAdjustments(preset: FilterPreset, intensity = 100): Adjustments {
  const k = Math.max(0, Math.min(100, intensity)) / 100
  const out = { ...DEFAULT_ADJUSTMENTS }
  for (const [key, value] of Object.entries(preset.adjust)) {
    const typed = key as keyof Adjustments
    out[typed] = Math.round((value as number) * k)
  }
  return out
}

export function renderFiltered(
  img: HTMLImageElement | HTMLCanvasElement,
  preset: FilterPreset,
  intensity = 100,
  maxSize?: number,
) {
  return renderAdjusted(img, filterAdjustments(preset, intensity), maxSize)
}
