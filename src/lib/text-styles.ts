import type { TextLayer } from './text-layer'

export type StylePatch = Partial<TextLayer>

export interface TextStylePreset {
  id: string
  name: string
  group: StyleGroup
  patch: StylePatch
}

export type StyleGroup = 'basic' | 'stroke' | 'shadow' | 'neon' | 'gradient' | 'retro' | '3d'

export const STYLE_GROUPS: { key: StyleGroup; label: string }[] = [
  { key: 'basic', label: 'Basic' },
  { key: 'stroke', label: 'Stroke' },
  { key: 'shadow', label: 'Shadow' },
  { key: 'neon', label: 'Neon' },
  { key: 'gradient', label: 'Gradient' },
  { key: 'retro', label: 'Retro' },
  { key: '3d', label: '3D' },
]

/** Every field a preset can touch — applied so styles never stack unexpectedly. */
export const STYLE_RESET: StylePatch = {
  color: '#000000',
  fillType: 'solid',
  gradientFrom: '#ff7a18',
  gradientTo: '#af002d',
  gradientAngle: 90,
  strokeWidth: 0,
  strokeColor: '#000000',
  shadowColor: '#000000',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  highlight: false,
  highlightColor: '#2563eb',
  depthOn: false,
  depth: 30,
  depthColor: '#1d4ed8',
  depthDarken: 48,
  opacity: 1,
  skewX: 0,
  skewY: 0,
}

const PALETTE: [string, string][] = [
  ['White', '#ffffff'],
  ['Black', '#000000'],
  ['Ink', '#0f172a'],
  ['Snow', '#f8fafc'],
  ['Red', '#ef4444'],
  ['Coral', '#fb7185'],
  ['Orange', '#f97316'],
  ['Amber', '#f59e0b'],
  ['Gold', '#eab308'],
  ['Lime', '#84cc16'],
  ['Green', '#22c55e'],
  ['Emerald', '#10b981'],
  ['Teal', '#14b8a6'],
  ['Cyan', '#06b6d4'],
  ['Sky', '#0ea5e9'],
  ['Blue', '#3b82f6'],
  ['Indigo', '#6366f1'],
  ['Violet', '#8b5cf6'],
  ['Purple', '#a855f7'],
  ['Pink', '#ec4899'],
]

const GRADIENTS: [string, string, string, number][] = [
  ['Sunrise', '#ff8a00', '#e52e71', 90],
  ['Ocean', '#2193b0', '#6dd5ed', 90],
  ['Grape', '#8e2de2', '#4a00e0', 120],
  ['Mango', '#ffe259', '#ffa751', 90],
  ['Mint', '#00b09b', '#96c93d', 90],
  ['Candy', '#ff9a9e', '#fad0c4', 90],
  ['Berry', '#c94b4b', '#4b134f', 120],
  ['Sky Fade', '#56ccf2', '#2f80ed', 90],
  ['Peach', '#ffecd2', '#fcb69f', 90],
  ['Fire', '#f12711', '#f5af19', 90],
  ['Aqua', '#13547a', '#80d0c7', 120],
  ['Lavender', '#a18cd1', '#fbc2eb', 90],
  ['Steel', '#bdc3c7', '#2c3e50', 90],
  ['Rose Gold', '#f4c4f3', '#fc67fa', 90],
  ['Neon Lime', '#a8ff78', '#78ffd6', 90],
  ['Deep Sea', '#000046', '#1cb5e0', 120],
  ['Sunset Pop', '#ff512f', '#dd2476', 45],
  ['Gold Bar', '#f7971e', '#ffd200', 90],
  ['Ice', '#e0eafc', '#cfdef3', 90],
  ['Cosmic', '#3a1c71', '#d76d77', 135],
]

function make(
  id: string,
  name: string,
  group: StyleGroup,
  patch: StylePatch,
): TextStylePreset {
  return { id, name, group, patch: { ...STYLE_RESET, ...patch } }
}

function build(): TextStylePreset[] {
  const out: TextStylePreset[] = []

  // Basic solid fills (20)
  PALETTE.forEach(([name, hex], i) => {
    out.push(make(`basic-${i}`, name, 'basic', { color: hex }))
  })

  // Stroke / outline styles (20)
  PALETTE.forEach(([name, hex], i) => {
    const outlineOnly = i % 2 === 0
    out.push(
      make(`stroke-${i}`, `${name} Outline`, 'stroke', {
        color: outlineOnly ? '#ffffff' : hex,
        strokeColor: outlineOnly ? hex : '#000000',
        strokeWidth: outlineOnly ? 3 : 2,
      }),
    )
  })

  // Drop shadow styles (16)
  PALETTE.slice(0, 16).forEach(([name, hex], i) => {
    out.push(
      make(`shadow-${i}`, `${name} Drop`, 'shadow', {
        color: '#ffffff',
        shadowColor: hex,
        shadowBlur: i % 3 === 0 ? 0 : 10,
        shadowOffsetX: 6,
        shadowOffsetY: 6,
      }),
    )
  })

  // Neon glow (16)
  PALETTE.slice(4, 20).forEach(([name, hex], i) => {
    out.push(
      make(`neon-${i}`, `${name} Neon`, 'neon', {
        color: '#ffffff',
        strokeColor: hex,
        strokeWidth: 1.5,
        shadowColor: hex,
        shadowBlur: 24,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      }),
    )
  })

  // Gradient fills (20)
  GRADIENTS.forEach(([name, from, to, angle], i) => {
    out.push(
      make(`grad-${i}`, name, 'gradient', {
        fillType: 'gradient',
        gradientFrom: from,
        gradientTo: to,
        gradientAngle: angle,
      }),
    )
  })

  // Retro / highlight / sticker looks (16)
  const retro: [string, StylePatch][] = [
    ['Sticker', { color: '#000000', strokeColor: '#ffffff', strokeWidth: 6 }],
    ['Poster', { color: '#ffffff', strokeColor: '#111827', strokeWidth: 4, shadowColor: '#f43f5e', shadowBlur: 0, shadowOffsetX: 5, shadowOffsetY: 5 }],
    ['Comic', { color: '#facc15', strokeColor: '#000000', strokeWidth: 4, shadowColor: '#000000', shadowBlur: 0, shadowOffsetX: 4, shadowOffsetY: 4 }],
    ['Marker', { color: '#ffffff', highlight: true, highlightColor: '#111827' }],
    ['Highlighter', { color: '#111827', highlight: true, highlightColor: '#fde047' }],
    ['Label Red', { color: '#ffffff', highlight: true, highlightColor: '#dc2626' }],
    ['Label Blue', { color: '#ffffff', highlight: true, highlightColor: '#2563eb' }],
    ['Label Mint', { color: '#0f172a', highlight: true, highlightColor: '#a7f3d0' }],
    ['Vintage', { color: '#f5e6c8', shadowColor: '#7c2d12', shadowBlur: 4, shadowOffsetX: 3, shadowOffsetY: 3 }],
    ['Chrome', { fillType: 'gradient', gradientFrom: '#e5e7eb', gradientTo: '#6b7280', gradientAngle: 90, strokeColor: '#111827', strokeWidth: 1.5 }],
    ['Ghost', { color: '#ffffff', opacity: 0.45 }],
    ['Faded', { color: '#0f172a', opacity: 0.5 }],
    ['Glitch', { color: '#22d3ee', shadowColor: '#f43f5e', shadowBlur: 0, shadowOffsetX: -5, shadowOffsetY: 4 }],
    ['Italic Ink', { color: '#0f172a', skewX: -12 }],
    ['Slanted Sun', { color: '#f59e0b', skewX: -10, strokeColor: '#7c2d12', strokeWidth: 2 }],
    ['Paper Cut', { color: '#ffffff', shadowColor: '#94a3b8', shadowBlur: 8, shadowOffsetX: 0, shadowOffsetY: 6 }],
  ]
  retro.forEach(([name, patch], i) => out.push(make(`retro-${i}`, name, 'retro', patch)))

  // 3D extrudes (14)
  const depths: [string, string, string][] = [
    ['3D Blue', '#ffffff', '#1d4ed8'],
    ['3D Red', '#ffffff', '#b91c1c'],
    ['3D Gold', '#fff7ed', '#b45309'],
    ['3D Green', '#ecfdf5', '#15803d'],
    ['3D Purple', '#faf5ff', '#6d28d9'],
    ['3D Pink', '#fff1f2', '#be185d'],
    ['3D Cyan', '#ecfeff', '#0e7490'],
    ['3D Ink', '#ffffff', '#0f172a'],
    ['3D Sand', '#fffbeb', '#a16207'],
    ['3D Steel', '#f8fafc', '#334155'],
    ['3D Lime', '#f7fee7', '#4d7c0f'],
    ['3D Coral', '#fff1f2', '#e11d48'],
    ['3D Teal', '#f0fdfa', '#0f766e'],
    ['3D Violet', '#f5f3ff', '#4c1d95'],
  ]
  depths.forEach(([name, color, depthColor], i) =>
    out.push(
      make(`d3-${i}`, name, '3d', {
        color,
        depthOn: true,
        depth: 28,
        depthColor,
        depthDarken: 40,
      }),
    ),
  )

  return out
}

export const TEXT_STYLES: TextStylePreset[] = build()
