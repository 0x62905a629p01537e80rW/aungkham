import type { CSSProperties } from 'react'
import { fontFamily, TEXTURES, type TextLayer } from '@/lib/text-layer'


function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return { r: 0, g: 0, b: 0 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  const f = Math.max(0, 1 - amount / 100)
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`
}

/** Stacked text-shadow copies that read as an extruded 3D block. */
function depthShadow(layer: TextLayer): string[] {
  if (!layer.depthOn || !layer.depth) return []
  const color = darken(layer.depthColor ?? '#1d4ed8', layer.depthDarken ?? 0)
  const steps = Math.min(40, Math.max(1, Math.round(layer.depth / 2.5)))
  const unit = layer.depth / 100 / steps
  const out: string[] = []
  for (let i = 1; i <= steps; i += 1) {
    out.push(`${(unit * i).toFixed(4)}em ${(unit * i).toFixed(4)}em 0 ${color}`)
  }
  return out
}

export function layerTextStyle(layer: TextLayer): CSSProperties {
  const texture = TEXTURES[layer.texture] ?? TEXTURES.none
  const fillType = layer.fillType ?? (texture.gradient ? 'texture' : 'solid')

  const shadows = depthShadow(layer)
  if (layer.shadowBlur > 0 || layer.shadowOffsetX !== 0 || layer.shadowOffsetY !== 0) {
    shadows.push(
      `${layer.shadowOffsetX / 10}cqh ${layer.shadowOffsetY / 10}cqh ${layer.shadowBlur / 10}cqh ${layer.shadowColor}`,
    )
  }

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
    textShadow: shadows.length ? shadows.join(', ') : 'none',
    WebkitTextStrokeWidth: layer.strokeWidth > 0 ? `${layer.strokeWidth / 20}cqh` : undefined,
    WebkitTextStrokeColor: layer.strokeWidth > 0 ? layer.strokeColor : undefined,
    paintOrder: 'stroke fill',
    WebkitMaskImage: layer.eraseMask ? `url(${layer.eraseMask})` : undefined,
    maskImage: layer.eraseMask ? `url(${layer.eraseMask})` : undefined,
    WebkitMaskSize: layer.eraseMask ? '100% 100%' : undefined,
    maskSize: layer.eraseMask ? '100% 100%' : undefined,
    textDecorationLine:
      [layer.underline ? 'underline' : '', layer.strike ? 'line-through' : '']
        .filter(Boolean)
        .join(' ') || 'none',
  }

  const clipped = (image: string, size?: string, position?: string): CSSProperties => ({
    ...base,
    backgroundColor: layer.color,
    backgroundImage: image,
    backgroundSize: size,
    backgroundPosition: position,
    backgroundRepeat: 'no-repeat',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  })

  if (fillType === 'gradient') {
    return clipped(
      `linear-gradient(${layer.gradientAngle ?? 90}deg, ${layer.gradientFrom ?? '#ff7a18'}, ${layer.gradientTo ?? '#af002d'})`,
    )
  }

  if (fillType === 'texture') {
    if (layer.textureImage) {
      const sx = layer.textureScaleX ?? 100
      const sy = layer.textureScaleY ?? 100
      const px = layer.textureOffsetX ?? 50
      const py = layer.textureOffsetY ?? 50
      return clipped(`url(${layer.textureImage})`, `${sx}% ${sy}%`, `${px}% ${py}%`)
    }
    if (texture.gradient) return clipped(texture.gradient)
  }


  return { ...base, color: layer.color }
}

/** Wrapper transform shared by the editor canvas and the export canvas. */
export function layerTransform(layer: TextLayer): string {
  const parts = [
    'translate(-50%, -50%)',
    layer.perspective ? `perspective(${layer.perspective}px)` : '',
    `rotate(${layer.rotation}deg)`,
    layer.rotateX ? `rotateX(${layer.rotateX}deg)` : '',
    layer.rotateY ? `rotateY(${layer.rotateY}deg)` : '',
    `skew(${layer.skewX}deg, ${layer.skewY}deg)`,
    layer.flipH || layer.flipV ? `scale(${layer.flipH ? -1 : 1}, ${layer.flipV ? -1 : 1})` : '',
    (layer.widthScale ?? 100) !== 100 ? `scaleX(${(layer.widthScale ?? 100) / 100})` : '',
  ]
  return parts.filter(Boolean).join(' ')
}

/** Text content, optionally bent along an arc. */
export function LayerText({ layer }: { layer: TextLayer }) {
  const style = layerTextStyle(layer)
  const bend = layer.bend ?? 0
  const text = layer.text || ' '

  if (bend !== 0 && !text.includes('\n')) {
    const chars = [...text]
    const total = (bend / 100) * 180
    const step = chars.length > 1 ? total / (chars.length - 1) : 0
    const radius = Math.max(1.2, (chars.length * 0.62) / Math.max(0.05, Math.abs((total * Math.PI) / 180)))
    const up = bend > 0

    return (
      <p style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {chars.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            style={{
              display: 'inline-block',
              transform: `rotate(${-total / 2 + step * i}deg)`,
              transformOrigin: up ? `50% ${radius}em` : `50% ${-radius}em`,
              whiteSpace: 'pre',
            }}
          >
            {ch}
          </span>
        ))}
      </p>
    )
  }

  if (layer.highlight) {
    return (
      <span
        style={{
          display: 'inline-block',
          backgroundColor: layer.highlightColor,
          padding: '0.08em 0.28em',
          borderRadius: '0.08em',
        }}
      >
        <span style={style}>{text}</span>
      </span>
    )
  }

  return <p style={style}>{text}</p>
}
