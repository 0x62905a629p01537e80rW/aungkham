import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { toPng } from 'html-to-image'
import { EditorHeader } from './editor-header'
import { UploadZone } from './upload-zone'
import { CanvasPreview } from './canvas-preview'
import { ToolBar } from './tool-bar'
import { BackgroundEditor, type BgTool } from './background-editor'
import { AdjustEditor } from './adjust-editor'
import { FilterEditor } from './filter-editor'
import { SaveShare } from './save-share'
import { ReplaceBackground } from './replace-background'
import { BgRemover } from './bg-remover'
import { ExportCanvas } from './export-canvas'
import { createGraphicLayer, createTextLayer, type GraphicContent, type TextLayer } from '@/lib/text-layer'
import { InsertMenu } from './insert-menu'
import { TemplatePicker } from './template-picker'
import { makeSolidDataUrl } from '@/lib/background'
import { loadImage } from '@/lib/image-ops'
import { saveProject, type SavedProject } from '@/lib/projects'
import { RateDialog } from './rate-dialog'
import { PremiumGate, stripPremiumFonts } from './premium-gate'
import { ProSplash } from './pro-splash'
import { shouldAskForRating } from '@/lib/rate-us'
import { AuthProvider } from '@/components/auth-provider'
import { ScreenGuard } from './screen-guard'
import { EraseBar, EraseOverlay, DEFAULT_BRUSH, type EraseBrush, type EraseControls } from './erase-overlay'
import { useI18n } from '@/components/i18n'
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



export function Editor() {
  const [image, setImage] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [layers, setLayers] = useState<TextLayer[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [bgTool, setBgTool] = useState<BgTool | null>(null)
  const [adjusting, setAdjusting] = useState(false)
  const [removingBg, setRemovingBg] = useState(false)
  const [filtering, setFiltering] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [inserting, setInserting] = useState(false)
  const [templating, setTemplating] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [savedProject, setSavedProject] = useState(false)
  const [rating, setRating] = useState(false)
  const [autoOpenTool, setAutoOpenTool] = useState<'outline' | null>(null)
  const [nextRequested, setNextRequested] = useState(false)
  const [erasing, setErasing] = useState(false)
  const [eraseMask, setEraseMask] = useState<string | undefined>(undefined)
  const [draftMask, setDraftMask] = useState<string | undefined>(undefined)
  const [brush, setBrush] = useState<EraseBrush>(DEFAULT_BRUSH)
  const [eraseBypass, setEraseBypass] = useState(false)
  const [eraseHistory, setEraseHistory] = useState({ canUndo: false, canRedo: false })
  const eraseControls = useRef<EraseControls | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })

  // Fit the whole image inside the visible stage — never require scrolling.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const cs = getComputedStyle(el)
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      setStageSize({
        w: Math.max(0, el.clientWidth - padX),
        h: Math.max(0, el.clientHeight - padY),
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [image])

  const ratio = naturalSize ? naturalSize.w / naturalSize.h : 16 / 9
  const maxW = Math.min(stageSize.w, 768)
  const fitW = Math.min(maxW, stageSize.h * ratio)
  const fitStyle = stageSize.w
    ? { width: `${Math.max(1, fitW)}px`, height: `${Math.max(1, fitW / ratio)}px` }
    : { width: '100%', aspectRatio: ratio }


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

  function addGraphic(graphic: GraphicContent, name: string) {
    const layer = createGraphicLayer(graphic, name)
    setLayers((prev) => [...prev, layer])
    setSelectedId(layer.id)
    if (graphic.path) setAutoOpenTool('outline')
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
    setShowSave(false)
    past.current = []
    future.current = []
    lastSnap.current = { image: null, layers: [], naturalSize: null }
    skipHistory.current = true
    setHistoryTick((t) => t + 1)
  }

  function requestExit() {
    if (layers.length === 0) {
      resetAll()
      return
    }
    setDiscardOpen(true)
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
    const node = exportRef.current
    if (!node || !naturalSize) return null
    setExporting(true)
    setSelectedId(null)
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    try {
      return await toPng(node, {
        width: naturalSize.w,
        height: naturalSize.h,
        pixelRatio: 1,
        cacheBust: true,
      })
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
    if (shouldAskForRating()) setRating(true)
  }, [renderPreview])

  const handleSaveImage = useCallback(() => {
    if (!preview) return
    const link = document.createElement('a')
    link.download = 'text-on-photo.png'
    link.href = preview
    link.click()
  }, [preview])


  void historyTick


  const handleSaveProject = useCallback(() => {
    if (!image) return
    try {
      saveProject({
        id: String(Date.now()),
        image,
        preview,
        layers,
        naturalSize,
        savedAt: Date.now(),
      })
      setSavedProject(true)
    } catch (err) {
      console.log('[save project failed]', err)
    }
  }, [image, preview, layers, naturalSize])

  const openProject = useCallback((project: SavedProject) => {
    setNaturalSize(project.naturalSize)
    setLayers(project.layers ?? [])
    setSelectedId(project.layers?.[0]?.id ?? null)
    setImage(project.image)
  }, [])

  function toggleVisibility(id: string) {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, hidden: !l.hidden } : l)))
  }

  function toggleLock(id: string) {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)))
  }

  function reorderLayers(from: number, to: number) {
    setLayers((prev) => {
      if (from === to || from < 0 || from >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(Math.max(0, Math.min(next.length, to)), 0, moved)
      return next
    })
  }

  function moveLayer(id: string, dir: 'front' | 'back') {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === id)
      if (!target) return prev
      const rest = prev.filter((l) => l.id !== id)
      return dir === 'front' ? [...rest, target] : [target, ...rest]
    })
  }


  function applyTemplate(tpl: TextLayer[]) {
    const bg = makeSolidDataUrl('#ffffff')
    const img = new Image()
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      setImage(bg)
      setLayers(tpl)
      setSelectedId(tpl[tpl.length - 1]?.id ?? null)
    }
    img.src = bg
  }

  return (
    <AuthProvider>
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <ScreenGuard layers={layers} />
      <ProSplash />

      <EditorHeader
        hasImage={!!image}
        onNewImage={requestExit}
        onNext={() => setNextRequested(true)}
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
        onToggleLayerLock={toggleLock}
        onReorderLayers={reorderLayers}
        onMoveLayer={moveLayer}
        onInsert={() => setInserting(true)}
      />

      {!image ? (
        <>
          <UploadZone
            onImage={handleImage}
            onOpenProject={openProject}
            onStartTemplates={() => setTemplating(true)}
            onApplyTemplate={applyTemplate}
          />
          <TemplatePicker
            open={templating}
            onClose={() => setTemplating(false)}
            onApply={applyTemplate}
          />
        </>
      ) : (

        <>
          <main
            ref={stageRef}
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted p-0"
            style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
          >
            <div
              className="overflow-hidden bg-card"
              style={{
                width: stageSize.w ? `${stageSize.w}px` : '100%',
                height: stageSize.h ? `${stageSize.h}px` : '100%',
              }}
            >



              <CanvasPreview
                ref={canvasRef}
                image={image}
                aspectRatio={naturalSize ? naturalSize.w / naturalSize.h : 16 / 9}
                layers={layers}
                exporting={exporting}
                showGrid={showGrid}
                eraseMask={erasing ? (eraseBypass ? undefined : draftMask) : eraseMask}
                overlay={
                  erasing ? (
                    <EraseOverlay
                      initialMask={eraseMask}
                      brush={brush}
                      onChange={setDraftMask}
                      controlsRef={eraseControls}
                      onHistory={setEraseHistory}
                    />
                  ) : undefined
                }
                selectedId={erasing ? null : selectedId}
                onSelect={setSelectedId}
                onMove={(id, x, y) => updateLayer(id, { x, y })}
                onResize={(id, fontSize) => updateLayer(id, { fontSize })}
                onDelete={deleteLayer}
                onEditText={(id, text) => updateLayer(id, { text })}
                onChange={updateLayer}
                onDuplicate={duplicateLayer}
                onBringForward={(id) => moveLayer(id, 'front')}

              />
            </div>
          </main>


          {erasing ? (
            <EraseBar
              brush={brush}
              onBrush={(patch) => setBrush((b) => ({ ...b, ...patch }))}
              canUndo={eraseHistory.canUndo}
              canRedo={eraseHistory.canRedo}
              bypass={eraseBypass}
              onBypass={setEraseBypass}
              onUndo={() => eraseControls.current?.undo()}
              onRedo={() => eraseControls.current?.redo()}
              onReset={() => eraseControls.current?.reset()}
              onCancel={() => {
                setDraftMask(undefined)
                setErasing(false)
              }}
              onApply={() => {
                setEraseMask(draftMask)
                setDraftMask(undefined)
                setErasing(false)
              }}
            />
          ) : (
          <ToolBar
            layers={layers}
            selected={selected}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={(patch) => selected && updateLayer(selected.id, patch)}
            onAdd={addLayer}
            onDuplicate={duplicateLayer}
            onDelete={deleteLayer}
            onMoveLayer={moveLayer}
            onReplaceImage={() => setReplacing(true)}
            onOpenTemplates={() => setTemplating(true)}
            autoOpenTool={autoOpenTool}
            onAutoOpenHandled={() => setAutoOpenTool(null)}
            onImageTool={(t) =>
              t === 'adjust'
                ? setAdjusting(true)
                : t === 'filter'
                  ? setFiltering(true)
                  : t === 'removebg'
                    ? setRemovingBg(true)
                    : setBgTool(t as BgTool)
            }
            onEraseAll={() => {
              setSelectedId(null)
              setDraftMask(eraseMask)
              setErasing(true)
            }}
          />
          )}




          <input
            ref={replaceRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onReplaceFile}
          />

          <TemplatePicker

            open={templating}

            onClose={() => setTemplating(false)}

            onApply={(tpl) => {

              setLayers((prev) => [...prev, ...tpl])

              setSelectedId(tpl[tpl.length - 1]?.id ?? null)

            }}

          />


          <InsertMenu
            open={inserting}
            onClose={() => setInserting(false)}
            onInsert={addGraphic}
          />

          <ReplaceBackground
            open={replacing}
            onClose={() => setReplacing(false)}
            onPick={(url) => {
              setReplacing(false)
              applyBackground(url)
            }}
          />

          {showSave && (
            <SaveShare
              preview={preview}
              size={naturalSize}
              busy={exporting || !preview}
              savedProject={savedProject}
              onBack={() => setShowSave(false)}
              onSaveImage={handleSaveImage}
              onSaveProject={handleSaveProject}
            />
          )}

          <PremiumGate
            requested={nextRequested}
            layers={layers}
            onClear={() => setNextRequested(false)}
            onProceed={handleNext}
            onUndoPremiumFonts={() => setLayers((prev) => stripPremiumFonts(prev))}
          />

          <RateDialog open={rating && showSave} onClose={() => setRating(false)} />



          <ExportCanvas ref={exportRef} image={image} layers={layers} size={naturalSize} eraseMask={eraseMask} />

          {filtering && (
            <FilterEditor
              image={image}
              onCancel={() => setFiltering(false)}
              onApply={(url) => {
                setFiltering(false)
                applyBackground(url)
              }}
            />
          )}

          {adjusting && (
            <AdjustEditor
              image={image}
              onCancel={() => setAdjusting(false)}
              onApply={(url) => {
                setAdjusting(false)
                applyBackground(url)
              }}
            />
          )}

          <BgRemover
            open={removingBg}
            src={image}
            title="Remove background"
            onClose={() => setRemovingBg(false)}
            onApply={applyBackground}
          />

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

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent className="glass-panel max-w-[min(92vw,340px)] rounded-3xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('discard.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('discard.desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false)
                resetAll()
              }}
              className="w-full rounded-full"
            >
              {t('discard.confirm')}
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 w-full rounded-full">
              {t('discard.cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
    </AuthProvider>
  )
}
