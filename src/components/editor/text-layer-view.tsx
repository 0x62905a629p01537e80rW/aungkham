import type { CSSProperties } from 'react'
import { fontFamily, TEXTURES, type TextLayer } from '@/lib/text-layer'

export function layerTextStyle(layer: TextLayer): CSSProperties {
  const texture = TEXTURES[layer.texture]
  const shadow =
    layer.shadowBlur > 0 || layer.shadowOffsetX !== 0 || layer.shadowOffsetY !== 0
      ? `${layer.shadowOffsetX / 10}cqh ${layer.shadowOffsetY / 10}cqh ${layer.shadowBlur / 10}cqh ${layer.shadowColor}`
      : 'none'

  const base: CSSProperties = {
    margin: 0,
    fontFamily: fontFamily(layer.fontKey),
    fontSize: `${layer.fontSize}cqh`,
    fontWeight: layer.fontWeight,
    fontStyle: layer.italic ? 'italic' : 'normal',
    textAlign: layer.align,
    letterSpacing: `${layer.letterSpacing / 100}em`,
    lineHeight: layer.lineHeight,
    whiteSpace: 'pre',
    textShadow: shadow,
    WebkitTextStrokeWidth: layer.strokeWidth > 0 ? `${layer.strokeWidth / 20}cqh` : undefined,
    WebkitTextStrokeColor: layer.strokeWidth > 0 ? layer.strokeColor : undefined,
    paintOrder: 'stroke fill',
  }

  if (texture.gradient) {
    return {
      ...base,
      backgroundImage: texture.gradient,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
    }
  }

  return { ...base, color: layer.color }
}
