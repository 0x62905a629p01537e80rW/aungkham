import { memo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { fontFamily, TEXTURES, type TextLayer } from '@/lib/text-layer'
import { textEffectStyle } from '@/lib/text-effects'
import { patternImage } from '@/lib/text-patterns'


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

/** Frosted "liquid glass" look applied on top of the normal fill. */
export function liquidStyle(layer: TextLayer): CSSProperties {
  const tint = (layer.liquidTint ?? 22) / 100
  const border = (layer.liquidBorder ?? 45) / 100
  const glow = (layer.liquidGlow ?? 35) / 100
  const dark = layer.liquidDark
  const glass = dark ? '18, 22, 30' : '255, 255, 255'
  const rim = dark ? '255, 255, 255' : '255, 255, 255'

  const shadows = [
    `0 -0.012em 0.01em rgba(${rim}, ${0.85 * border})`,
    `0 0.014em 0.012em rgba(${dark ? '255, 255, 255' : '0, 0, 0'}, ${0.35 * border})`,
    `0 0.05em 0.09em rgba(0, 0, 0, ${0.3 + 0.25 * tint})`,
  ]
  if (glow > 0) shadows.push(`0 0 ${(0.35 * glow).toFixed(3)}em rgba(${rim}, ${glow})`)

  return {
    color: `rgba(${glass}, ${Math.max(0.05, tint)})`,
    WebkitTextFillColor: `rgba(${glass}, ${Math.max(0.05, tint)})`,
    backgroundImage: `linear-gradient(160deg, rgba(${rim}, ${0.5 * border}) 0%, rgba(${glass}, ${tint}) 45%, rgba(${rim}, ${0.22 * border}) 100%)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextStrokeWidth: border > 0 ? `${(border * 0.045).toFixed(4)}em` : undefined,
    WebkitTextStrokeColor: `rgba(${rim}, ${0.35 + 0.5 * border})`,
    paintOrder: 'stroke fill',
    textShadow: shadows.join(', '),
  }
}

/** Frosted "liquid glass" look for masked graphics (shapes / stickers). */
export function liquidGraphicStyle(layer: TextLayer): CSSProperties {
  const tint = (layer.liquidTint ?? 22) / 100
  const border = (layer.liquidBorder ?? 45) / 100
  const glow = (layer.liquidGlow ?? 35) / 100
  const dark = layer.liquidDark
  const glass = dark ? '18, 22, 30' : '255, 255, 255'
  const rim = '255, 255, 255'

  const shadows = [
    `inset 0 0.02em 0 rgba(${rim}, ${0.7 * border})`,
    `inset 0 -0.02em 0 rgba(${dark ? '255, 255, 255' : '0, 0, 0'}, ${0.3 * border})`,
  ]
  if (glow > 0) shadows.push(`0 0 ${(0.5 * glow).toFixed(3)}em rgba(${rim}, ${glow})`)

  return {
    background: `linear-gradient(160deg, rgba(${rim}, ${0.55 * border}) 0%, rgba(${glass}, ${Math.max(0.08, tint)}) 45%, rgba(${rim}, ${0.25 * border}) 100%)`,
    boxShadow: shadows.join(', '),
  }
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
    whiteSpace: layer.wrapWidth ? 'pre-wrap' : 'pre',
    width: layer.wrapWidth ? `${layer.wrapWidth}cqw` : undefined,
    maxWidth: layer.wrapWidth ? `${layer.wrapWidth}cqw` : undefined,
    overflowWrap: layer.wrapWidth ? 'break-word' : undefined,
    wordBreak: layer.wrapWidth ? 'break-word' : undefined,
    textShadow: shadows.length ? shadows.join(', ') : 'none',
    WebkitTextStrokeWidth: layer.strokeWidth > 0 ? `${layer.strokeWidth / 20}cqh` : undefined,
    WebkitTextStrokeColor:
      layer.strokeWidth > 0
        ? withAlpha(layer.strokeColor, layer.strokeOpacity ?? 1)
        : undefined,
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

  const fx = textEffectStyle(layer)
  const finish = (st: CSSProperties): CSSProperties => (fx ? { ...st, ...fx } : st)

  if (fillType === 'gradient') {
    return finish(clipped(
      `linear-gradient(${layer.gradientAngle ?? 90}deg, ${layer.gradientFrom ?? '#ff7a18'}, ${layer.gradientTo ?? '#af002d'})`,
      ),
    )
  }

  if (fillType === 'texture') {
    if (layer.textureImage) {
      const sx = layer.textureScaleX ?? 100
      const sy = layer.textureScaleY ?? 100
      const px = layer.textureOffsetX ?? 50
      const py = layer.textureOffsetY ?? 50
      return finish(clipped(`url(${layer.textureImage})`, `${sx}% ${sy}%`, `${px}% ${py}%`))
    }
    if (texture.gradient) return finish(clipped(texture.gradient))
  }

  if (fillType === 'pattern') {
    const size = Math.max(5, layer.patternScale ?? 40)
    return finish({
      ...clipped(
        patternImage(layer.patternKey ?? 'stripes', layer.color, layer.patternColor ?? '#ffffff'),
        `${size}% auto`,
        '50% 50%',
      ),
      backgroundRepeat: 'repeat',
    })
  }

  if (fillType === 'photo' && layer.photoFill) {
    const zoom = Math.max(50, layer.photoZoom ?? 100)
    return finish({
      ...clipped(`url(${layer.photoFill})`, `${zoom}cqw auto`, `${layer.x}% ${layer.y}%`),
      backgroundRepeat: 'no-repeat',
    })
  }


  return finish({ ...base, color: layer.color })
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
    (layer.heightScale ?? 100) !== 100 ? `scaleY(${(layer.heightScale ?? 100) / 100})` : '',
  ]
  return parts.filter(Boolean).join(' ')
}

/** Text content, optionally bent along an arc. */
function LayerGraphic({ layer }: { layer: TextLayer }) {
  const g = layer.graphic!
  const h = layer.fontSize * 2
  const w = h * (g.aspect || 1)
  const crop = g.crop
  const cl = Math.min(90, Math.max(0, crop?.left ?? 0))
  const cr = Math.min(90, Math.max(0, crop?.right ?? 0))
  const ct = Math.min(90, Math.max(0, crop?.top ?? 0))
  const cb = Math.min(90, Math.max(0, crop?.bottom ?? 0))
  const cropped = cl + cr + ct + cb > 0
  const box: CSSProperties = {
    width: `${w}cqh`,
    height: `${h}cqh`,
    display: 'block',
    WebkitMaskImage: layer.eraseMask ? `url(${layer.eraseMask})` : undefined,
    maskImage: layer.eraseMask ? `url(${layer.eraseMask})` : undefined,
    WebkitMaskSize: layer.eraseMask ? '100% 100%' : undefined,
    maskSize: layer.eraseMask ? '100% 100%' : undefined,
    filter:
      layer.shadowBlur > 0 || layer.shadowOffsetX !== 0 || layer.shadowOffsetY !== 0
        ? `drop-shadow(${layer.shadowOffsetX / 10}cqh ${layer.shadowOffsetY / 10}cqh ${layer.shadowBlur / 10}cqh ${layer.shadowColor})`
        : undefined,
  }

  const withCrop = (node: ReactNode) => {
    if (!cropped) return node
    return (
      <div
        style={{
          width: `${(w * (100 - cl - cr)) / 100}cqh`,
          height: `${(h * (100 - ct - cb)) / 100}cqh`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${(-w * cl) / 100}cqh`,
            top: `${(-h * ct) / 100}cqh`,
          }}
        >
          {node}
        </div>
      </div>
    )
  }

  if (g.kind === 'shape') {
    const fill =
      g.outline && g.strokeColor
        ? g.strokeColor
        : (layer.fillType ?? 'solid') === 'gradient'
          ? `linear-gradient(${layer.gradientAngle ?? 90}deg, ${layer.gradientFrom}, ${layer.gradientTo})`
          : layer.color
    const liquid = layer.liquidOn ? liquidGraphicStyle(layer) : null
    const node = (
      <div
        style={{
          ...box,
          background: fill,
          ...(liquid ?? {}),
          WebkitMaskImage: `url("${g.src}")`,
          maskImage: `url("${g.src}")`,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      />
    )
    if (layer.liquidOn && layer.liquidPlate) return <LiquidPlate layer={layer}>{node}</LiquidPlate>
    return withCrop(node)
  }


  return withCrop(
    <img src={g.src} alt="" crossOrigin="anonymous" draggable={false} style={box} />,
  )
}

function LayerTextImpl({ layer }: { layer: TextLayer }) {
  if (layer.graphic) return <LayerGraphic layer={layer} />
  const style = layer.liquidOn
    ? { ...layerTextStyle(layer), ...liquidStyle(layer) }
    : layerTextStyle(layer)
  const bend = layer.bend ?? 0
  const text = layer.text || ' '

  if (bend !== 0 && !text.includes('\n')) {
    const chars = [...text]
    // ±200 on the slider sweeps a full circle in either direction.
    const total = (bend / 100) * 180
    const step = chars.length > 1 ? total / (chars.length - 1) : 0
    const auto = Math.max(0.4, (chars.length * 0.62) / Math.max(0.05, Math.abs((total * Math.PI) / 180)))
    const radius = auto * ((layer.bendRadius ?? 100) / 100)
    const up = layer.bendFlip ? bend < 0 : bend > 0
    const spin = layer.bendFlip ? -1 : 1

    return (
      <p style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {chars.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            style={{
              display: 'inline-block',
              transform: `rotate(${spin * (-total / 2 + step * i)}deg)`,
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

  const node = <p style={style}>{text}</p>
  if (layer.liquidOn && layer.liquidPlate) return <LiquidPlate layer={layer}>{node}</LiquidPlate>
  return node
}

/** Frosted card behind the text. */
function LiquidPlate({ layer, children }: { layer: TextLayer; children: ReactNode }) {
  const tint = (layer.liquidTint ?? 22) / 100
  const border = (layer.liquidBorder ?? 45) / 100
  const dark = layer.liquidDark
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.14em 0.34em',
        borderRadius: '0.3em',
        background: dark
          ? `rgba(16, 20, 28, ${0.18 + tint * 0.5})`
          : `rgba(255, 255, 255, ${0.1 + tint * 0.5})`,
        border: `1px solid rgba(255, 255, 255, ${0.2 + border * 0.5})`,
        backdropFilter: `blur(${layer.liquidBlur ?? 8}px) saturate(160%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,${0.35 + border * 0.4}), 0 8px 24px rgba(0,0,0,0.22)`,
      }}
    >
      {children}
    </span>
  )
}

function withAlpha(hex: string, alpha: number): string {
  if (alpha >= 1) return hex
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/**
 * Memoised: while one layer is being dragged the others keep their previous
 * render, which removes most of the per-frame work on busy canvases.
 */
export const LayerText = memo(LayerTextImpl)
