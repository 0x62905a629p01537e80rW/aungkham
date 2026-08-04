import type { CSSProperties } from 'react'

/**
 * Label / badge plates that sit *behind* a text layer — tickets, banners,
 * sticky notes, speech bubbles, festival frames…
 *
 * Everything is plain CSS (no images, no SVG files) so the same markup renders
 * identically on the live canvas and in the html-to-image export, and every
 * measurement is in `em` so a plate scales with the text.
 */
export type LabelKey =
  /* label */
  | 'pill'
  | 'ticket'
  | 'banner'
  | 'sticky'
  | 'tape'
  | 'outline'
  | 'bubble'
  | 'ribbon'
  | 'note'
  | 'chip'
  | 'stamp'
  | 'marker'
  /* festival */
  | 'gold'
  | 'neonsign'
  | 'confetti'
  | 'snow'
  | 'sunset'
  | 'party'
  | 'heart'
  | 'lantern'

export interface LabelDef {
  key: LabelKey
  label: string
  group: 'label' | 'festival'
  /** default plate colour */
  fill: string
  /** default accent / border colour */
  accent: string
  /** text colour suggested with this plate */
  ink: string
  pro?: boolean
}

export const TEXT_LABELS: LabelDef[] = [
  { key: 'pill', label: 'Pill', group: 'label', fill: '#111827', accent: '#111827', ink: '#ffffff' },
  { key: 'ticket', label: 'Ticket', group: 'label', fill: '#f6e7c8', accent: '#8a6a3b', ink: '#43301a' },
  { key: 'banner', label: 'Banner', group: 'label', fill: '#7bd634', accent: '#4e9b17', ink: '#0f2405' },
  { key: 'sticky', label: 'Sticky', group: 'label', fill: '#ffe27a', accent: '#e0b93a', ink: '#4a3a06' },
  { key: 'tape', label: 'Tape', group: 'label', fill: '#f2d98c', accent: '#c9ab52', ink: '#3b2f0c' },
  { key: 'outline', label: 'Frame', group: 'label', fill: 'transparent', accent: '#ffffff', ink: '#ffffff' },
  { key: 'bubble', label: 'Bubble', group: 'label', fill: '#ffffff', accent: '#111827', ink: '#111827' },
  { key: 'ribbon', label: 'Ribbon', group: 'label', fill: '#2f7bff', accent: '#1e4fb0', ink: '#ffffff' },
  { key: 'note', label: 'Notebook', group: 'label', fill: '#e6b6df', accent: '#a55f9c', ink: '#ffffff' },
  { key: 'chip', label: 'Chip', group: 'label', fill: '#d9f4e6', accent: '#2f9e6b', ink: '#12523a' },
  { key: 'stamp', label: 'Stamp', group: 'label', fill: 'transparent', accent: '#e0483a', ink: '#e0483a' },
  { key: 'marker', label: 'Marker', group: 'label', fill: '#3ddc84', accent: '#3ddc84', ink: '#08210f' },

  { key: 'gold', label: 'Gold', group: 'festival', fill: '#1a1408', accent: '#e8c369', ink: '#f6dfa4', pro: true },
  { key: 'neonsign', label: 'Neon', group: 'festival', fill: '#120a2a', accent: '#ff36c8', ink: '#ffffff', pro: true },
  { key: 'confetti', label: 'Confetti', group: 'festival', fill: '#ffffff', accent: '#ff5c8a', ink: '#25123a' },
  { key: 'snow', label: 'Winter', group: 'festival', fill: '#eaf6ff', accent: '#7fbde8', ink: '#123a5c' },
  { key: 'sunset', label: 'Sunset', group: 'festival', fill: '#ff7a45', accent: '#ffd166', ink: '#3a1300' },
  { key: 'party', label: 'Party', group: 'festival', fill: '#2b0f3f', accent: '#ffd166', ink: '#ffffff', pro: true },
  { key: 'heart', label: 'Love', group: 'festival', fill: '#ff4d6d', accent: '#ffd7e0', ink: '#ffffff' },
  { key: 'lantern', label: 'Lantern', group: 'festival', fill: '#a01414', accent: '#ffcf5c', ink: '#ffe9a8' },
]

export interface LabelRender {
  /** the plate itself */
  plate: CSSProperties
  /** small decorations drawn inside the plate (absolutely positioned) */
  decor?: CSSProperties[]
}

function alpha(hex: string, a: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

const dot = (
  left: string,
  top: string,
  size: string,
  bg: string,
  extra: CSSProperties = {},
): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width: size,
  height: size,
  borderRadius: '999em',
  background: bg,
  ...extra,
})

/** Returns the CSS for one label plate. */
export function labelRender(key: LabelKey, fillIn?: string, accentIn?: string): LabelRender {
  const def = TEXT_LABELS.find((l) => l.key === key) ?? TEXT_LABELS[0]
  const fill = fillIn ?? def.fill
  const accent = accentIn ?? def.accent

  const base: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    padding: '0.22em 0.62em',
    background: fill,
    borderRadius: '0.2em',
  }

  switch (key) {
    case 'pill':
      return { plate: { ...base, borderRadius: '999em', padding: '0.24em 0.8em' } }

    case 'ticket':
      return {
        plate: {
          ...base,
          padding: '0.3em 0.9em',
          border: `0.045em dashed ${accent}`,
          borderRadius: '0.16em',
          boxShadow: `0 0.06em 0.2em ${alpha('#000000', 0.25)}`,
        },
        decor: [
          dot('-0.18em', '50%', '0.36em', 'var(--label-punch, rgba(0,0,0,0.001))', {
            transform: 'translateY(-50%)',
            background: 'transparent',
            boxShadow: `0 0 0 0.18em ${accent} inset`,
            border: `0.05em solid ${accent}`,
          }),
          dot('calc(100% - 0.18em)', '50%', '0.36em', 'transparent', {
            transform: 'translateY(-50%)',
            border: `0.05em solid ${accent}`,
          }),
        ],
      }

    case 'banner':
      return {
        plate: {
          ...base,
          padding: '0.24em 1.05em 0.24em 0.7em',
          borderRadius: '0.06em',
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 0.7em) 50%, 100% 100%, 0 100%)',
          boxShadow: `inset -0.35em 0 0 ${alpha(accent, 0.35)}`,
        },
      }

    case 'sticky':
      return {
        plate: {
          ...base,
          padding: '0.42em 0.7em 0.5em',
          borderRadius: '0.06em',
          boxShadow: `0.1em 0.14em 0.3em ${alpha('#000000', 0.28)}`,
          backgroundImage: `linear-gradient(180deg, ${fill}, ${alpha(accent, 0.55)})`,
        },
        decor: [
          {
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '0.55em',
            height: '0.55em',
            background: alpha('#000000', 0.18),
            clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
          },
        ],
      }

    case 'tape':
      return {
        plate: {
          ...base,
          padding: '0.26em 1em',
          borderRadius: 0,
          opacity: 0.94,
          clipPath:
            'polygon(0.35em 0, calc(100% - 0.35em) 0.08em, 100% 100%, 0.15em calc(100% - 0.06em))',
          backgroundImage: `repeating-linear-gradient(90deg, ${alpha('#ffffff', 0.18)} 0 0.12em, transparent 0.12em 0.34em)`,
        },
      }

    case 'outline':
      return {
        plate: {
          ...base,
          background: 'transparent',
          padding: '0.28em 0.7em',
          border: `0.06em solid ${accent}`,
          borderRadius: '0.1em',
          boxShadow: `0 0 0 0.14em ${alpha(accent, 0.16)}`,
        },
      }

    case 'bubble':
      return {
        plate: {
          ...base,
          padding: '0.38em 0.85em',
          borderRadius: '0.9em',
          border: `0.05em solid ${accent}`,
          boxShadow: `0 0.08em 0.24em ${alpha('#000000', 0.22)}`,
        },
        decor: [
          {
            position: 'absolute',
            left: '1.1em',
            bottom: '-0.34em',
            width: '0.5em',
            height: '0.4em',
            background: fill,
            borderRight: `0.05em solid ${accent}`,
            borderBottom: `0.05em solid ${accent}`,
            transform: 'skewX(-16deg)',
          },
        ],
      }

    case 'ribbon':
      return {
        plate: {
          ...base,
          padding: '0.26em 1.05em',
          borderRadius: '0.08em',
          clipPath:
            'polygon(0 0, 100% 0, calc(100% - 0.55em) 50%, 100% 100%, 0 100%, 0.55em 50%)',
          backgroundImage: `linear-gradient(180deg, ${fill}, ${accent})`,
        },
      }

    case 'note':
      return {
        plate: {
          ...base,
          padding: '0.5em 0.8em 0.34em',
          borderRadius: '0.28em',
          border: `0.045em solid ${accent}`,
          backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.25)}, transparent 40%)`,
          boxShadow: `0 0.1em 0.26em ${alpha('#000000', 0.24)}`,
        },
        decor: Array.from({ length: 7 }, (_, i) => ({
          position: 'absolute' as const,
          top: '-0.22em',
          left: `${0.5 + i * 0.62}em`,
          width: '0.16em',
          height: '0.52em',
          borderRadius: '999em',
          background: accent,
        })),
      }

    case 'chip':
      return {
        plate: {
          ...base,
          borderRadius: '0.5em',
          padding: '0.24em 0.72em',
          border: `0.04em solid ${alpha(accent, 0.7)}`,
        },
      }

    case 'stamp':
      return {
        plate: {
          ...base,
          background: 'transparent',
          padding: '0.3em 0.75em',
          border: `0.09em double ${accent}`,
          borderRadius: '0.12em',
          transform: 'rotate(-6deg)',
        },
      }

    case 'marker':
      return {
        plate: {
          ...base,
          padding: '0.1em 0.4em',
          borderRadius: '0.1em',
          backgroundImage: `linear-gradient(180deg, transparent 12%, ${alpha(fill, 0.95)} 12%, ${alpha(fill, 0.95)} 88%, transparent 88%)`,
          background: 'none',
        },
      }

    case 'gold':
      return {
        plate: {
          ...base,
          padding: '0.36em 0.95em',
          borderRadius: '0.1em',
          border: `0.05em solid ${accent}`,
          backgroundImage: `linear-gradient(180deg, ${fill}, #000000)`,
          boxShadow: `0 0 0 0.03em ${alpha(accent, 0.5)}, 0 0.1em 0.3em ${alpha('#000000', 0.5)}`,
        },
        decor: [
          dot('0.24em', '0.24em', '0.14em', accent),
          dot('calc(100% - 0.38em)', '0.24em', '0.14em', accent),
          dot('0.24em', 'calc(100% - 0.38em)', '0.14em', accent),
          dot('calc(100% - 0.38em)', 'calc(100% - 0.38em)', '0.14em', accent),
        ],
      }

    case 'neonsign':
      return {
        plate: {
          ...base,
          padding: '0.4em 0.95em',
          borderRadius: '0.35em',
          border: `0.05em solid ${accent}`,
          background: alpha(fill, 0.9),
          boxShadow: `0 0 0.35em ${accent}, inset 0 0 0.45em ${alpha(accent, 0.8)}`,
        },
      }

    case 'confetti':
      return {
        plate: {
          ...base,
          padding: '0.42em 0.95em',
          borderRadius: '0.4em',
          boxShadow: `0 0.1em 0.28em ${alpha('#000000', 0.2)}`,
        },
        decor: [
          dot('0.3em', '0.22em', '0.13em', accent),
          dot('calc(100% - 0.5em)', '0.3em', '0.1em', '#4dabf7'),
          dot('0.75em', 'calc(100% - 0.35em)', '0.1em', '#ffd166'),
          dot('calc(100% - 0.9em)', 'calc(100% - 0.32em)', '0.12em', '#7bd634'),
        ],
      }

    case 'snow':
      return {
        plate: {
          ...base,
          padding: '0.4em 0.95em',
          borderRadius: '0.5em',
          border: `0.045em solid ${accent}`,
          backgroundImage: `linear-gradient(180deg, #ffffff, ${fill})`,
          boxShadow: `0 0.1em 0.3em ${alpha('#123a5c', 0.25)}`,
        },
        decor: [
          dot('0.35em', '0.2em', '0.12em', alpha(accent, 0.9)),
          dot('calc(100% - 0.6em)', 'calc(100% - 0.35em)', '0.1em', alpha(accent, 0.75)),
        ],
      }

    case 'sunset':
      return {
        plate: {
          ...base,
          padding: '0.36em 0.95em',
          borderRadius: '999em',
          backgroundImage: `linear-gradient(100deg, ${fill}, ${accent})`,
          boxShadow: `0 0.1em 0.3em ${alpha('#000000', 0.25)}`,
        },
      }

    case 'party':
      return {
        plate: {
          ...base,
          padding: '0.42em 1em',
          borderRadius: '0.3em',
          background: fill,
          border: `0.05em dashed ${accent}`,
          boxShadow: `0 0 0.4em ${alpha(accent, 0.45)}`,
        },
        decor: [
          dot('0.3em', '0.26em', '0.11em', '#ff5c8a'),
          dot('calc(100% - 0.5em)', '0.26em', '0.11em', '#4dabf7'),
          dot('50%', 'calc(100% - 0.3em)', '0.11em', accent),
        ],
      }

    case 'heart':
      return {
        plate: {
          ...base,
          padding: '0.42em 1em',
          borderRadius: '999em',
          backgroundImage: `linear-gradient(180deg, ${fill}, #c9184a)`,
          boxShadow: `0 0.1em 0.3em ${alpha('#000000', 0.28)}`,
        },
        decor: [
          {
            position: 'absolute',
            left: '0.4em',
            top: '0.22em',
            width: '0.22em',
            height: '0.22em',
            background: accent,
            borderRadius: '0.06em',
            transform: 'rotate(45deg)',
            boxShadow: `-0.11em 0 0 ${accent}, 0 -0.11em 0 ${accent}`,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          },
        ],
      }

    case 'lantern':
      return {
        plate: {
          ...base,
          padding: '0.42em 1em',
          borderRadius: '0.8em / 1.1em',
          backgroundImage: `radial-gradient(120% 100% at 50% 0%, #d32b2b, ${fill})`,
          border: `0.05em solid ${accent}`,
          boxShadow: `0 0 0.4em ${alpha(accent, 0.4)}`,
        },
        decor: [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '0.12em',
            background: accent,
          },
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '0.12em',
            background: accent,
          },
        ],
      }

    default:
      return { plate: base }
  }
}
