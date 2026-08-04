import { useState } from 'react'
import { Crown } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { TextLayer } from '@/lib/text-layer'
import { textEffectStyle } from '@/lib/text-effects'
import { labelRender } from '@/lib/text-labels'
import { FX_GROUPS, fxPresets, type FxGroup, type FxPreset } from '@/lib/text-fx-presets'

/** Text look of a preset, scaled down for the tile. */
function previewTextStyle(patch: Partial<TextLayer>): React.CSSProperties {
  const color = patch.color ?? '#ffffff'
  const base: React.CSSProperties = {
    fontWeight: patch.fontWeight ?? 800,
    fontStyle: patch.italic ? 'italic' : 'normal',
    letterSpacing: `${(patch.letterSpacing ?? 0) / 100}em`,
    color,
    opacity: patch.opacity ?? 1,
    lineHeight: 1.1,
    WebkitTextStrokeWidth: patch.strokeWidth ? `${(patch.strokeWidth ?? 0) / 40}em` : undefined,
    WebkitTextStrokeColor: patch.strokeColor,
    paintOrder: 'stroke fill',
    transform: patch.skewX ? `skewX(${patch.skewX}deg)` : undefined,
  }

  if (patch.fillType === 'gradient') {
    Object.assign(base, {
      backgroundImage: `linear-gradient(${patch.gradientAngle ?? 90}deg, ${patch.gradientFrom}, ${patch.gradientTo})`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
    })
  }

  if (patch.highlight) {
    base.backgroundColor = patch.highlightColor
    base.padding = '0 0.16em'
  }

  const fx = textEffectStyle({
    effect: patch.effect,
    color,
    effectIntensity: patch.effectIntensity,
    effectOffset: patch.effectOffset,
    effectDirection: patch.effectDirection,
    effectBlur: patch.effectBlur,
    effectThickness: patch.effectThickness,
    effectColor: patch.effectColor,
  })

  return fx ? { ...base, ...fx } : base
}

function PresetTile({ preset, onApply }: { preset: FxPreset; onApply: () => void }) {
  const text = <span style={previewTextStyle(preset.patch)}>{preset.sample ?? 'Aa'}</span>
  const plate = preset.patch.label
    ? labelRender(preset.patch.label, preset.patch.labelFill, preset.patch.labelAccent)
    : null

  return (
    <button
      type="button"
      onClick={onApply}
      className="relative flex h-[4.5rem] flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-border/60 bg-muted/30 px-1 text-[9px] text-muted-foreground transition active:scale-95"
    >
      <span className="flex items-center justify-center text-[15px]" style={{ fontSize: 15 }}>
        {plate ? (
          <span style={plate.plate}>
            {plate.decor?.map((d, i) => (
              <span key={i} aria-hidden style={d} />
            ))}
            <span style={{ position: 'relative', display: 'inline-block' }}>{text}</span>
          </span>
        ) : (
          text
        )}
      </span>
      <span className="max-w-full truncate">{preset.label}</span>
      {preset.pro && <Crown className="absolute right-1 top-1 size-3 text-amber-400" />}
    </button>
  )
}

interface FxPresetsProps {
  layer: TextLayer | null
  onApply: (patch: Partial<TextLayer>) => void
}

/** Featured / Glitch / Label / Festival one-tap text effects. */
export function FxPresets({ layer, onApply }: FxPresetsProps) {
  const [group, setGroup] = useState<FxGroup>('featured')
  const presets = fxPresets(group)
  const activeLabel = layer?.label

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {FX_GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGroup(g.key)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition',
              group === g.key
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() =>
            onApply({
              effect: 'none',
              label: undefined,
              labelFill: undefined,
              labelAccent: undefined,
              highlight: false,
              strokeWidth: 0,
              fillType: 'solid',
            })
          }
          className={cn(
            'flex h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border text-[9px] transition active:scale-95',
            !activeLabel && (!layer?.effect || layer.effect === 'none')
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border/60 text-muted-foreground',
          )}
        >
          <span className="text-base font-black leading-none">Aa</span>
          None
        </button>

        {presets.map((preset) => (
          <PresetTile
            key={preset.key}
            preset={preset}
            onApply={() => onApply(preset.patch)}
          />
        ))}
      </div>
    </div>
  )
}
