import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  FolderOpen,
  ImageIcon,
  LayoutTemplate,
  Image as BackgroundIcon,
  Trash2,
} from 'lucide-react'
import { useI18n } from '@/components/i18n'
import { ColorPickerFullScreen } from './color-picker'
import { GradientGrid, SolidGrid } from './color-grids'
import { deleteProject, loadProjects, type SavedProject } from '@/lib/projects'
import { TemplateGallery } from './template-picker'
import type { TextLayer } from '@/lib/text-layer'

import { makeBackgroundDataUrl, makeGradientDataUrl, makeSolidDataUrl } from '@/lib/background'

type Tab = 'create' | 'templates' | 'projects'

export function UploadZone({
  onImage,
  onOpenProject,
  onStartTemplates,
  onApplyTemplate,
}: {
  onImage: (dataUrl: string) => void
  onOpenProject?: (project: SavedProject) => void
  onStartTemplates?: () => void
  onApplyTemplate?: (layers: TextLayer[]) => void
}) {
  const { t } = useI18n()
  const galleryRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('create')
  const [picker, setPicker] = useState<'solid' | 'gradient' | null>(null)
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

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden px-6 pb-8 pt-5"
      style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
    >
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 40% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%), radial-gradient(60% 40% at 50% 100%, color-mix(in oklab, var(--accent-foreground) 12%, transparent), transparent 70%)',
        }}
      />

      {/* Tabs — floating liquid glass pill */}
      <div
        className="relative mx-auto flex w-full max-w-sm items-center gap-1 rounded-[2rem] p-1.5"
        style={{
          background:
            'linear-gradient(150deg, color-mix(in oklab, var(--card) 62%, transparent), color-mix(in oklab, var(--card) 34%, transparent))',
          backdropFilter: 'blur(30px) saturate(190%)',
          border: '1px solid color-mix(in oklab, var(--foreground) 8%, transparent)',
          boxShadow:
            'inset 0 1px 0 var(--glass-rim), inset 0 0 0 1px var(--glass-edge), 0 18px 40px -18px var(--glass-shadow)',
        }}
      >
        {(() => {
          const tabs: { id: Tab; label: string; icon: typeof BackgroundIcon }[] = [
            { id: 'create', label: t('home.tab.create'), icon: BackgroundIcon },
            { id: 'templates', label: t('home.tab.templates'), icon: LayoutTemplate },
            { id: 'projects', label: t('home.tab.projects'), icon: FolderOpen },
          ]
          const index = tabs.findIndex((x) => x.id === tab)
          return (
            <>
              {/* Glass lens that slides under the active tab */}
              <span
                aria-hidden
                className="absolute left-1.5 top-1.5 bottom-1.5 rounded-[1.6rem] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.32,1.4,0.4,1)]"
                style={{
                  width: `calc((100% - 0.75rem - ${(tabs.length - 1) * 0.25}rem) / ${tabs.length})`,
                  transform: `translateX(calc(${index} * (100% + 0.25rem)))`,
                  background:
                    'linear-gradient(160deg, color-mix(in oklab, var(--background) 88%, transparent), color-mix(in oklab, var(--background) 58%, transparent))',
                  backdropFilter: 'blur(10px) saturate(150%)',
                  boxShadow:
                    'inset 0 1px 0 var(--glass-rim), inset 0 -1px 0 color-mix(in oklab, var(--foreground) 8%, transparent), 0 8px 20px -10px var(--glass-shadow)',
                  border: '1px solid color-mix(in oklab, var(--foreground) 7%, transparent)',
                }}
              />
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-1 rounded-[1.6rem] px-2 py-2 text-[11px] font-semibold transition-all duration-300 active:scale-95 ${
                    tab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon
                    className={`transition-all duration-300 ${tab === id ? 'size-5 scale-105' : 'size-[18px]'}`}
                  />
                  <span className="leading-none">{label}</span>
                </button>
              ))}
            </>
          )
        })()}
      </div>


      {/* Tab content */}
      <div className="mx-auto mt-5 flex w-full max-w-sm flex-1 flex-col overflow-y-auto pb-4">
        {tab === 'create' && (
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-semibold text-primary-foreground transition active:scale-[0.98]"
              style={{
                background:
                  'linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 62%, white))',
                boxShadow:
                  '0 16px 34px -14px color-mix(in oklab, var(--primary) 70%, transparent)',
              }}
            >
              <ImageIcon className="size-5" />
              {t('home.chooseLibrary')}
            </button>

            <div>
              <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('home.solidColors')}
              </span>
              <SolidGrid
                onPick={(c) => onImage(makeSolidDataUrl(c))}
                onCustom={() => setPicker('solid')}
              />
            </div>

            <div>
              <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('home.gradients')}
              </span>
              <GradientGrid
                onPick={(stops) => onImage(makeGradientDataUrl(stops))}
                onCustom={() => setPicker('gradient')}
              />
            </div>
          </div>
        )}

        {tab === 'templates' &&
          (onApplyTemplate ? (
            <TemplateGallery onApply={onApplyTemplate} />
          ) : (
            <button
              type="button"
              onClick={onStartTemplates}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg transition active:scale-[0.98]"
            >
              <LayoutTemplate className="size-5" />
              {t('home.templates')}
            </button>
          ))}

        {tab === 'projects' &&
          (projects.length === 0 ? (
            <div className="glass-panel flex flex-1 flex-col items-center justify-center rounded-3xl px-6 py-12 text-center">
              <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
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
                <div
                  key={p.id}
                  className="glass-tile group relative overflow-hidden rounded-2xl"
                >
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
                    className="glass-tile absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ))}
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={readFile} />

      <ColorPickerFullScreen
        key={picker ?? 'closed'}
        open={picker !== null}
        allowGradient
        initialMode={picker ?? 'solid'}
        value={picker === 'gradient' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#8235DC'}
        onClose={() => setPicker(null)}
        onConfirm={(css) => {
          setPicker(null)
          onImage(makeBackgroundDataUrl(css))
        }}
      />
    </div>
  )
}
