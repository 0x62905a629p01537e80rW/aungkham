import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { toPng } from 'html-to-image'
import { EditorHeader } from './editor-header'
import { UploadZone } from './upload-zone'
import { CanvasPreview } from './canvas-preview'
import { ToolBar } from './tool-bar'
import { BackgroundEditor, type BgTool } from './background-editor'
import { SaveShare } from './save-share'
import { createTextLayer, type TextLayer } from '@/lib/text-layer'
import { loadImage } from '@/lib/image-ops'

export function Editor() {
  const [image, setImage] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [layers, setLayers] = useState<TextLayer[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [bgTool, setBgTool] = useState<BgTool | null>(null)
  const [showGrid, setShowGrid] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [savedProject, setSavedProject] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)

  async function applyBackground(dataUrl: string) {
    const img = await loadImage(dataUrl)
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
    setImage(dataUrl)
    setBgTool(null)
  }

  function onReplaceFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => applyBackground(reader.result as string)
    reader.readAsDataURL(file)
  }


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


  type Snapshot = { image: string | null; layers: TextLayer[]; naturalSize: { w: number; h: number } | null }
  const past = useRef<Snapshot[]>([])
  const future = useRef<Snapshot[]>([])
  const skipHistory = useRef(false)
  const lastSnap = useRef<Snapshot>({ image: null, layers: [], naturalSize: null })
  const [historyTick, setHistoryTick] = useState(0)

  useEffect(() => {
    if (skipHistory.current) {
      skipHistory.current = false
      lastSnap.current = { image, layers, naturalSize }
      return
    }
    const prev = lastSnap.current
    if (prev.image === image && prev.layers === layers && prev.naturalSize === naturalSize) return
    past.current = [...past.current, prev].slice(-50)
    future.current = []
    lastSnap.current = { image, layers, naturalSize }
    setHistoryTick((t) => t + 1)
  }, [image, layers, naturalSize])

  function applySnapshot(snap: Snapshot) {
    skipHistory.current = true
    setImage(snap.image)
    setLayers(snap.layers)
    setNaturalSize(snap.naturalSize)
    setSelectedId((id) => (snap.layers.some((l) => l.id === id) ? id : null))
    setHistoryTick((t) => t + 1)
  }

  function undo() {
    const prev = past.current.pop()
    if (!prev) return
    future.current = [{ image, layers, naturalSize }, ...future.current]
    applySnapshot(prev)
  }

  function redo() {
    const next = future.current.shift()
    if (!next) return
    past.current = [...past.current, { image, layers, naturalSize }]
    applySnapshot(next)
  }

  const renderPreview = useCallback(async () => {
    const node = canvasRef.current
    if (!node || !naturalSize) return null
    setExporting(true)
    setSelectedId(null)
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    try {
      const rect = node.getBoundingClientRect()
      const pixelRatio = Math.min(4, Math.max(1, naturalSize.w / Math.max(1, rect.width)))
      return await toPng(node, { pixelRatio, cacheBust: true })
    } catch (err) {
      console.log('[export failed]', err)
      return null
    } finally {
      setExporting(false)
    }
  }, [naturalSize])

  const handleNext = useCallback(async () => {
    setSavedProject(false)
    setPreview(null)
    setShowSave(true)
    const url = await renderPreview()
    setPreview(url)
  }, [renderPreview])

  const handleSaveImage = useCallback(() => {
    if (!preview) return
    const link = document.createElement('a')
    link.download = 'text-on-photo.png'
    link.href = preview
    link.click()
  }, [preview])

  const handleShare = useCallback(async () => {
    if (!preview) return
    try {
      const blob = await (await fetch(preview)).blob()
      const file = new File([blob], 'text-on-photo.png', { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: 'Text on Photo' })
        return
      }
    } catch (err) {
      console.log('[share failed]', err)
    }
    handleSaveImage()
  }, [preview, handleSaveImage])

  void historyTick


  const handleSaveProject = useCallback(() => {
    if (!image) return
    try {
      const raw = localStorage.getItem('saved-projects')
      const list = raw ? JSON.parse(raw) : []
      list.unshift({ id: String(Date.now()), image, layers, naturalSize, savedAt: Date.now() })
      localStorage.setItem('saved-projects', JSON.stringify(list.slice(0, 20)))
      setSavedProject(true)
    } catch (err) {
      console.log('[save project failed]', err)
    }
  }, [image, layers, naturalSize])

  function toggleVisibility(id: string) {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, hidden: !l.hidden } : l)))
  }

  function moveLayer(id: string, dir: 'front' | 'back') {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === id)
      if (!target) return prev
      const rest = prev.filter((l) => l.id !== id)
      return dir === 'front' ? [...rest, target] : [target, ...rest]
    })
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <EditorHeader
        hasImage={!!image}
        onNewImage={resetAll}
        onNext={handleNext}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        canUndo={past.current.length > 0}
        canRedo={future.current.length > 0}
        onUndo={undo}
        onRedo={redo}
        layers={layers}
        selectedId={selectedId}
        onSelectLayer={setSelectedId}
        onAddLayer={addLayer}
        onDuplicateLayer={duplicateLayer}
        onDeleteLayer={deleteLayer}
        onToggleLayerVisibility={toggleVisibility}
        onMoveLayer={moveLayer}
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
                showGrid={showGrid}
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
            onReplaceImage={() => replaceRef.current?.click()}
            onImageTool={(t) => setBgTool(t)}
          />

          <input
            ref={replaceRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onReplaceFile}
          />

          {showSave && (
            <SaveShare
              preview={preview}
              size={naturalSize}
              busy={exporting || !preview}
              savedProject={savedProject}
              onBack={() => setShowSave(false)}
              onShare={handleShare}
              onSaveImage={handleSaveImage}
              onSaveProject={handleSaveProject}
            />
          )}

          {bgTool && (
            <BackgroundEditor
              tool={bgTool}
              image={image}
              onCancel={() => setBgTool(null)}
              onApply={applyBackground}
            />
          )}
        </>
      )}

    </div>
  )
}
