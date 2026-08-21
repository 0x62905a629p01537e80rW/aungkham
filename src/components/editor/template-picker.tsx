import { useEffect, useMemo, useState } from 'react'
import { Check, Crown, Download, LayoutGrid, Rows3, Store, X } from 'lucide-react'


import { cn } from '@/lib/utils'

import { LayerText, layerTransform } from './text-layer-view'
import { TEMPLATES, TEMPLATE_GROUPS, type TemplateDef, type TemplateLang } from '@/lib/templates'
import { ensureRemoteFontsForKeys } from '@/lib/remote-fonts'
import type { TextLayer } from '@/lib/text-layer'
import { exportTemplatesJson } from '@/lib/export-templates'
import {
  ensureTemplatePacksLoaded,
  listDownloadedTemplateDefs,
  subscribeRemoteTemplates,
} from '@/lib/remote-templates'

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

export function TemplateThumb({ template, bg = '#ffffff' }: { template: TemplateDef; bg?: string }) {
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
  onOpenStore,
}: {
  onApply?: (layers: TextLayer[], bg?: string) => void
  className?: string
  /** When false the gallery grows with its content and relies on a parent scroller. */
  scroll?: boolean
  /** If provided, the gallery asks before applying instead of calling onApply directly. */
  onRequestChoice?: (layers: TextLayer[], bg?: string) => void
  /** Opens the Store on its Templates section. */
  onOpenStore?: () => void
}) {
  const [lang, setLang] = useState<TemplateLang>('EN')
  const [group, setGroup] = useState('All')
  const [view, setView] = useState<'single' | 'grid'>('grid')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [tick, force] = useState(0)
  const activeGroup = lang === 'EN' && group === 'New' ? 'All' : group

  useEffect(() => {
    void ensureTemplatePacksLoaded().then(() => force((n) => n + 1))
      .then(() => force((n) => n + 1))
      .catch(() => {})
    return subscribeRemoteTemplates(() => force((n) => n + 1))
  }, [])

  const downloaded = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => listDownloadedTemplateDefs(),
    [tick],
  )

  const groups = useMemo(
    () => [
      ...TEMPLATE_GROUPS.filter(
        (g) => !(lang === 'EN' && (g === 'New' || g === 'Logo' || g === 'Thumbnail' || g === 'Facebook Ad')),
      ),
      'Free',
      'Downloaded',
    ],
    [lang],
  )

  const list = useMemo(() => {
    if (activeGroup === 'Downloaded') return downloaded
    return TEMPLATES.filter(
      (t) =>
        t.lang === lang &&
        (activeGroup === 'All'
          ? true
          : activeGroup === 'Free'
            ? t.group !== 'Premium'
            : t.group === activeGroup),
    )
  }, [lang, activeGroup, downloaded])

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    const picked = list.filter((t) => selected.includes(t.id))
    if (!picked.length || exporting) return
    setExporting(true)
    try {
      await exportTemplatesJson(picked)
      setSelectMode(false)
      setSelected([])
    } finally {
      setExporting(false)
    }
  }


  return (
    <div className={cn('flex flex-col', scroll && 'min-h-0 flex-1', className)}>
      <div className="sticky top-0 z-30 bg-background shadow-[0_1px_0_hsl(var(--border)/0.4)]">
        <div className="flex items-center gap-2 px-4 pt-3">
          <div className="relative flex items-center rounded-full bg-secondary p-0.5">
            <span
              aria-hidden
              className="absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full bg-primary transition-transform duration-300 ease-out"
              style={{ transform: lang === 'EN' ? 'translateX(0%)' : 'translateX(100%)' }}
            />
            {(['EN', 'MM'] as TemplateLang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn(
                  'relative z-10 w-[4.75rem] rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors duration-300',
                  lang === l ? 'text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {l === 'EN' ? 'English' : 'မြန်မာ'}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {selectMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelected(list.map((t) => t.id))}
                  className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-foreground"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!selected.length || exporting}
                  className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-40"
                >
                  <Download className="size-3" />
                  {exporting ? 'Exporting…' : selected.length}
                </button>
              </>
            ) : (
              <>
                {onOpenStore && (
                  <button
                    type="button"
                    onClick={onOpenStore}
                    aria-label="Open template store"
                    className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-foreground active:scale-95"
                  >
                    <Store className="size-3.5" />
                    Store
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setView((v) => (v === 'single' ? 'grid' : 'single'))}
                  aria-label={view === 'single' ? 'Switch to grid view' : 'Switch to single view'}
                  className="flex size-8 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95"
                >
                  {view === 'single' ? (
                    <LayoutGrid className="size-4" />
                  ) : (
                    <Rows3 className="size-4" />
                  )}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectMode((v) => !v)
                setSelected([])
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-[11px] font-semibold transition',
                selectMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
              )}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          </div>
        </div>


        <div className="mt-2.5 flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-2.5">
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition',
                activeGroup === g
                  ? 'bg-foreground text-background'
                  : 'bg-secondary/70 text-muted-foreground',
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          'px-4 pt-3',
          scroll ? 'min-h-0 flex-1 overflow-y-auto perf-scroll no-scrollbar pb-8' : 'pb-4',
        )}
      >


        {activeGroup === 'Downloaded' && !list.length && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No downloaded templates yet — get them from the Store.
          </p>
        )}

        <div className={cn(view === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2')}>
          {list.map((t) => {
            const bg = THUMB_BG[hashOf(t.id) % THUMB_BG.length]
            const isPremium = t.group === 'Premium'
            const isSel = selected.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                aria-label={t.name}
                aria-pressed={selectMode ? isSel : undefined}
                onClick={() => {
                  if (selectMode) {
                    toggleSelect(t.id)
                  } else if (onRequestChoice) {
                    onRequestChoice(t.build(), t.bg)
                  } else {
                    onApply?.(t.build(), t.bg)
                  }
                }}
                className={cn(
                  'glass-tile w-full touch-pan-y overflow-hidden rounded-2xl p-1.5 transition active:scale-[0.98]',
                  selectMode && isSel && 'ring-2 ring-primary',
                )}
              >
                <div className="pointer-events-none relative aspect-[16/9] w-full">
                  <TemplateThumb template={t} bg={bg} />
                  {isPremium && (
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
                      <Crown className="size-3 text-yellow-400" />
                      <span className="text-[10px] font-bold text-white">Pro</span>
                    </div>
                  )}
                  {selectMode && (
                    <div
                      className={cn(
                        'absolute left-2 top-2 z-10 flex size-5 items-center justify-center rounded-full border border-white/70',
                        isSel ? 'bg-primary text-primary-foreground' : 'bg-black/40',
                      )}
                    >
                      {isSel && <Check className="size-3" />}
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
      <header
        className="glass-bar flex shrink-0 items-center gap-2 border-b border-border/40 px-3 pb-2"
        style={{ paddingTop: 'calc(0.5rem + var(--safe-top))' }}
      >
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
