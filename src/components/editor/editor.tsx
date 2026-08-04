import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { toPng } from 'html-to-image'
import { Trash2 } from 'lucide-react'

import { EditorHeader } from './editor-header'
import { UploadZone } from './upload-zone'
import { CanvasPreview } from './canvas-preview'
import { ToolBar } from './tool-bar'
import { BackgroundEditor, type BgTool } from './background-editor'
import { AdjustEditor } from './adjust-editor'
import { FilterEditor } from './filter-editor'
import { SaveShare } from './save-share'
import { HistoryPanel, type HistoryEntry } from './history-panel'
import { BatchExportDialog } from './batch-export-dialog'
import { SIZE_PRESETS, resizeBackground, resizeLayers } from '@/lib/smart-resize'
import { defaultFilename, downloadDataUrl } from '@/lib/export-image'
import { ReplaceBackground } from './replace-background'
import { BgRemover } from './bg-remover'
import { ObjectRemover } from './object-remover'
import { ExportCanvas } from './export-canvas'
import { createGraphicLayer, createTextLayer, type GraphicContent, type TextLayer } from '@/lib/text-layer'
import { InsertMenu } from './insert-menu'
import { TemplatePicker } from './template-picker'
import { ExportTemplateDialog } from './export-template-dialog'
import { makeSolidDataUrl } from '@/lib/background'
import { loadImage } from '@/lib/image-ops'
import { extractPhotoPalette } from '@/lib/image-palette'
import { saveProject, type SavedProject } from '@/lib/projects'
import { RateDialog } from './rate-dialog'
import { PremiumGate, stripPremiumFonts } from './premium-gate'
import { ProSplash } from './pro-splash'
import { shouldAskForRating } from '@/lib/rate-us'
import { AuthProvider } from '@/components/auth-provider'
import { ScreenGuard } from './screen-guard'
import { EraseBar, EraseOverlay, DEFAULT_BRUSH, type EraseBrush, type EraseControls } from './erase-overlay'
import {
  DoodleBar,
  DoodleOverlay,
  ShowToolsButton,
  DEFAULT_DOODLE,
  type DoodleBrush,
  type DoodleControls,
} from './doodle-overlay'
import { useI18n } from '@/components/i18n'
import { ensureGoogleFontsLoaded } from '@/lib/google-fonts'
import { ensureRemoteFontsLoaded } from '@/lib/remote-fonts'
import { preloadAllFontPreviews } from '@/lib/font-preload'
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
  const { t } = useI18n()
  const [image, setImage] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [layers, setLayers] = useState<TextLayer[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [doodleDiscard, setDoodleDiscard] = useState(false)
  const [bgTool, setBgTool] = useState<BgTool | null>(null)
  const [adjusting, setAdjusting] = useState(false)
  const [removingBg, setRemovingBg] = useState(false)
  const [removingObject, setRemovingObject] = useState(false)
  const [filtering, setFiltering] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [inserting, setInserting] = useState(false)
  const [insertTab, setInsertTab] = useState<'stickers' | 'shapes' | 'overlay'>('shapes')
  const [templating, setTemplating] = useState(false)
  const [exportingTpl, setExportingTpl] = useState(false)
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
  const [doodling, setDoodling] = useState(false)
  const [markMode, setMarkMode] = useState(false)
  const [doodle, setDoodle] = useState<string | undefined>(undefined)
  const [draftDoodle, setDraftDoodle] = useState<string | undefined>(undefined)
  const [pen, setPen] = useState<DoodleBrush>(DEFAULT_DOODLE)
  const [doodleHistory, setDoodleHistory] = useState({ canUndo: false, canRedo: false })
  const [panMode, setPanMode] = useState(false)
  const [toolsHidden, setToolsHidden] = useState(false)
  const doodleControls = useRef<DoodleControls | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLInputElement>(null)
  /** Current canvas zoom/pan, used to place new layers inside the visible area. */
  const viewRef = useRef({ scale: 1, cx: 50, cy: 50 })
  const stageRef = useRef<HTMLElement>(null)
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })

  // Re-register downloaded Google fonts so saved projects render offline.
  useEffect(() => {
    void ensureGoogleFontsLoaded()
    void ensureRemoteFontsLoaded()
    // Warm every typeface preview now, not when the font picker opens.
    preloadAllFontPreviews()
  }, [])

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

  // Keep the colour picker's "from photo" palette in sync with the background.
  useEffect(() => {
    void extractPhotoPalette(image)
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
      setErasing(false)
      setEraseMask(undefined)
      setDraftMask(undefined)
      setEraseBypass(false)
      setEraseHistory({ canUndo: false, canRedo: false })
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      setImage(dataUrl)
      setLayers([])
      setSelectedId(null)
    }
    img.src = dataUrl
  }, [])

  function groupIdsOf(id: string): string[] {
    const target = layers.find((l) => l.id === id)
    if (!target?.groupId) return [id]
    return layers.filter((l) => l.groupId === target.groupId).map((l) => l.id)
  }

  function updateLayer(id: string, patch: Partial<TextLayer>) {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === id)
      if (!target) return prev
      const mates = target.groupId
        ? prev.filter((l) => l.groupId === target.groupId && l.id !== id)
        : []
      if (!mates.length) return prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
      // move the whole group by the same delta
      const dx = patch.x !== undefined ? patch.x - target.x : 0
      const dy = patch.y !== undefined ? patch.y - target.y : 0
      const dRot = patch.rotation !== undefined ? patch.rotation - target.rotation : 0
      const scale = patch.fontSize !== undefined && target.fontSize ? patch.fontSize / target.fontSize : 1
      return prev.map((l) => {
        if (l.id === id) return { ...l, ...patch }
        if (l.groupId !== target.groupId) return l
        const next: TextLayer = { ...l }
        if (dx || dy) {
          next.x = l.x + dx
          next.y = l.y + dy
        }
        if (dRot) next.rotation = l.rotation + dRot
        if (scale !== 1) next.fontSize = Math.max(0.5, Math.min(120, l.fontSize * scale))
        if (patch.hidden !== undefined) next.hidden = patch.hidden
        if (patch.locked !== undefined) next.locked = patch.locked
        return next
      })
    })
  }

  function groupLayers(ids: string[]) {
    if (ids.length < 2) return
    const gid = `grp-${Date.now()}`
    setLayers((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, groupId: gid } : l)))
    setSelectedId(ids[ids.length - 1])
  }

  function ungroupLayer(id: string) {
    const target = layers.find((l) => l.id === id)
    if (!target?.groupId) return
    const gid = target.groupId
    setLayers((prev) =>
      prev.map((l) => (l.groupId === gid ? { ...l, groupId: undefined } : l)),
    )
  }

  function addLayer() {
    const layer = createTextLayer('New text')
    const v = viewRef.current
    setLayers((prev) => [
      ...prev,
      { ...layer, x: v.cx, y: v.cy, fontSize: layer.fontSize / Math.max(1, v.scale) },
    ])
    setSelectedId(layer.id)
  }

  function addGraphic(graphic: GraphicContent, name: string) {
    const layer = createGraphicLayer(graphic, name)
    const v = viewRef.current
    setLayers((prev) => [
      ...prev,
      { ...layer, x: v.cx, y: v.cy, fontSize: layer.fontSize / Math.max(1, v.scale) },
    ])
    setSelectedId(layer.id)
    if (graphic.path) setAutoOpenTool('outline')
  }

  /** Overlays skip the picker sheet and open the photo library straight away. */
  function onOverlayFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      const img = new Image()
      img.onload = () =>
        addGraphic(
          { kind: 'image', src, aspect: img.naturalWidth / Math.max(1, img.naturalHeight) },
          file.name.replace(/\.[^.]+$/, '') || 'Overlay',
        )
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function duplicateLayer(id: string) {
    const ids = groupIdsOf(id)
    const sources = layers.filter((l) => ids.includes(l.id))
    if (!sources.length) return
    const gid = sources.length > 1 ? `grp-${Date.now()}` : undefined
    const copies = sources.map((src, i) => ({
      ...src,
      id: `${createTextLayer().id}-${i}`,
      groupId: gid,
      x: Math.min(100, src.x + 5),
      y: Math.min(100, src.y + 5),
    }))
    setLayers((prev) => [...prev, ...copies])
    setSelectedId(copies[copies.length - 1].id)
  }

  function deleteLayer(id: string) {
    const ids = groupIdsOf(id)
    setLayers((prev) => {
      const next = prev.filter((l) => !ids.includes(l.id))
      if (selectedId && ids.includes(selectedId)) setSelectedId(next[0]?.id ?? null)
      return next
    })
  }


  function clearErase() {
    setErasing(false)
    setEraseMask(undefined)
    setDraftMask(undefined)
    setEraseBypass(false)
    setEraseHistory({ canUndo: false, canRedo: false })
  }

  function clearDoodle() {
    setDoodling(false)
    setDoodle(undefined)
    setDraftDoodle(undefined)
    setToolsHidden(false)
    setPanMode(false)
    setDoodleHistory({ canUndo: false, canRedo: false })
  }

  function resetAll() {
    clearErase()
    clearDoodle()
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
    if (!image) {
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

  /* ---- history timeline ---------------------------------------------- */
  const [historyOpen, setHistoryOpen] = useState(false)

  const describe = (snap: Snapshot): HistoryEntry => ({
    label: snap.image ? (snap.layers.length ? `${snap.layers.length} element${snap.layers.length === 1 ? '' : 's'}` : 'Background') : 'Empty canvas',
    detail: snap.naturalSize ? `${snap.naturalSize.w} × ${snap.naturalSize.h}` : 'no image',
  })

  const timeline = [...past.current, { image, layers, naturalSize }, ...future.current]
  const historyEntries = timeline.map(describe)
  const historyIndex = past.current.length

  function jumpTo(index: number) {
    if (index === historyIndex) return
    const target = timeline[index]
    if (!target) return
    past.current = timeline.slice(0, index)
    future.current = timeline.slice(index + 1)
    applySnapshot(target)
  }

  /* ---- smart resize + batch export ------------------------------------ */
  const [batchOpen, setBatchOpen] = useState(false)
  const [batch, setBatch] = useState<{ image: string | null; layers: TextLayer[]; size: { w: number; h: number } } | null>(null)

  const runBatchExport = useCallback(
    async (keys: string[]) => {
      const node = exportRef.current
      if (!node || !naturalSize || !image) return
      setSelectedId(null)
      setExporting(true)
      const stamp = defaultFilename()
      try {
        for (const key of keys) {
          const preset = SIZE_PRESETS.find((p) => p.key === key)
          if (!preset) continue
          const size = { w: preset.w, h: preset.h }
          const bg = await resizeBackground(image, size).catch(() => image)
          setBatch({ image: bg, layers: resizeLayers(layers, naturalSize, size), size })
          // Decode the re-fitted background and let fonts settle before capture,
          // otherwise html-to-image can snapshot a half-painted frame.
          await new Promise<void>((r) => {
            const probe = new Image()
            probe.onload = () => r()
            probe.onerror = () => r()
            probe.src = bg
          })
          await document.fonts?.ready?.catch?.(() => undefined)
          await new Promise((r) => setTimeout(r, 90))
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))))
          // First pass warms the embedded resources, second one is the keeper.
          await toPng(node, { width: size.w, height: size.h, pixelRatio: 1, cacheBust: true })
          const url = await toPng(node, { width: size.w, height: size.h, pixelRatio: 1, cacheBust: true })
          downloadDataUrl(url, `${stamp}_${preset.key}.png`)
        }

      } catch (err) {
        console.log('[batch export failed]', err)
      } finally {
        setBatch(null)
        setExporting(false)
      }
    },
    [image, layers, naturalSize],
  )

  /* ---- export cache ----------------------------------------------------- */
  // The flattened PNG is only rendered on demand (pressing Next). Rendering it
  // in the background while editing pinned the main thread and made the whole
  // editor stutter, so it is cached after an export instead.
  const prerender = useRef<{ sig: string; url: string } | null>(null)

  const exportSignature = useCallback(
    () =>
      [
        image?.length ?? 0,
        naturalSize ? `${naturalSize.w}x${naturalSize.h}` : '0',
        eraseMask?.length ?? 0,
        doodle?.length ?? 0,
        JSON.stringify(layers),
      ].join('|'),
    [image, naturalSize, eraseMask, doodle, layers],
  )

  const capture = useCallback(async () => {
    const node = exportRef.current
    if (!node || !naturalSize) return null
    return toPng(node, {
      width: naturalSize.w,
      height: naturalSize.h,
      pixelRatio: 1,
      cacheBust: true,
    })
  }, [naturalSize])



  const renderPreview = useCallback(async () => {
    if (!naturalSize) return null
    setExporting(true)
    setSelectedId(null)
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    try {
      return await capture()
    } catch (err) {
      console.log('[export failed]', err)
      return null
    } finally {
      setExporting(false)
    }
  }, [naturalSize, capture])

  const handleNext = useCallback(async () => {
    setSavedProject(false)
    setShowSave(true)
    const cached = prerender.current
    if (cached && cached.sig === exportSignature()) {
      setPreview(cached.url)
      if (shouldAskForRating()) setRating(true)
      return
    }
    setPreview(null)
    const url = await renderPreview()
    setPreview(url)
    if (url) prerender.current = { sig: exportSignature(), url }
    if (shouldAskForRating()) setRating(true)
  }, [renderPreview, exportSignature])


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
    setErasing(false)
    setEraseMask(undefined)
    setDraftMask(undefined)
    setEraseBypass(false)
    setEraseHistory({ canUndo: false, canRedo: false })
    setNaturalSize(project.naturalSize)
    setLayers(project.layers ?? [])
    setSelectedId(project.layers?.[0]?.id ?? null)
    setImage(project.image)
  }, [])

  function toggleVisibility(id: string) {
    const cur = layers.find((l) => l.id === id)
    if (cur) updateLayer(id, { hidden: !cur.hidden })
  }

  function toggleLock(id: string) {
    const cur = layers.find((l) => l.id === id)
    if (cur) updateLayer(id, { locked: !cur.locked })
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


  function applyTemplate(tpl: TextLayer[], bgSrc?: string) {
    const bg = bgSrc ?? makeSolidDataUrl('#ffffff')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      clearErase()
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      setImage(bg)
      setLayers(tpl)
      setSelectedId(tpl[tpl.length - 1]?.id ?? null)
    }
    img.src = bg
  }

  return (
    <AuthProvider>
    <div className="relative flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-background">
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
        onHistory={() => setHistoryOpen(true)}
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
        onGroupLayers={groupLayers}
        onUngroupLayer={ungroupLayer}
        onInsert={() => setInserting(true)}
        onExportTemplate={() => setExportingTpl(true)}
        onSaveProject={handleSaveProject}
      />

      <ExportTemplateDialog
        open={exportingTpl}
        onClose={() => setExportingTpl(false)}
        layers={layers}
        bg={image}
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
                onViewChange={(v) => {
                  viewRef.current = {
                    scale: v.scale,
                    cx: Math.max(5, Math.min(95, v.cx)),
                    cy: Math.max(5, Math.min(95, v.cy)),
                  }
                }}
                eraseMask={erasing ? (eraseBypass ? undefined : draftMask) : eraseMask}
                doodle={doodling ? undefined : doodle}
                overlay={
                  erasing ? (
                    <EraseOverlay
                      initialMask={eraseMask}
                      brush={brush}
                      onChange={setDraftMask}
                      controlsRef={eraseControls}
                      onHistory={setEraseHistory}
                    />
                  ) : doodling ? (
                    <DoodleOverlay
                      initial={doodle}
                      brush={pen}
                      panMode={panMode}
                      onDrawStart={() => setToolsHidden(true)}
                      onChange={setDraftDoodle}
                      controlsRef={doodleControls}
                      onHistory={setDoodleHistory}
                    />
                  ) : undefined
                }
                selectedId={erasing || doodling ? null : selectedId}
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
          ) : doodling ? (
            toolsHidden ? (
              <ShowToolsButton onShow={() => setToolsHidden(false)} />
            ) : (
            <DoodleBar
              mode={markMode ? 'mark' : 'draw'}
              brush={pen}
              onBrush={(patch) => setPen((b) => ({ ...b, ...patch }))}
              panMode={panMode}
              onPanMode={setPanMode}
              canUndo={doodleHistory.canUndo}
              canRedo={doodleHistory.canRedo}
              onUndo={() => doodleControls.current?.undo()}
              onRedo={() => doodleControls.current?.redo()}
              onClear={() => doodleControls.current?.clear()}
              onCancel={() => {
                if (draftDoodle) setDoodleDiscard(true)
                else setDoodling(false)
              }}
              onApply={() => {
                setDoodle(draftDoodle)
                setDraftDoodle(undefined)
                setDoodling(false)
              }}
            />
            )
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
            bgImage={image}
            onInsertElement={(tabId) => {
              if (tabId === 'overlay') {
                overlayRef.current?.click()
                return
              }
              setInsertTab(tabId)
              setInserting(true)
            }}
            autoOpenTool={autoOpenTool}
            onAutoOpenHandled={() => setAutoOpenTool(null)}
            onImageTool={(t) =>
              t === 'adjust'
                ? setAdjusting(true)
                : t === 'filter'
                  ? setFiltering(true)
                  : t === 'removebg'
                    ? setRemovingBg(true)
                    : t === 'remove'
                      ? setRemovingObject(true)
                      : setBgTool(t as BgTool)
            }
            onEraseAll={() => {
              setSelectedId(null)
              setDraftMask(eraseMask)
              setErasing(true)
            }}
            onDraw={() => {
              setSelectedId(null)
              setDraftDoodle(doodle)
              setToolsHidden(false)
              setPanMode(false)
              setMarkMode(false)
              setPen((b) => ({ ...b, shape: 'free' }))
              setDoodling(true)
            }}
            onMark={() => {
              setSelectedId(null)
              setDraftDoodle(doodle)
              setToolsHidden(false)
              setPanMode(false)
              setMarkMode(true)
              setPen((b) => ({ ...b, shape: b.shape === 'free' ? 'arrow' : b.shape }))
              setDoodling(true)
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

          <input
            ref={overlayRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onOverlayFile}
          />

          <TemplatePicker
            open={templating}
            hasBackground={!!image}
            onClose={() => setTemplating(false)}
            onApply={(tpl, bg) => {
              if (bg) {
                applyTemplate(tpl, bg)
              } else {
                setLayers((prev) => [...prev, ...tpl])
                setSelectedId(tpl[tpl.length - 1]?.id ?? null)
              }
            }}
          />


          <InsertMenu
            open={inserting}
            initialTab={insertTab}
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
              onBatchExport={() => setBatchOpen(true)}
            />
          )}

          <HistoryPanel
            open={historyOpen}
            entries={historyEntries}
            current={historyIndex}
            onClose={() => setHistoryOpen(false)}
            onJump={jumpTo}
          />

          <BatchExportDialog
            open={batchOpen}
            onClose={() => setBatchOpen(false)}
            onExport={runBatchExport}
          />

          <PremiumGate
            requested={nextRequested}
            layers={layers}
            onClear={() => setNextRequested(false)}
            onProceed={handleNext}
            onUndoPremiumFonts={() => setLayers((prev) => stripPremiumFonts(prev))}
          />

          <RateDialog open={rating && showSave} onClose={() => setRating(false)} />



          <ExportCanvas
            ref={exportRef}
            image={batch?.image ?? image}
            layers={batch?.layers ?? layers}
            size={batch?.size ?? naturalSize}
            eraseMask={eraseMask}
            doodle={doodle}
          />

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

          <ObjectRemover
            open={removingObject}
            src={image}
            onClose={() => setRemovingObject(false)}
            onApply={applyBackground}
          />

          {bgTool && (
            <BackgroundEditor
              tool={bgTool}
              image={image}
              panel={bgTool === 'fit' || bgTool === 'flip' || bgTool === 'blur'}
              onCancel={() => setBgTool(null)}
              onApply={applyBackground}
            />
          )}
        </>
      )}

      <AlertDialog open={doodleDiscard} onOpenChange={setDoodleDiscard}>
        <AlertDialogContent className="glass-panel max-w-[min(92vw,340px)] rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-base font-normal">
              {t('discard.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {t('discard.desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => {
                setDoodleDiscard(false)
                doodleControls.current?.clear()
                setDraftDoodle(undefined)
                setDoodle(undefined)
                setToolsHidden(false)
                setPanMode(false)
                setDoodling(false)
              }}
              className="glass-cta w-full rounded-xl border-0 font-normal hover:opacity-90"
            >
              {t('discard.confirm')}
            </AlertDialogAction>
            <AlertDialogCancel className="glass-tile mt-0 w-full rounded-full border-0 font-normal">
              {t('discard.cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent className="max-w-[min(92vw,340px)] gap-0 overflow-hidden rounded-3xl border border-border/60 bg-card p-0 shadow-2xl">
          <AlertDialogHeader className="px-6 pb-5 pt-7">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-destructive/15">
              <Trash2 className="size-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center text-[17px] font-semibold">
              {t('discard.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] leading-snug">
              {t('discard.desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-0 border-t border-border/60 sm:flex-col">
            <AlertDialogAction
              onClick={() => {
                handleSaveProject()
                setDiscardOpen(false)
                resetAll()
              }}
              className="h-12 w-full rounded-none border-0 bg-transparent text-[15px] font-semibold text-primary hover:bg-foreground/5"
            >
              Save project & exit
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false)
                resetAll()
              }}
              className="mt-0 h-12 w-full rounded-none border-0 border-t border-border/60 bg-transparent text-[15px] font-medium text-destructive hover:bg-destructive/10"
            >
              {t('discard.confirm')}
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-12 w-full rounded-none border-0 border-t border-border/60 bg-transparent text-[15px] font-normal text-muted-foreground hover:bg-foreground/5">
              {t('discard.cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
    </AuthProvider>
  )
}
