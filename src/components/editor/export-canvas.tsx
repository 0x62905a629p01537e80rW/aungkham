import { forwardRef } from 'react'
import type { CSSProperties } from 'react'
import type { TextLayer } from '@/lib/text-layer'
import { LayerText, layerTransform } from './text-layer-view'

interface ExportCanvasProps {
  image: string
  layers: TextLayer[]
  size: { w: number; h: number } | null
  eraseMask?: string
  doodle?: string
}

export const ExportCanvas = forwardRef<HTMLDivElement, ExportCanvasProps>(function ExportCanvas(
  { image, layers, size, eraseMask, doodle },
  ref,
) {
  const safeSize = size ?? { w: 1, h: 1 }
  const maskStyle: CSSProperties | undefined = eraseMask
    ? {
        WebkitMaskImage: `url(${eraseMask})`,
        maskImage: `url(${eraseMask})`,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }
    : undefined
  const exportLayers = layers.filter((layer) => !layer.hidden && layer.x > -50 && layer.x < 150 && layer.y > -50 && layer.y < 150)

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 overflow-hidden opacity-0"
      style={{
        width: safeSize.w,
        height: safeSize.h,
        containerType: 'size',
        lineHeight: 0,
        transform: 'translate3d(-200vw, -200vh, 0)',
      }}
      aria-hidden="true"
    >
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{ width: safeSize.w, height: safeSize.h, containerType: 'size', lineHeight: 0 }}
      >
        <img
          src={image}
          alt=""
          crossOrigin="anonymous"
          className="block h-full w-full"
          style={{ objectFit: 'fill' }}
          draggable={false}
        />

        <div className="absolute inset-0" style={maskStyle}>
        {exportLayers.map((layer) => {
          const wrapperStyle: CSSProperties = {
            position: 'absolute',
            left: `${layer.x}%`,
            top: `${layer.y}%`,
            transform: layerTransform(layer),
            opacity: layer.opacity,
            mixBlendMode: (layer.blendMode ?? 'normal') as CSSProperties['mixBlendMode'],
            whiteSpace: 'nowrap',
          }

          return (
            <div key={layer.id} style={wrapperStyle}>
              <LayerText layer={layer} />
            </div>
          )
        })}
        </div>

        {doodle && (
          <img
            src={doodle}
            alt=""
            className="absolute inset-0 block h-full w-full"
            style={{ objectFit: 'fill' }}
            draggable={false}
          />
        )}
      </div>
    </div>
  )
})
