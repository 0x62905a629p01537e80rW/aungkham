import type { CSSProperties } from 'react'

/**
 * Canva-style one-tap text effects.
 *
 * Every value is expressed in `em` so an effect keeps its proportions when the
 * layer is scaled, and the same style object is reused by the on-canvas
 * renderer and the export canvas.
 */
export type TextEffectKey =
  | 'none'
  | 'shadow'
  | 'lift'
  | 'hollow'
  | 'splice'
  | 'echo'
  | 'glitch'
  | 'neon'
  | 'longshadow'
  | 'emboss'
  | 'stamp'

export interface TextEffectDef {
  key: TextEffectKey
  label: string
  /** which sliders make sense for this effect */
  fields: Array<'intensity' | 'offset' | 'direction' | 'blur' | 'thickness' | 'color'>
  pro?: boolean
}

export const TEXT_EFFECTS: TextEffectDef[] = [
  { key: 'none', label: 'None', fields: [] },
  { key: 'shadow', label: 'Shadow', fields: ['offset', 'direction', 'blur', 'intensity', 'color'] },
  { key: 'lift', label: 'Lift', fields: ['intensity'] },
  { key: 'hollow', label: 'Hollow', fields: ['thickness'] },
  { key: 'splice', label: 'Splice', fields: ['thickness', 'offset', 'direction', 'color'] },
  { key: 'echo', label: 'Echo', fields: ['offset', 'direction', 'color'] },
  { key: 'glitch', label: 'Glitch', fields: ['offset', 'direction'], pro: true },
  { key: 'neon', label: 'Neon', fields: ['intensity', 'color'], pro: true },
  { key: 'longshadow', label: 'Long shadow', fields: ['offset', 'direction', 'color'], pro: true },
  { key: 'emboss', label: 'Emboss', fields: ['intensity'], pro: true },
  { key: 'stamp', label: 'Stamp', fields: ['intensity', 'color'], pro: true },
]

export interface EffectParams {
  effect?: TextEffectKey
  effectIntensity?: number
  effectOffset?: number
  effectDirection?: number
  effectBlur?: number
  effectThickness?: number
  effectColor?: string
  /** the layer fill, used by effects that recolour the glyph */
  color: string
}

export const EFFECT_DEFAULTS = {
  effectIntensity: 50,
  effectOffset: 50,
  effectDirection: 45,
  effectBlur: 0,
  effectThickness: 50,
  effectColor: '#000000',
}

function rgba(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function vector(direction: number, distance: number) {
  const rad = (direction * Math.PI) / 180
  return { x: Math.cos(rad) * distance, y: Math.sin(rad) * distance }
}

/**
 * Returns the CSS overrides for the chosen effect. Merge these *after* the
 * base layer style; `textShadow` here replaces the base shadow on purpose so
 * presets stay predictable.
 */
export function textEffectStyle(p: EffectParams): CSSProperties | null {
  const key = p.effect ?? 'none'
  if (key === 'none') return null

  const i = (p.effectIntensity ?? EFFECT_DEFAULTS.effectIntensity) / 100
  const dist = ((p.effectOffset ?? EFFECT_DEFAULTS.effectOffset) / 100) * 0.16
  const dir = p.effectDirection ?? EFFECT_DEFAULTS.effectDirection
  const blur = ((p.effectBlur ?? EFFECT_DEFAULTS.effectBlur) / 100) * 0.3
  const thick = ((p.effectThickness ?? EFFECT_DEFAULTS.effectThickness) / 100) * 0.09
  const col = p.effectColor ?? EFFECT_DEFAULTS.effectColor
  const { x, y } = vector(dir, dist)
  const em = (v: number) => `${v.toFixed(4)}em`

  switch (key) {
    case 'shadow':
      return { textShadow: `${em(x)} ${em(y)} ${em(blur)} ${rgba(col, 0.15 + 0.85 * i)}` }

    case 'lift':
      return {
        textShadow: `0 ${em(0.02 + 0.05 * i)} ${em(0.06 + 0.16 * i)} rgba(0, 0, 0, ${(0.2 + 0.35 * i).toFixed(2)})`,
      }

    case 'hollow':
      return {
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        backgroundImage: 'none',
        WebkitTextStrokeWidth: em(Math.max(0.006, thick)),
        WebkitTextStrokeColor: p.color,
        paintOrder: 'stroke fill',
        textShadow: 'none',
      }

    case 'splice':
      return {
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        backgroundImage: 'none',
        WebkitTextStrokeWidth: em(Math.max(0.006, thick)),
        WebkitTextStrokeColor: p.color,
        paintOrder: 'stroke fill',
        textShadow: `${em(x)} ${em(y)} 0 ${col}`,
      }

    case 'echo':
      return {
        textShadow: `${em(x)} ${em(y)} 0 ${rgba(col, 0.5)}, ${em(x * 2)} ${em(y * 2)} 0 ${rgba(col, 0.25)}`,
      }

    case 'glitch':
      return {
        textShadow: `${em(-Math.abs(x))} ${em(y * 0.4)} 0 rgba(0, 231, 255, 0.85), ${em(Math.abs(x))} ${em(-y * 0.4)} 0 rgba(255, 0, 122, 0.85)`,
      }

    case 'neon': {
      const glow = 0.12 + 0.5 * i
      return {
        color: '#ffffff',
        WebkitTextFillColor: '#ffffff',
        backgroundImage: 'none',
        textShadow: [
          `0 0 ${em(glow * 0.25)} ${rgba(col, 0.95)}`,
          `0 0 ${em(glow * 0.6)} ${rgba(col, 0.8)}`,
          `0 0 ${em(glow * 1.4)} ${rgba(col, 0.55)}`,
          `0 0 ${em(glow * 2.6)} ${rgba(col, 0.35)}`,
        ].join(', '),
      }
    }

    case 'longshadow': {
      const steps = 28
      const out: string[] = []
      for (let s = 1; s <= steps; s += 1) {
        const t = (s / steps) * dist * 6
        const v = vector(dir, t)
        out.push(`${em(v.x)} ${em(v.y)} 0 ${col}`)
      }
      return { textShadow: out.join(', ') }
    }

    case 'emboss':
      return {
        textShadow: `${em(-0.012 * (0.5 + i))} ${em(-0.012 * (0.5 + i))} ${em(0.01)} rgba(255, 255, 255, ${(0.5 + 0.45 * i).toFixed(2)}), ${em(0.014 * (0.5 + i))} ${em(0.014 * (0.5 + i))} ${em(0.014)} rgba(0, 0, 0, ${(0.35 + 0.45 * i).toFixed(2)})`,
      }

    case 'stamp':
      return {
        color: rgba(p.color, 0.35 + 0.45 * (1 - i)),
        WebkitTextFillColor: rgba(p.color, 0.35 + 0.45 * (1 - i)),
        backgroundImage: 'none',
        WebkitTextStrokeWidth: em(0.012 + 0.02 * i),
        WebkitTextStrokeColor: rgba(col, 0.7),
        paintOrder: 'stroke fill',
        textShadow: 'none',
      }

    default:
      return null
  }
}
