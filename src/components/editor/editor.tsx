import { useCallback, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Layers, Palette, Sparkles, Type, Wand2 } from 'lucide-react'
import { EditorHeader } from './editor-header'
import { UploadZone } from './upload-zone'
import { CanvasPreview } from './canvas-preview'
import { ControlsPanel, type ControlCategory } from './controls-panel'
import { LayersList } from './layers-list'
import { BottomSheet } from './bottom-sheet'
import { cn } from '@/lib/utils'
import { createTextLayer, type TextLayer } from '@/lib/text-layer'

type SheetKey = ControlCategory | 'layers' | null

const TAB_ITEMS: {
  key: Exclude<SheetKey, null>
  label: string
  icon: typeof Type
  title: string
}[] = [
  { key: 'text', label: 'Text', icon: Type, title: 'Text & Font' },
  { key: 'color', label: 'Color', icon: Palette, title: 'Color & Fill' },
  { key: 'effects', label: 'Effects', icon: Sparkles, title: 'Effects' },
  { key: 'transform', label: 'Transform', icon: Wand2, title: 'Transform' },
  { key: 'layers', label: 'Layers', icon: Layers, title: 'Text Layers' },
]

export function Editor() {
  const [image, setImage] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [layers, setLayers] = useState<TextLayer[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [sheet, setSheet] = useState<SheetKey>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const selected = layers.find((l) => l.id === selectedId) ?? null

  const handleImage = useCallback((dataUrl: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      setImage(dataUrl)
      const first = createTextLayer('Your text')
      setLayers([first])
      setSelectedId(first.id)
      setSheet('text')
    }
    img.src = dataUrl
  }, [])

  function updateLayer(id: string, patch: Partial<TextLayer>) {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function addLayer() {
    const layer = createTextLayer('New text')
    setLayers((prev) => [...prev, layer])
    setSelectedId(layer.id)
    setSheet('text')
  }

  function duplicateLayer(id: string) {
    const src = layers.find((l) => l.id === id)
    if (!src) return
    const copy: TextLayer = {
      ...src,
      id: createTextLayer().id,
      x: Math.min(100, src.x + 5),
      y: Math.min(100, src.y + 5),
    }
    setLayers((prev) => [...prev, copy])
    setSelectedId(copy.id)
  }

  function deleteLayer(id: string) {
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id)
      if (selectedId === id) setSelectedId(next[0]?.id ?? null)
      return next
    })
  }

  function resetAll() {
    setImage(null)
    setLayers([])
    setSelectedId(null)
    setNaturalSize(null)
    setSheet(null)
  }

  const handleDownload = useCallback(async () => {
    const node = canvasRef.current
    if (!node || !naturalSize) return
    setExporting(true)
    setSelectedId(null)
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    try {
      const rect = node.getBoundingClientRect()
      const pixelRatio = Math.min(4, Math.max(1, naturalSize.w / Math.max(1, rect.width)))
      const dataUrl = await toPng(node, { pixelRatio, cacheBust: true })
      const link = document.createElement('a')
      link.download = 'text-on-photo.png'
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.log('[export failed]', err)
    } finally {
      setExporting(false)
    }
  }, [naturalSize])

  const activeTab = sheet
  const sheetItem = TAB_ITEMS.find((t) => t.key === sheet)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <EditorHeader
        hasImage={!!image}
        exporting={exporting}
        onNewImage={resetAll}
        onDownload={handleDownload}
      />

      {!image ? (
        <UploadZone onImage={handleImage} />
      ) : (
        <>
          <main
            className="flex flex-1 items-center justify-center bg-muted/40 p-3 sm:p-6"
            style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border">
              <CanvasPreview
                ref={canvasRef}
                image={image}
                aspectRatio={naturalSize ? naturalSize.w / naturalSize.h : 16 / 9}
                layers={layers}
                selectedId={selectedId}
                exporting={exporting}
                onSelect={setSelectedId}
                onMove={(id, x, y) => updateLayer(id, { x, y })}
                onResize={(id, fontSize) => updateLayer(id, { fontSize })}
                onDelete={deleteLayer}
              />
            </div>
          </main>

          {/* Bottom item bar (native tab bar) */}
          <nav
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="mx-auto grid max-w-2xl grid-cols-5">
              {TAB_ITEMS.map(({ key, label, icon: Icon }) => {
                const active = activeTab === key
                const disabled = key !== 'layers' && !selected
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSheet(active ? null : key)}
                    className={cn(
                      'group relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10.5px] font-medium transition active:scale-95',
                      active ? 'text-primary' : 'text-muted-foreground',
                      disabled && 'opacity-40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-9 items-center justify-center rounded-2xl transition',
                        active ? 'bg-primary/12 text-primary' : 'text-foreground/70',
                      )}
                    >
                      <Icon className="size-[19px]" strokeWidth={active ? 2.4 : 2} />
                    </span>
                    {label}
                  </button>
                )
              })}
            </div>
          </nav>

          <BottomSheet
            open={sheet !== null}
            title={sheetItem?.title ?? ''}
            onClose={() => setSheet(null)}
          >
            {sheet === 'layers' ? (
              <LayersList
                layers={layers}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={addLayer}
                onDuplicate={duplicateLayer}
                onDelete={deleteLayer}
              />
            ) : sheet && selected ? (
              <ControlsPanel
                layer={selected}
                category={sheet}
                onChange={(patch) => updateLayer(selected.id, patch)}
              />
            ) : (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Select or add a text layer to start styling.
              </p>
            )}
          </BottomSheet>
        </>
      )}
    </div>
  )
}
