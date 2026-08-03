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
} from 'lucide-react'
import { useI18n } from '@/components/i18n'
import { ColorPickerFullScreen } from './color-picker'
import { GradientGrid, SolidGrid } from './color-grids'
import { AspectPicker } from './aspect-picker'
import { DownloadedBackgrounds } from './downloaded-backgrounds'
import { deleteProject, loadProjects, type SavedProject } from '@/lib/projects'
import { TemplateGallery, TemplateThumb } from './template-picker'
import { StorePanel } from './store-panel'
import { DownloadFontsSheet } from './download-fonts-sheet'
import { UPLOADED_TEMPLATES } from '@/lib/uploaded-templates'
import type { TextLayer } from '@/lib/text-layer'

import { gradientCss, makeBackgroundDataUrl } from '@/lib/background'

type Tab = 'create' | 'fonts' | 'templates' | 'store' | 'projects'

export function UploadZone({
  onImage,
  onOpenProject,
  onStartTemplates,
  onApplyTemplate,
}: {
  onImage: (dataUrl: string) => void
  onOpenProject?: (project: SavedProject) => void
  onStartTemplates?: () => void
  onApplyTemplate?: (layers: TextLayer[], bg?: string) => void
}) {
const FEATURED = UPLOADED_TEMPLATES

  const { t } = useI18n()
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('create')
  const [picker, setPicker] = useState<'solid' | 'gradient' | null>(null)
  const [pendingCss, setPendingCss] = useState<string | null>(null)
  const [projects, setProjects] = useState<SavedProject[]>([])

  useEffect(() => {
    setProjects(loadProjects())
  }, [])

  function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const TOOLS: { id: string; label: string; icon: typeof BackgroundIcon; run: () => void }[] = [
    { id: 'gallery', label: 'Gallery', icon: ImageIcon, run: () => galleryRef.current?.click() },
    { id: 'templates', label: t('home.tab.templates'), icon: LayoutTemplate, run: () => setTab('templates') },
    { id: 'fonts', label: 'Fonts', icon: Type, run: () => setTab('fonts') },
    { id: 'store', label: 'Store', icon: Store, run: () => setTab('store') },
    { id: 'solid', label: t('home.solidColors'), icon: Palette, run: () => setPicker('solid') },
    { id: 'gradient', label: t('home.gradients'), icon: Blend, run: () => setPicker('gradient') },
    { id: 'camera', label: t('home.takePhoto') ?? 'Camera', icon: Camera, run: () => cameraRef.current?.click() },
    { id: 'projects', label: t('home.tab.projects'), icon: FolderOpen, run: () => setTab('projects') },
  ]

  const SUB_TITLES: Record<string, string> = {
    fonts: 'Fonts',
    templates: t('home.tab.templates'),
    store: 'Store',
    projects: t('home.tab.projects'),
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tab !== 'create' && (
        <div className="flex shrink-0 items-center gap-3 border-b border-border/50 px-4 py-3">
          <button
            type="button"
            onClick={() => setTab('create')}
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-foreground transition active:scale-95"
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
        } ${tab === 'create' ? 'pb-6' : 'px-4 py-4'}`}
      >

        {tab === 'create' && (
          <div className="flex flex-col">
            {/* Hero banner */}
            <div className="relative h-44 w-full overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(120% 90% at 20% 0%, color-mix(in oklab, var(--primary) 55%, transparent), transparent 60%), radial-gradient(100% 80% at 90% 20%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 65%), linear-gradient(180deg, color-mix(in oklab, var(--primary) 20%, var(--background)), var(--background))',
                }}
              />
              <div className="relative flex h-full flex-col justify-end px-5 pb-8">
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
                  <Icon className="size-6 text-foreground" strokeWidth={1.6} />
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
            <div className="mt-8 px-4">
              <h2 className="mb-3 text-lg font-bold text-foreground">{t('home.solidColors')}</h2>
              <SolidGrid onPick={(c) => setPendingCss(c)} onCustom={() => setPicker('solid')} />
            </div>

            <div className="mt-6 px-4">
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

        {tab === 'store' && (
          <StorePanel onApplyTemplate={onApplyTemplate} onUseBackground={(src) => onImage(src)} />
        )}

        {tab === 'fonts' && <DownloadFontsSheet open inline />}

        {tab === 'templates' &&
          (onApplyTemplate ? (
            <TemplateGallery scroll={false} onApply={onApplyTemplate} />
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
    </div>
  )
}
