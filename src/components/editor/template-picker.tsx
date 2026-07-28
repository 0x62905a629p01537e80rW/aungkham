import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LayerText, layerTransform } from './text-layer-view'
import { TEMPLATES, TEMPLATE_GROUPS, type TemplateDef, type TemplateLang } from '@/lib/templates'
import type { TextLayer } from '@/lib/text-layer'

interface TemplatePickerProps {
  open: boolean
  onClose: () => void
  onApply: (layers: TextLayer[]) => void
}

const THUMB_BG = [
  '#ffffff',
  '#f3f1ec',
  '#e8eef7',
  '#fdf0e6',
  '#eef6ef',
  '#f7ecf3',
  '#e9e9ec',
  '#fbf6dd',
]


function hashOf(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function TemplateThumb({ template, bg }: { template: TemplateDef; bg: string }) {
  const layers = useMemo(() => template.build(), [template])
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl"
      style={{ containerType: 'size', lineHeight: 0, background: bg }}
    >
      {layers.map((layer) => (
        <div
          key={layer.id}
          style={{
            position: 'absolute',
            left: `${layer.x}%`,
            top: `${layer.y}%`,
            transform: layerTransform(layer),
            opacity: layer.opacity,
            whiteSpace: 'nowrap',
          }}
        >
          <LayerText layer={layer} />
        </div>
      ))}
    </div>
  )
}

export function TemplatePicker({ open, onClose, onApply }: TemplatePickerProps) {
  const [lang, setLang] = useState<TemplateLang>('EN')
  const [group, setGroup] = useState('All')

  const list = useMemo(
    () =>
      TEMPLATES.filter((t) => t.lang === lang && (group === 'All' || t.group === group)),
    [lang, group],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/85 backdrop-blur-xl">
      <header className="glass-bar flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-3">
        <span className="text-sm font-semibold">Templates</span>
        <div className="ml-auto flex items-center gap-1 rounded-full border border-border/50 p-0.5">
          {(['EN', 'MM'] as TemplateLang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-semibold transition',
                lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {l === 'EN' ? 'English' : 'မြန်မာ'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close templates"
          className="rounded-full p-2 text-foreground/80 transition active:scale-95"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TEMPLATE_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition',
              group === g
                ? 'bg-primary text-primary-foreground'
                : 'glass-tile text-muted-foreground',
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
        <div className="flex flex-col gap-3">
          {list.map((t) => {
            const bg = THUMB_BG[hashOf(t.id) % THUMB_BG.length]
            return (
              <button
                key={t.id}
                type="button"
                aria-label={t.name}
                onClick={() => {
                  onApply(t.build())
                  onClose()
                }}
                className="glass-tile w-full overflow-hidden rounded-2xl p-1.5 transition active:scale-[0.98]"
              >
                <div className="aspect-[16/9] w-full">
                  <TemplateThumb template={t} bg={bg} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
