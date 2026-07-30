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

export function TemplateGallery({
  onApply,
  className,
}: {
  onApply: (layers: TextLayer[]) => void
  className?: string
}) {
  const [lang, setLang] = useState<TemplateLang>('EN')
  const [group, setGroup] = useState('All')

  const list = useMemo(
    () => TEMPLATES.filter((t) => t.lang === lang && (group === 'All' || t.group === group)),
    [lang, group],
  )

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="flex shrink-0 items-center justify-end gap-1 pb-2">
        <GlassTabs
          size="sm"
          className="w-auto"
          value={lang}
          onChange={(l) => setLang(l as TemplateLang)}
          items={[
            { key: 'EN', label: 'English' },
            { key: 'MM', label: 'မြန်မာ' },
          ]}
        />
      </div>

      <div className="shrink-0 pb-2">
        <GlassTabs
          variant="chips"
          size="sm"
          value={group}
          onChange={(g) => setGroup(g as typeof group)}
          items={TEMPLATE_GROUPS.map((g) => ({ key: g, label: g }))}
        />
      </div>


      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        <div className="flex flex-col gap-2">
          {list.map((t) => {
            const bg = THUMB_BG[hashOf(t.id) % THUMB_BG.length]
            return (
              <button
                key={t.id}
                type="button"
                aria-label={t.name}
                onClick={() => onApply(t.build())}
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

export function TemplatePicker({ open, onClose, onApply }: TemplatePickerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/85 backdrop-blur-xl">
      <header className="glass-bar flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-3">
        <span className="text-sm font-semibold">Templates</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close templates"
          className="ml-auto rounded-full p-2 text-foreground/80 transition active:scale-95"
        >
          <X className="size-5" />
        </button>
      </header>

      <TemplateGallery
        className="px-3 pt-2"
        onApply={(layers) => {
          onApply(layers)
          onClose()
        }}
      />
    </div>
  )
}
