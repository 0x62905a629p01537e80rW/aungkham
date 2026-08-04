import { useSyncExternalStore } from 'react'
import { Trash2 } from 'lucide-react'

import {
  deleteSavedStyle,
  listSavedStyles,
  subscribeSavedStyles,
  type SavedStyle,
} from '@/lib/saved-styles'
import type { LayerStyle } from '@/lib/style-clipboard'
import { FONTS } from '@/lib/fonts'
import { textEffectStyle } from '@/lib/text-effects'

function useSavedStyles(): SavedStyle[] {
  return useSyncExternalStore(subscribeSavedStyles, listSavedStyles, () => [])
}

function tileStyle(s: LayerStyle) {
  const font = FONTS.find((f) => f.key === s.fontKey)
  return {
    fontFamily: font?.stack,
    fontWeight: s.fontWeight ?? 700,
    fontStyle: s.italic ? 'italic' : 'normal',
    color: s.color ?? 'currentColor',
    ...textEffectStyle({
      effect: s.effect,
      color: s.color ?? '#ffffff',
      intensity: s.effectIntensity,
      offset: s.effectOffset,
      direction: s.effectDirection,
      blur: s.effectBlur,
      thickness: s.effectThickness,
      effectColor: s.effectColor,
    }),
  } as React.CSSProperties
}

interface MyStylesProps {
  onApply: (style: LayerStyle) => void
}

/** "My styles" gallery — user-saved text looks, applied with one tap. */
export function MyStyles({ onApply }: MyStylesProps) {
  const styles = useSavedStyles()

  if (styles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        No saved styles yet. Select a text layer and tap the bookmark handle on the text box to
        save its look here.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {styles.map((s) => (
        <div key={s.id} className="relative">
          <button
            type="button"
            onClick={() => onApply(s.style)}
            className="flex h-16 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-border/60 bg-muted/30 px-1 transition active:scale-95"
          >
            <span className="max-w-full truncate text-base leading-none" style={tileStyle(s.style)}>
              {s.sample || 'Ag'}
            </span>
            <span className="max-w-full truncate text-[9px] text-muted-foreground">{s.name}</span>
          </button>
          <button
            type="button"
            aria-label={`Delete ${s.name}`}
            onClick={() => deleteSavedStyle(s.id)}
            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow ring-1 ring-border transition active:scale-90"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
