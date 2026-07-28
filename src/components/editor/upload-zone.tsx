import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Camera,
  FolderOpen,
  ImageIcon,
  Images,
  Palette,
  ShieldCheck,
  Sparkles,
  Trash2,
  Type as TypeIcon,
} from 'lucide-react'
import { ColorPickerFullScreen } from './color-picker'
import { GradientGrid, SolidGrid } from './color-grids'
import { deleteProject, loadProjects, type SavedProject } from '@/lib/projects'

import { makeBackgroundDataUrl, makeGradientDataUrl, makeSolidDataUrl } from '@/lib/background'

type Tab = 'gallery' | 'colors' | 'projects'

export function UploadZone({
  onImage,
  onOpenProject,
}: {
  onImage: (dataUrl: string) => void
  onOpenProject?: (project: SavedProject) => void
}) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('gallery')
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
      className="relative flex flex-1 flex-col overflow-hidden px-6 pb-8 pt-10"
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

      <div className="flex flex-col items-center text-center">
        <div
          className="mb-5 grid size-16 place-items-center rounded-[1.25rem] text-primary-foreground shadow-xl"
          style={{
            background:
              'linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 60%, white))',
            boxShadow: '0 18px 40px -12px color-mix(in oklab, var(--primary) 45%, transparent)',
          }}
        >
          <span className="font-brand-mm text-2xl leading-none">မြန်</span>
        </div>

        <div className="mb-5 flex max-w-sm flex-wrap items-center justify-center gap-2">
          {[
            { icon: TypeIcon, label: 'Fonts' },
            { icon: Palette, label: 'Colors' },
            { icon: Sparkles, label: 'Effects' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-secondary-foreground"
            >
              <Icon className="size-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>

        <h1 className="text-balance text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
          Add <span className="text-primary">Text</span> to Your Photos
        </h1>
        <p className="mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
          Start from a photo, a color, or open a saved project.
        </p>
      </div>

      {/* Tabs */}
      <div className="relative mx-auto mt-6 flex w-full max-w-sm items-center gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
        {(() => {
          const tabs: { id: Tab; label: string; icon: typeof Images }[] = [
            { id: 'gallery', label: 'Gallery', icon: Images },
            { id: 'colors', label: 'Colors', icon: Palette },
            { id: 'projects', label: 'Projects', icon: FolderOpen },
          ]
          const index = tabs.findIndex((t) => t.id === tab)
          return (
            <>
              {/* Sliding indicator */}
              <span
                aria-hidden
                className="absolute left-1 top-1 bottom-1 rounded-full bg-primary shadow transition-transform duration-300 ease-out"
                style={{
                  width: `calc((100% - 0.5rem - ${(tabs.length - 1) * 0.25}rem) / ${tabs.length})`,
                  transform: `translateX(calc(${index} * (100% + 0.25rem)))`,
                }}
              />
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-200 active:scale-95 ${
                    tab === id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </>
          )
        })()}
      </div>


      {/* Tab content */}
      <div className="mx-auto mt-5 flex w-full max-w-sm flex-1 flex-col overflow-y-auto pb-4">
        {tab === 'gallery' && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg transition active:scale-[0.98]"
              style={{
                boxShadow:
                  '0 14px 30px -10px color-mix(in oklab, var(--primary) 55%, transparent)',
              }}
            >
              <ImageIcon className="size-5" />
              Choose from Library
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-card text-base font-semibold text-foreground transition active:scale-[0.98]"
            >
              <Camera className="size-5 text-primary" />
              Take a Photo
            </button>
            <p className="mt-1 inline-flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Your photo stays on this device.
            </p>
          </div>
        )}

        {tab === 'colors' && (
          <div className="flex flex-col gap-5">
            <div>
              <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Solid colors
              </span>
              <SolidGrid
                onPick={(c) => onImage(makeSolidDataUrl(c))}
                onCustom={() => setPicker('solid')}
              />
            </div>

            <div>
              <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gradients
              </span>
              <GradientGrid
                onPick={(stops) => onImage(makeGradientDataUrl(stops))}
                onCustom={() => setPicker('gradient')}
              />
            </div>
          </div>
        )}

        {tab === 'projects' &&
          (projects.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center backdrop-blur">
              <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                <FolderOpen className="size-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">No saved projects yet</p>
              <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
                Your saved projects will appear here so you can pick up where you left off.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
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
                    aria-label="Delete project"
                    onClick={() => setProjects(deleteProject(p.id))}
                    className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-background/80 text-destructive backdrop-blur"
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
          onImage(makeBackgroundDataUrl(css))
        }}
      />
    </div>
  )
}
