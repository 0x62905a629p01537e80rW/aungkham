import { useCallback, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { EditorHeader } from './editor-header'
import { UploadZone } from './upload-zone'
import { CanvasPreview } from './canvas-preview'
import { ToolBar } from './tool-bar'
import { createTextLayer, type TextLayer } from '@/lib/text-layer'

export function Editor() {
  const [image, setImage] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [layers, setLayers] = useState<TextLayer[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
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
            style={{ paddingBottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
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
                onEditText={(id, text) => updateLayer(id, { text })}
              />
            </div>
          </main>

          <ToolBar
            layers={layers}
            selected={selected}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={(patch) => selected && updateLayer(selected.id, patch)}
            onAdd={addLayer}
            onDuplicate={duplicateLayer}
            onDelete={deleteLayer}
          />
        </>
      )}
    </div>
  )
}
