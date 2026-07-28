import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ImageIcon, Shapes, Sticker, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SHAPES, SHAPE_GROUPS, shapeDataUrl, type ShapeGroup } from '@/lib/shapes'
import { STICKERS, STICKER_GROUPS, stickerDataUrl } from '@/lib/stickers'
import type { GraphicContent } from '@/lib/text-layer'

interface InsertMenuProps {
  open: boolean
  onClose: () => void
  onInsert: (graphic: GraphicContent, name: string) => void
}

type Tab = 'overlay' | 'shapes' | 'stickers'

const TABS: { key: Tab; label: string; icon: typeof ImageIcon }[] = [
  { key: 'shapes', label: 'Shapes', icon: Shapes },
  { key: 'stickers', label: 'Stickers', icon: Sticker },
  { key: 'overlay', label: 'Overlays', icon: ImageIcon },
]

export function InsertMenu({ open, onClose, onInsert }: InsertMenuProps) {
  const [tab, setTab] = useState<Tab>('shapes')
  const [shapeGroup, setShapeGroup] = useState<ShapeGroup>('Basic')
  const [stickerGroup, setStickerGroup] = useState<string>(STICKER_GROUPS[0])
  const galleryRef = useRef<HTMLInputElement>(null)

  const shapes = useMemo(() => SHAPES.filter((s) => s.group === shapeGroup), [shapeGroup])
  const stickers = useMemo(
    () => STICKERS.filter((s) => s.group === stickerGroup),
    [stickerGroup],
  )

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
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} className="size-9 rounded-full">
          <X className="size-5" />
        </Button>
        <h2 className="flex-1 text-center text-base font-semibold">Add element</h2>
        <div className="size-9" />
      </header>

      <div className="shrink-0 px-3 pt-3">
        <div className="glass-panel flex items-center gap-1 rounded-2xl p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition',
                tab === key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'overlay' && (
        <div className="shrink-0 overflow-x-auto px-3 py-3 [scrollbar-width:none]">
          <div className="flex w-max gap-1.5">
            {(tab === 'shapes' ? SHAPE_GROUPS : STICKER_GROUPS).map((g) => {
              const active = tab === 'shapes' ? g === shapeGroup : g === stickerGroup
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    tab === 'shapes' ? setShapeGroup(g as ShapeGroup) : setStickerGroup(g)
                  }
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'glass-tile text-muted-foreground',
                  )}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
        {tab === 'overlay' && (
          <div className="mx-auto w-full max-w-sm space-y-3 pt-4">
            <p className="text-center text-xs text-muted-foreground">
              Add a PNG overlay — transparency is preserved.
            </p>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition active:scale-[0.98]"
            >
              <ImageIcon className="size-5" />
              Choose from Library
            </button>
          </div>
        )}

        {tab === 'shapes' && (
          <div className="grid grid-cols-5 gap-2 pt-1">
            {shapes.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-label={s.name}
                onClick={() => {
                  onInsert({ kind: 'shape', src: shapeDataUrl(s.path, '#000000', s.outline), aspect: 1 }, s.name)
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

        {tab === 'stickers' && (
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
