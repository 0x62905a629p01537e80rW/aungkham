import type { TextLayer } from '@/lib/text-layer'

/**
 * Format painter: copies every *look* property of a layer while leaving
 * content, position and identity untouched.
 */
const STYLE_KEYS = [
  'fontKey',
  'fontWeight',
  'italic',
  'align',
  'letterSpacing',
  'lineHeight',
  'color',
  'opacity',
  'blendMode',
  'strokeWidth',
  'strokeColor',
  'strokeOpacity',
  'shadowColor',
  'shadowBlur',
  'shadowOffsetX',
  'shadowOffsetY',
  'texture',
  'fillType',
  'gradientFrom',
  'gradientTo',
  'gradientAngle',
  'highlight',
  'highlightColor',
  'depthOn',
  'depth',
  'depthDarken',
  'depthColor',
  'liquidOn',
  'liquidTint',
  'liquidBlur',
  'liquidBorder',
  'liquidGlow',
  'liquidPlate',
  'liquidDark',
  'underline',
  'strike',
  'widthScale',
  'heightScale',
  'effect',
  'effectIntensity',
  'effectOffset',
  'effectDirection',
  'effectBlur',
  'effectThickness',
  'effectColor',
  'label',
  'labelFill',
  'labelAccent',
] as const

export type LayerStyle = Partial<Pick<TextLayer, (typeof STYLE_KEYS)[number]>>

let clipboard: LayerStyle | null = null
const listeners = new Set<() => void>()

/** Pulls every look property off a layer without touching the clipboard. */
export function extractLayerStyle(layer: TextLayer): LayerStyle {
  const out: Record<string, unknown> = {}
  STYLE_KEYS.forEach((k) => {
    if (layer[k] !== undefined) out[k] = layer[k]
  })
  return out as LayerStyle
}

export function copyLayerStyle(layer: TextLayer) {
  clipboard = extractLayerStyle(layer)
  listeners.forEach((fn) => fn())
}

export function getCopiedStyle(): LayerStyle | null {
  return clipboard
}

export function clearCopiedStyle() {
  clipboard = null
  listeners.forEach((fn) => fn())
}

export function subscribeStyleClipboard(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
