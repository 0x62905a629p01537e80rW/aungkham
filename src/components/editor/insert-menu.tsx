import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from 'react'
import { ImageIcon, Shapes, Sticker, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GlassTabs } from '@/components/ui/glass-tabs'
import { DEFAULT_STROKE_WIDTH, SHAPES, shapeDataUrl } from '@/lib/shapes'
import { STICKERS, stickerDataUrl } from '@/lib/stickers'
import { StoreAssetsGrid } from './store-assets-grid'
import { ensureStoreAssetsLoaded } from '@/lib/store-assets'
import {
  deleteSavedShape,
  listSavedShapes,
  serverSavedShapes,
  subscribeSavedShapes,
} from '@/lib/saved-shapes'
import type { GraphicContent } from '@/lib/text-layer'

interface InsertMenuProps {
  open: boolean
  onClose: () => void
  onInsert: (graphic: GraphicContent, name: string) => void
  initialTab?: 'overlay' | 'shapes' | 'stickers'
}

type Tab = 'overlay' | 'shapes' | 'stickers'

const TABS: { key: Tab; label: string; icon: typeof ImageIcon }[] = [
  { key: 'shapes', label: 'Shapes', icon: Shapes },
  { key: 'stickers', label: 'Stickers', icon: Sticker },
  { key: 'overlay', label: 'Overlays', icon: ImageIcon },
]

export function InsertMenu({ open, onClose, onInsert, initialTab }: InsertMenuProps) {
  const [tab, setTab] = useState<Tab>(initialTab ?? 'shapes')

  useEffect(() => {
    if (open && initialTab) setTab(initialTab)
  }, [open, initialTab])
  const [source, setSource] = useState<'all' | 'downloaded'>('all')
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) void ensureStoreAssetsLoaded()
  }, [open])

  const savedShapes = useSyncExternalStore(
    subscribeSavedShapes,
    listSavedShapes,
    serverSavedShapes,
  )
  const shapes = useMemo(() => SHAPES, [])
  const stickers = useMemo(() => STICKERS, [])

  if (!open) return null

  function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      const img = new Image()
      img.onload = () => {
        onInsert(
          { kind: 'image', src, aspect: img.naturalWidth / Math.max(1, img.naturalHeight) },
          file.name.replace(/\.[^.]+$/, '') || 'Overlay',
        )
        onClose()
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/85 backdrop-blur-xl">
      <header
        className="glass-bar flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-2"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} className="size-9 rounded-full">
          <X className="size-5" />
        </Button>
        <h2 className="flex-1 text-center text-base font-semibold">Add element</h2>
        <div className="size-9" />
      </header>

      <div className="shrink-0 px-3 pt-3">
        <GlassTabs
          value={tab}
          onChange={(k) => setTab(k as Tab)}
          items={TABS.map(({ key, label, icon: Icon }) => ({
            key,
            label: (
              <>
                <Icon className="size-4" />
                {label}
              </>
            ),
          }))}
        />
      </div>

      {tab !== 'overlay' && (
        <div className="shrink-0 px-3 py-3">
          <GlassTabs
            variant="chips"
            size="sm"
            value={source}
            onChange={(g) => setSource(g as 'all' | 'downloaded')}
            items={[
              { key: 'all', label: 'All' },
              { key: 'downloaded', label: 'Downloaded' },
            ]}
          />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto perf-scroll px-3 pb-8">
        {tab !== 'overlay' && source === 'downloaded' && (
          <div className="pt-1">
            <StoreAssetsGrid
              kind={tab === 'shapes' ? 'Shapes' : 'Stickers'}
              emptyHint={`No ${tab} downloaded yet — grab some from the store.`}
              onUse={(src, asset) => {
                onInsert({ kind: 'sticker', src, aspect: 1 }, asset.name)
                onClose()
              }}
            />
          </div>
        )}
        {tab === 'overlay' && (
          <div className="mx-auto w-full max-w-sm space-y-3 pt-4">
            <p className="text-center text-xs text-muted-foreground">
              Add a PNG overlay — transparency is preserved.
            </p>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="glass-cta flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-semibold active:scale-[0.98]"
            >
              <ImageIcon className="size-5" />
              Choose from Library
            </button>
          </div>
        )}


        {tab === 'shapes' && source === 'all' && savedShapes.length > 0 && (
          <section className="pt-1">
            <h3 className="pb-2 text-sm font-semibold">My shapes</h3>
            <div className="grid grid-cols-5 gap-2">
              {savedShapes.map((s) => (
                <div key={s.id} className="relative">
                  <button
                    type="button"
                    aria-label={s.name}
                    onClick={() => {
                      onInsert(
                        {
                          kind: 'shape',
                          src: shapeDataUrl(s.path, s.color, s.outline, s.strokeWidth),
                          aspect: 1,
                          path: s.path,
                          outline: s.outline,
                          strokeWidth: s.strokeWidth,
                        },
                        s.name,
                      )
                      onClose()
                    }}
                    className="glass-tile flex aspect-square w-full items-center justify-center rounded-2xl p-2 transition active:scale-95"
                  >
                    <svg viewBox="0 0 100 100" className="size-full">
                      <path
                        d={s.path}
                        fill={s.outline ? 'none' : s.color}
                        stroke={s.outline ? s.color : 'none'}
                        strokeWidth={s.strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fillRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => deleteSavedShape(s.id)}
                    className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-background text-muted-foreground shadow active:scale-90"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'shapes' && source === 'all' && (
          <div className="grid grid-cols-5 gap-2 pt-3">
            {shapes.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-label={s.name}
                onClick={() => {
                  onInsert(
                    {
                      kind: 'shape',
                      src: shapeDataUrl(s.path, '#000000', s.outline, DEFAULT_STROKE_WIDTH),
                      aspect: 1,
                      path: s.path,
                      outline: !!s.outline,
                      strokeWidth: DEFAULT_STROKE_WIDTH,
                    },
                    s.name,
                  )
                  onClose()
                }}
                className="glass-tile flex aspect-square items-center justify-center rounded-2xl p-2 transition active:scale-95"
              >
                <svg viewBox="0 0 100 100" className="size-full">
                  <path
                    d={s.path}
                    fill={s.outline ? 'none' : 'currentColor'}
                    stroke={s.outline ? 'currentColor' : undefined}
                    strokeWidth={s.outline ? 12 : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fillRule="evenodd"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}

        {tab === 'stickers' && source === 'all' && (
          <div className="grid grid-cols-4 gap-2 pt-1">
            {stickers.map((s) => {
              const url = stickerDataUrl(s.svg)
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-label={s.name}
                  onClick={() => {
                    onInsert({ kind: 'sticker', src: url, aspect: 1 }, s.name)
                    onClose()
                  }}
                  className="glass-tile flex aspect-square items-center justify-center rounded-2xl p-2 transition active:scale-95"
                >
                  <img src={url} alt="" className="size-full object-contain" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={readFile} />
    </div>
  )
}
