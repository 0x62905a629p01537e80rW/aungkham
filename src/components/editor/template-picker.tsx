import { useMemo, useState } from 'react'
import { Crown, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { GlassTabs } from '@/components/ui/glass-tabs'
import { LayerText, layerTransform } from './text-layer-view'
import { TEMPLATES, TEMPLATE_GROUPS, type TemplateDef, type TemplateLang } from '@/lib/templates'
import type { TextLayer } from '@/lib/text-layer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/components/i18n'

interface TemplatePickerProps {
  open: boolean
  onClose: () => void
  onApply: (layers: TextLayer[], bg?: string) => void
  hasBackground?: boolean
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
      style={{
        containerType: 'size',
        lineHeight: 0,
        background: template.bg ? `center / cover no-repeat url(${template.bg})` : bg,
      }}
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
  scroll = true,
  onRequestChoice,
}: {
  onApply?: (layers: TextLayer[], bg?: string) => void
  className?: string
  /** When false the gallery grows with its content and relies on a parent scroller. */
  scroll?: boolean
  /** If provided, the gallery asks before applying instead of calling onApply directly. */
  onRequestChoice?: (layers: TextLayer[], bg?: string) => void
}) {
  const [lang, setLang] = useState<TemplateLang>('EN')
  const [group, setGroup] = useState('All')
  const activeGroup = lang === 'EN' && group === 'New' ? 'All' : group

  const list = useMemo(
    () => TEMPLATES.filter((t) => t.lang === lang && (activeGroup === 'All' || t.group === activeGroup)),
    [lang, activeGroup],
  )

  return (
    <div className={cn('flex flex-col', scroll && 'min-h-0 flex-1', className)}>
      <div className="sticky top-0 z-10 -mx-1 bg-background/80 px-1 pt-1 backdrop-blur-xl">
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
            value={activeGroup}
            onChange={(g) => setGroup(g as typeof group)}
            items={TEMPLATE_GROUPS.filter((g) => !(lang === 'EN' && g === 'New')).map((g) => ({
              key: g,
              label: g,
            }))}
          />
        </div>
      </div>

      <div className={cn(scroll ? 'min-h-0 flex-1 overflow-y-auto perf-scroll no-scrollbar pb-8' : 'pb-2')}>

        <div className="flex flex-col gap-2">
          {list.map((t) => {
            const bg = THUMB_BG[hashOf(t.id) % THUMB_BG.length]
            const isPremium = t.group === 'Premium'
            return (
              <button
                key={t.id}
                type="button"
                aria-label={t.name}
                onClick={() => {
                  if (onRequestChoice) {
                    onRequestChoice(t.build(), t.bg)
                  } else {
                    onApply?.(t.build(), t.bg)
                  }
                }}
                className="glass-tile w-full touch-pan-y overflow-hidden rounded-2xl p-1.5 transition active:scale-[0.98]"
              >
                <div className="pointer-events-none relative aspect-[16/9] w-full">
                  <TemplateThumb template={t} bg={bg} />
                  {isPremium && (
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
                      <Crown className="size-3 text-yellow-400" />
                      <span className="text-[10px] font-bold text-white">Pro</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export function TemplatePicker({ open, onClose, onApply, hasBackground = false }: TemplatePickerProps) {
  const { t } = useI18n()
  const [pending, setPending] = useState<{ layers: TextLayer[]; bg?: string } | null>(null)

  if (!open) return null

  const handleRequestChoice = (layers: TextLayer[], bg?: string) => {
    if (hasBackground) {
      setPending({ layers, bg })
    } else {
      onApply(layers, bg)
      onClose()
    }
  }

  const handleReplace = () => {
    if (!pending) return
    onApply(pending.layers, pending.bg)
    setPending(null)
    onClose()
  }

  const handleStylesOnly = () => {
    if (!pending) return
    onApply(pending.layers, undefined)
    setPending(null)
    onClose()
  }

  const handleCancel = () => {
    setPending(null)
  }

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
        onRequestChoice={handleRequestChoice}
      />

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent className="glass-panel max-w-[min(92vw,320px)] rounded-3xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('template.apply.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('template.apply.desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleReplace}
              className="w-full rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
            >
              {t('template.apply.replace')}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleStylesOnly}
              className="w-full rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {t('template.apply.styles')}
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={handleCancel}
              className="mt-0 w-full rounded-full border border-border/50 bg-transparent hover:bg-accent"
            >
              {t('template.apply.cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
