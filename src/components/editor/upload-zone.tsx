import { toast } from 'sonner'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowLeft,
  Plus,
  Camera,
  FolderOpen,
  ImageIcon,
  LayoutTemplate,
  Image as BackgroundIcon,
  Palette,
  Blend,
  Store,
  Type,
  Trash2,
  Gem,
  LayoutGrid,
  Scissors,
  Pencil,
  PenTool,
  SlidersHorizontal,
  Wand2,
  Maximize2,
  Sparkles,
  Download,
  Droplets,
  Box,
  Grid2x2,
  Layers,
  MoveDiagonal,
  Highlighter,
  Eraser,
  Stars,
} from 'lucide-react'
import { useI18n } from '@/components/i18n'
import { useAuth } from '@/components/auth-provider'
import { PaymentPage } from './payment-page'
import { Crown } from 'lucide-react'
import { ColorPickerFullScreen } from './color-picker'
import { GradientGrid, SolidGrid } from './color-grids'
import { AspectPicker } from './aspect-picker'
import { DownloadedBackgrounds } from './downloaded-backgrounds'
import { deleteProject, loadProjects, type SavedProject } from '@/lib/projects'
import { TemplateGallery, TemplateThumb } from './template-picker'
import { StorePanel } from './store-panel'
import { DownloadFontsSheet } from './download-fonts-sheet'
import { UPLOADED_TEMPLATES } from '@/lib/uploaded-templates'
import { useFloatingTemplates } from '@/lib/floating-templates'
import type { TextLayer } from '@/lib/text-layer'

import { gradientCss, makeBackgroundDataUrl } from '@/lib/background'
import {
  CANVAS_ACTIONS,
  TEXT_ACTIONS,
  ULTRA_ACTIONS,
  type QuickAction,
} from '@/lib/quick-actions'

type Tab = 'create' | 'fonts' | 'templates' | 'store' | 'projects' | 'more'

export function UploadZone({
  onImage,
  onOpenProject,
  onStartTemplates,
  onApplyTemplate,
  onQuickAction,
}: {
  onImage: (dataUrl: string) => void
  /** Photo picked for a "More" / "Ultra HD" shortcut — opens that tool directly. */
  onQuickAction?: (dataUrl: string, action: QuickAction) => void
  onOpenProject?: (project: SavedProject) => void
  onStartTemplates?: () => void
  onApplyTemplate?: (layers: TextLayer[], bg?: string) => void
}) {
  const FEATURED = useFloatingTemplates(UPLOADED_TEMPLATES)
  const { t } = useI18n()
  const { isPro } = useAuth()
  const [payOpen, setPayOpen] = useState(false)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('create')
  const [picker, setPicker] = useState<'solid' | 'gradient' | null>(null)
  const [pendingCss, setPendingCss] = useState<string | null>(null)
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [storeTab, setStoreTab] = useState<'templates' | 'fonts'>('fonts')
  const pendingAction = useRef<QuickAction | null>(null)
  const solidRef = useRef<HTMLDivElement>(null)
  const gradientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setProjects(loadProjects())
  }, [])

  function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const action = pendingAction.current
    pendingAction.current = null
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      if (action && onQuickAction) onQuickAction(src, action)
      else onImage(src)
    }
    reader.readAsDataURL(file)
  }

  /** Pick a photo, then land the user directly inside the chosen tool. */
  function startAction(action: QuickAction) {
    if (action.kind === 'ultrahd' && !isPro) {
      setPayOpen(true)
      return
    }
    if (action.kind === 'ultrahd' && typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast.error('No connection', { description: 'Ultra HD needs an internet connection.' })
      return
    }
    pendingAction.current = action
    galleryRef.current?.click()
  }

  /** Smoothly scroll the home page down to one of its sections. */
  function scrollToSection(ref: { current: HTMLDivElement | null }) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const TOOLS: { id: string; label: string; icon: typeof BackgroundIcon; run: () => void }[] = [
    { id: 'fonts', label: 'Fonts', icon: Type, run: () => setTab('fonts') },
    { id: 'store', label: 'Store', icon: Store, run: () => { setStoreTab('fonts'); setTab('store') } },
    { id: 'solid', label: t('home.solidColors'), icon: Palette, run: () => scrollToSection(solidRef) },
    { id: 'gradient', label: t('home.gradients'), icon: Blend, run: () => scrollToSection(gradientRef) },
    { id: 'camera', label: t('home.takePhoto') ?? 'Camera', icon: Camera, run: () => cameraRef.current?.click() },
    { id: 'projects', label: t('home.tab.projects'), icon: FolderOpen, run: () => setTab('projects') },
    {
      id: 'ultrahd',
      label: 'Ultra HD',
      icon: Gem,
      run: () => startAction(ULTRA_ACTIONS[0]),
    },
    { id: 'more', label: 'More', icon: LayoutGrid, run: () => setTab('more') },
  ]

  const ACTION_ICONS: Record<string, typeof BackgroundIcon> = {
    removebg: Scissors,
    draw: Pencil,
    freeform: PenTool,
    filter: Wand2,
    adjust: SlidersHorizontal,
    upscale: Maximize2,
    sharpen: Sparkles,
    hdexport: Download,
    liquid: Droplets,
    depth3d: Box,
    texture: Grid2x2,
    blend: Layers,
    skew: MoveDiagonal,
    highlight: Highlighter,
    erase: Eraser,
    fx: Stars,
  }

  const SUB_TITLES: Record<string, string> = {
    fonts: 'Fonts',
    templates: t('home.tab.templates'),
    store: 'Store',
    projects: t('home.tab.projects'),
    more: 'More',
  }

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('home-subview', { detail: tab !== 'create' }))
    return () => {
      window.dispatchEvent(new CustomEvent('home-subview', { detail: false }))
    }
  }, [tab])

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      {tab !== 'create' && (
        <div
          className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background px-3 py-2.5"
          style={{ paddingTop: 'calc(var(--safe-top) + 0.625rem)' }}
        >
          <button
            type="button"
            onClick={() => setTab('create')}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h2 className="truncate text-base font-semibold text-foreground">{SUB_TITLES[tab]}</h2>
        </div>
      )}

      <div
        onScroll={(e) =>
          window.dispatchEvent(
            new CustomEvent('home-scroll', { detail: e.currentTarget.scrollTop > 8 }),
          )
        }
        className={`flex min-h-0 w-full flex-1 flex-col overscroll-contain perf-scroll no-scrollbar ${
          tab === 'store' ? 'overflow-hidden' : 'overflow-y-auto'
        } ${tab === 'create' ? 'pb-6' : tab === 'templates' ? '' : 'px-4 py-4'}`}
      >


        {tab === 'create' && (
          <div className="flex flex-col">
            {/* Hero banner */}
            <div className="relative h-[17.5rem] w-full overflow-hidden">
              {/* Animated template band — starts below the header */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 top-14 flex flex-col justify-start gap-2.5 overflow-hidden pt-3 opacity-80"
              >
                {[0, 1].map((row) => (
                  <div
                    key={row}
                    className="marquee-track gap-2.5"
                    style={{
                      animationDuration: row ? '34s' : '26s',
                      animationDirection: row ? 'reverse' : 'normal',
                    }}
                  >
                    {[...FEATURED.slice(0, 12), ...FEATURED.slice(0, 12)].map((tpl, i) => (
                      <div
                        key={`${row}-${i}`}
                        className="relative h-[84px] w-[150px] shrink-0 overflow-hidden rounded-xl border border-border/50"
                      >
                        <TemplateThumb template={tpl} bg="#0d0d14" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Soft scrim under the header */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-24"
                style={{
                  background:
                    'linear-gradient(180deg, var(--background) 0%, color-mix(in oklab, var(--background) 85%, transparent) 55%, transparent 100%)',
                }}
              />

              {/* Bottom fade + brand tint */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(120% 80% at 20% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 65%), linear-gradient(180deg, transparent 30%, color-mix(in oklab, var(--background) 75%, transparent) 62%, var(--background) 100%)',
                }}
              />

              <div className="relative flex h-full flex-col justify-end px-5 pb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Text on Photo
                </p>
                <h1 className="mt-1 text-3xl font-black leading-none tracking-tight text-foreground">
                  Myan Studio
                </h1>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Fonts, templates & effects in one place
                </p>
              </div>
            </div>



            {/* Primary actions */}
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 px-4">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-primary text-primary-foreground shadow-lg transition active:scale-[0.98]"
              >
                <Plus className="size-6" />
                <span className="text-[15px] font-bold">Editing</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('templates')}
                className="flex h-20 w-28 flex-col items-center justify-center gap-1.5 rounded-2xl bg-secondary text-foreground shadow-lg transition active:scale-[0.98]"
              >
                <LayoutTemplate className="size-6" />
                <span className="text-[15px] font-bold">Templates</span>
              </button>
            </div>



            {/* Tool grid */}
            <div className="mt-6 grid grid-cols-4 gap-y-6 px-4">
              {TOOLS.map(({ id, label, icon: Icon, run }) => (
                <button
                  key={id}
                  type="button"
                  onClick={run}
                  className="flex flex-col items-center gap-2 transition active:scale-95"
                >
                  <span className="relative">
                    <Icon className="size-6 text-foreground" strokeWidth={1.6} />
                    {id === 'ultrahd' && !isPro && (
                      <span className="absolute -right-2 -top-1 grid size-3.5 place-items-center rounded-full bg-[linear-gradient(120deg,#f7d774,#e0a93c_55%,#c98a2b)] text-[#3a2a05]">
                        <Crown className="size-2.5" strokeWidth={2.8} />
                      </span>
                    )}
                  </span>
                  <span className="w-full truncate px-0.5 text-center text-[11px] font-medium text-muted-foreground">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Explore */}
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between px-4">
                <h2 className="text-lg font-bold text-foreground">Explore</h2>
                <button
                  type="button"
                  onClick={() => setTab('templates')}
                  className="text-xs font-semibold text-primary transition active:opacity-70"
                >
                  {t('home.seeAllTemplates')}
                </button>
              </div>
              <div className="grid grid-flow-col grid-rows-2 auto-cols-[9.5rem] gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
                {FEATURED.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onApplyTemplate?.(tpl.build(), tpl.bg)}
                    className="relative w-full shrink-0 overflow-hidden rounded-xl border border-border/40 bg-secondary transition active:scale-95"
                  >
                    <div className="pointer-events-none relative aspect-video w-full">

                      <TemplateThumb template={tpl} />
                    </div>
                  </button>
                ))}
              </div>

            </div>

            {/* Colors */}
            <div ref={solidRef} className="mt-8 scroll-mt-3 px-4">
              <h2 className="mb-3 text-lg font-bold text-foreground">{t('home.solidColors')}</h2>
              <SolidGrid onPick={(c) => setPendingCss(c)} onCustom={() => setPicker('solid')} />
            </div>

            <div ref={gradientRef} className="mt-6 scroll-mt-3 px-4">
              <h2 className="mb-3 text-lg font-bold text-foreground">{t('home.gradients')}</h2>
              <GradientGrid
                onPick={(stops) => setPendingCss(gradientCss(stops))}
                onCustom={() => setPicker('gradient')}
              />
            </div>

            <div className="mt-6 px-4">
              <DownloadedBackgrounds onPick={(src) => onImage(src)} />
            </div>
          </div>
        )}

        {tab === 'more' && (
          <div className="space-y-7 pb-6">
            {[
              { title: 'Canvas', items: CANVAS_ACTIONS },
              { title: 'Ultra HD', items: ULTRA_ACTIONS },
              { title: 'Text', items: TEXT_ACTIONS },
            ].map(({ title, items }) => (
              <section key={title}>
                <h3 className="pb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {title}
                </h3>
                <div className="grid grid-cols-4 gap-y-6">
                  {items.map((action) => {
                    const Icon = ACTION_ICONS[action.id] ?? ImageIcon
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => startAction(action)}
                        className="flex flex-col items-center gap-2 transition active:scale-95"
                      >
                        <span className="relative">
                          <Icon className="size-6 text-foreground" strokeWidth={1.6} />
                          {action.kind === 'ultrahd' && !isPro && (
                            <span className="absolute -right-2 -top-1 grid size-3.5 place-items-center rounded-full bg-[linear-gradient(120deg,#f7d774,#e0a93c_55%,#c98a2b)] text-[#3a2a05]">
                              <Crown className="size-2.5" strokeWidth={2.8} />
                            </span>
                          )}
                        </span>
                        <span className="w-full px-0.5 text-center text-[11px] font-medium leading-tight text-muted-foreground">
                          {action.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === 'store' && (
          <StorePanel
            initialTab={storeTab}
            onApplyTemplate={onApplyTemplate}
            onUseBackground={(src) => onImage(src)}
          />
        )}

        {tab === 'fonts' && <DownloadFontsSheet open inline />}

        {tab === 'templates' &&
          (onApplyTemplate ? (
            <TemplateGallery
              scroll={false}
              onApply={onApplyTemplate}
              onOpenStore={() => {
                setStoreTab('templates')
                setTab('store')
              }}
            />
          ) : (
            <button
              type="button"
              onClick={onStartTemplates}
              className="glass-cta flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-semibold active:scale-[0.98]"
            >
              <LayoutTemplate className="size-5" />
              {t('home.templates')}
            </button>
          ))}

        {tab === 'projects' &&
          (projects.length === 0 ? (
            <div className="glass-panel mb-2 flex min-h-[24rem] flex-1 flex-col items-center justify-center rounded-2xl px-6 py-12 text-center">
              <div className="mb-3 grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <FolderOpen className="size-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{t('home.noProjects')}</p>
              <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
                {t('home.noProjectsHint')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {projects.map((p) => (
                <div key={p.id} className="glass-tile group relative overflow-hidden rounded-2xl">
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => onOpenProject?.(p)}
                  >
                    <img
                      src={p.preview || p.image}
                      alt="Saved project"
                      className="aspect-square w-full object-cover"
                    />
                    <span className="block px-2 py-1.5 text-left text-[11px] text-muted-foreground">
                      {new Date(p.savedAt).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t('home.deleteProject')}
                    onClick={() => setProjects(deleteProject(p.id))}
                    className="glass-tile absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-lg text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ))}
      </div>


      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={readFile} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={readFile}
      />

      <ColorPickerFullScreen
        key={picker ?? 'closed'}
        open={picker !== null}
        allowGradient
        initialMode={picker ?? 'solid'}
        value={picker === 'gradient' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#8235DC'}
        onClose={() => setPicker(null)}
        onConfirm={(css) => {
          setPicker(null)
          setPendingCss(css)
        }}
      />

      <AspectPicker
        open={pendingCss !== null}
        preview={pendingCss ?? undefined}
        onClose={() => setPendingCss(null)}
        onPick={(ratio) => {
          const css = pendingCss!
          setPendingCss(null)
          onImage(makeBackgroundDataUrl(css, 1200, ratio))
        }}
      />

      <PaymentPage open={payOpen} onClose={() => setPayOpen(false)} />
    </div>
  )
}
