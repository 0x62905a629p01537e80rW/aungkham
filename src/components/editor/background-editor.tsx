import type * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  Aperture,
  Check,
  ChevronDown,
  Crop as CropIcon,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,

  Pipette,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Square,
  X,
} from 'lucide-react'

import { useI18n } from '@/components/i18n'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SliderField } from './control-fields'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  blurImage,
  blurOutside,
  cropImage,
  flipImage,
  loadImage,
  ratioFit,
  resizeImage,
  rotateImage,
} from '@/lib/image-ops'
import { FRAMES, applyFrame, paintFrame, type FrameSpec } from '@/lib/frames'

export type BgTool = 'crop' | 'resize' | 'flip' | 'fit' | 'blur' | 'frame'

const RATIOS: { label: string; value: number | null }[] = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:3', value: 4 / 3 },
  { label: '4:5', value: 4 / 5 },
  { label: '9:16', value: 9 / 16 },
  { label: '16:9', value: 16 / 9 },
]

const FIT_RATIOS: { label: string; value: number }[] = [
  { label: 'Square', value: 1 },
  { label: '3:4', value: 3 / 4 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Portrait', value: 4 / 5 },
  { label: 'Story', value: 9 / 16 },
  { label: 'Pc', value: 16 / 10 },
]

const FIT_COLORS = [
  '#ffffff',
  '#000000',
  '#f5f5f4',
  '#e2e8f0',
  '#1e293b',
  '#3b82f6',
  '#f43f5e',
  '#facc15',
  '#10b981',
  '#a855f7',
]

const FIT_GRADIENTS: { from: string; to: string }[] = [
  { from: '#22c55e', to: '#0ea5e9' },
  { from: '#a855f7', to: '#ec4899' },
  { from: '#f97316', to: '#facc15' },
  { from: '#0f172a', to: '#334155' },
  { from: '#f43f5e', to: '#7c3aed' },
  { from: '#14b8a6', to: '#84cc16' },
]


interface Props {
  tool: BgTool
  image: string
  /** Render as the bottom control panel over the main editor instead of a full page. */
  panel?: boolean
  onCancel: () => void
  onApply: (dataUrl: string) => void
}

export function BackgroundEditor({ tool, image, panel = false, onCancel, onApply }: Props) {
  const [busy, setBusy] = useState(false)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)

  // crop
  const [ratio, setRatio] = useState<number | null>(null)
  const [rect, setRect] = useState({ x: 0.08, y: 0.08, w: 0.84, h: 0.84 })

  // resize
  const [keepAspect, setKeepAspect] = useState(true)
  const [rw, setRw] = useState(0)
  const [rh, setRh] = useState(0)

  // flip/rotate + preview source
  const [working, setWorking] = useState(image)

  // fit
  const [fitRatio, setFitRatio] = useState(1)
  const [fitScale, setFitScale] = useState(1)
  const [fitColor, setFitColor] = useState('#ffffff')
  const [fitGradient, setFitGradient] = useState<{ from: string; to: string } | null>(null)
  const [fitBlur, setFitBlur] = useState(0)
  const [fitBgOpacity, setFitBgOpacity] = useState(1)
  const [fitX, setFitX] = useState(0)
  const [fitY, setFitY] = useState(0)
  const [fitBackdrop, setFitBackdrop] = useState<string | null>(null)
  const [fitBackdropBlur, setFitBackdropBlur] = useState(10)
  const [fitShadowBlur, setFitShadowBlur] = useState(0)
  const [fitShadowOpacity, setFitShadowOpacity] = useState(0.35)
  const [fitShadowOffset, setFitShadowOffset] = useState(10)
  const [fitAdvanced, setFitAdvanced] = useState(false)
  const [fitPreview, setFitPreview] = useState<string | null>(null)
  const backdropInput = useRef<HTMLInputElement | null>(null)
  const [draggingSlider, setDraggingSlider] = useState<string | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sliderDrag = (label: string) => ({
    onDragStart: () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      setDraggingSlider(label)
    },
    onDragEnd: () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setDraggingSlider(null), 500)
    },
  })
  const dimWhenDragging = draggingSlider
    ? 'opacity-0 pointer-events-none transition-opacity duration-200'
    : ''
  const dimUnlessActive = (label: string) =>
    draggingSlider && draggingSlider !== label
      ? 'opacity-0 pointer-events-none transition-opacity duration-200'
      : ''

  // Pinch-to-zoom + drag on the Fit preview
  const gesture = useRef({
    pts: new Map<number, { x: number; y: number }>(),
    dist: 0,
    scale: 1,
    x: 0,
    y: 0,
    last: { x: 0, y: 0 },
    box: 1,
  })
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const fitGestures = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gesture.current
      e.currentTarget.setPointerCapture(e.pointerId)
      g.pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      g.box = e.currentTarget.getBoundingClientRect().width || 1
      g.scale = fitScale
      g.x = fitX
      g.y = fitY
      g.last = { x: e.clientX, y: e.clientY }
      if (g.pts.size === 2) {
        const [a, b] = [...g.pts.values()]
        g.dist = Math.hypot(a.x - b.x, a.y - b.y)
      }
      setDraggingSlider('Size')
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gesture.current
      if (!g.pts.has(e.pointerId)) return
      g.pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const rect = e.currentTarget.getBoundingClientRect()
      if (g.pts.size >= 2) {
        const [a, b] = [...g.pts.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (g.dist > 0) setFitScale(clamp((g.scale * d) / g.dist, 0.3, 3))
      } else {
        const dx = e.clientX - g.last.x
        const dy = e.clientY - g.last.y
        g.last = { x: e.clientX, y: e.clientY }
        setFitX((v) => clamp(v + (dx / (rect.width / 2)) * 100, -100, 100))
        setFitY((v) => clamp(v + (dy / (rect.height / 2)) * 100, -100, 100))
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gesture.current
      g.pts.delete(e.pointerId)
      g.dist = 0
      if (g.pts.size === 0) {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => setDraggingSlider(null), 400)
      }
    },
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => {
      gesture.current.pts.delete(e.pointerId)
    },
  }



  // frame
  const [frame, setFrame] = useState<FrameSpec>(FRAMES[0])
  const [framePreview, setFramePreview] = useState<string | null>(null)

  // blur
  const [blurMode, setBlurMode] = useState<'whole' | 'focus'>('whole')
  const [blurAmount, setBlurAmount] = useState(12)
  const [focus, setFocus] = useState({ x: 0.5, y: 0.5, r: 0.3 })

  useEffect(() => {
    loadImage(image).then((img) => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight })
      setRw(img.naturalWidth)
      setRh(img.naturalHeight)
    })
  }, [image])

  useEffect(() => {
    if (ratio == null) return
    setRect((r) => {
      const w = Math.min(0.9, r.w)
      const h = Math.min(0.9, w / ratio)
      return { ...r, w, h, x: Math.min(r.x, 1 - w), y: Math.min(r.y, 1 - h) }
    })
  }, [ratio])

  function fitOptions() {
    return {
      ratio: fitRatio,
      scale: fitScale,
      background: fitColor,
      gradient: fitGradient,
      offsetX: fitX,
      offsetY: fitY,
      blurBackground: fitBlur,
      backgroundOpacity: fitBgOpacity,
      backdropImage: fitBackdrop,
      backdropBlur: fitBackdropBlur,
      shadow:
        fitShadowBlur > 0
          ? { blur: fitShadowBlur, opacity: fitShadowOpacity, offsetY: fitShadowOffset }
          : null,
    }
  }

  // Live preview for Fit
  useEffect(() => {
    if (tool !== 'fit') return
    let alive = true
    const id = setTimeout(() => {
      ratioFit(working, fitOptions()).then((url) => alive && setFitPreview(url))
    }, 90)
    return () => {
      alive = false
      clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tool,
    working,
    fitRatio,
    fitScale,
    fitColor,
    fitGradient,
    fitX,
    fitY,
    fitBlur,
    fitBgOpacity,
    fitBackdrop,
    fitBackdropBlur,
    fitShadowBlur,
    fitShadowOpacity,
    fitShadowOffset,
  ])


  // Live preview for Frame
  useEffect(() => {
    if (tool !== 'frame') return
    let alive = true
    if (frame.kind === 'none') {
      setFramePreview(null)
      return
    }
    applyFrame(working, frame).then((url) => alive && setFramePreview(url))
    return () => {
      alive = false
    }
  }, [tool, working, frame])

  async function apply() {
    setBusy(true)
    try {
      let out = working
      if (tool === 'crop') out = await cropImage(working, rect)
      else if (tool === 'resize') out = await resizeImage(working, rw, rh)
      else if (tool === 'fit') out = await ratioFit(working, fitOptions())
      else if (tool === 'frame')
        out = frame.kind === 'none' ? working : await applyFrame(working, frame)
      else if (tool === 'blur')
        out =
          blurMode === 'whole'
            ? await blurImage(working, blurAmount)
            : await blurOutside(working, blurAmount, focus)
      onApply(out)
    } finally {
      setBusy(false)
    }
  }

  const title =
    tool === 'crop'
      ? 'Crop'
      : tool === 'resize'
        ? 'Resize'
        : tool === 'flip'
          ? 'Flip & Rotate'
          : tool === 'blur'
            ? 'Blur'
            : tool === 'frame'
              ? 'Frame'
              : 'Fit'

  if (tool === 'resize') {
    return (
      <ResizeDialog
        natural={natural}
        rw={rw}
        rh={rh}
        keepAspect={keepAspect}
        onChange={({ w, h, keepAspect: ka }: { w: number; h: number; keepAspect: boolean }) => {
          setRw(w)
          setRh(h)
          setKeepAspect(ka)
        }}
        onCancel={onCancel}
        onApply={apply}
      />
    )
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col',
        panel
          ? 'inset-x-0 bottom-0 max-h-[86dvh] rounded-t-3xl border-t border-border bg-background/95 backdrop-blur-xl'
          : 'inset-0 bg-background',
      )}
    >
      <header
        className={cn(
          'flex shrink-0 items-center justify-between px-3',
          panel ? 'h-12 border-b border-border/60' : 'h-14 border-b border-border',
        )}
        style={panel ? undefined : { paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="grid size-10 place-items-center rounded-full text-muted-foreground active:scale-95"
          aria-label="Cancel"
        >
          <X className="size-5" />
        </button>
        <p className="text-sm font-bold">{title}</p>
        <button
          type="button"
          onClick={apply}
          disabled={busy}
          className="grid size-10 place-items-center rounded-full text-primary active:scale-95 disabled:opacity-50"
          aria-label="Apply"
        >
          <Check className="size-5" />
        </button>
      </header>

      <div
        className={cn(
          'flex items-center justify-center overflow-hidden',
          panel ? 'shrink-0 p-2' : 'flex-1 bg-muted/30 p-4 pb-44',
        )}
      >
        {tool === 'crop' ? (
          <CropStage src={working} rect={rect} ratio={ratio} onChange={setRect} />
        ) : tool === 'blur' ? (
          <BlurStage
            src={working}
            amount={blurAmount}
            mode={blurMode}
            focus={focus}
            onFocus={(f) => setFocus((p) => ({ ...p, ...f }))}
          />
        ) : (
          <div
            className={cn(
              'max-h-full max-w-full overflow-hidden rounded-none',
              tool === 'fit' && fitColor === 'transparent' && !fitGradient && 'checker-grid',
              tool === 'fit' && 'touch-none select-none',
            )}
            {...(tool === 'fit' ? fitGestures : {})}
          >
            <img
              src={
                tool === 'fit'
                  ? (fitPreview ?? working)
                  : tool === 'frame'
                    ? (framePreview ?? working)
                    : working
              }
              alt="Preview"
              draggable={false}
              className={cn('max-w-full object-contain', panel ? 'max-h-[22dvh]' : 'max-h-[50dvh]')}
            />
          </div>
        )}
      </div>


      <div
        className={cn(
          'overflow-y-auto perf-scroll px-4 pb-4 pt-3 transition-all duration-200 ease-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          panel
            ? 'min-h-0 flex-1'
            : 'absolute inset-x-0 bottom-0 max-h-[62dvh] border-t',
          panel
            ? ''
            : draggingSlider
            ? 'border-transparent bg-transparent/0 backdrop-blur-none'
            : 'border-border bg-background/95 backdrop-blur-xl',
        )}
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >

        <div className="space-y-4">

        {tool === 'crop' && (
          <div className="flex gap-2 overflow-x-auto perf-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRatio(r.value)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition active:scale-95',
                  ratio === r.value
                    ? 'border-primary/40 bg-primary/15 text-primary backdrop-blur-xl [box-shadow:inset_0_1px_0_color-mix(in_oklab,white_35%,transparent),0_8px_18px_-10px_color-mix(in_oklab,var(--primary)_50%,transparent)]'
                    : 'border-border text-foreground/80',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}


        {tool === 'flip' && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: FlipHorizontal, label: 'Flip H', run: () => flipImage(working, 'h') },
              { icon: FlipVertical, label: 'Flip V', run: () => flipImage(working, 'v') },
              { icon: RotateCcw, label: '-90°', run: () => rotateImage(working, -90) },
              { icon: RotateCw, label: '+90°', run: () => rotateImage(working, 90) },
            ].map(({ icon: Icon, label, run }) => (
              <button
                key={label}
                type="button"
                onClick={async () => setWorking(await run())}
                className="flex flex-col items-center gap-1 rounded-2xl border border-border py-3 text-[11px] font-semibold active:scale-95"
              >
                <Icon className="size-5 text-primary" />
                {label}
              </button>
            ))}
          </div>
        )}

        {tool === 'frame' && (
          <div className="-mx-1 grid max-h-[26dvh] grid-cols-4 gap-2 overflow-y-auto perf-scroll px-1">
            {FRAMES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrame(f)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-none border p-1 transition active:scale-95',
                  frame.id === f.id ? 'border-primary' : 'border-foreground/70',
                )}

              >
                <FrameThumb spec={f} />
                <span className="w-full truncate text-[9px] text-muted-foreground">{f.label}</span>
              </button>
            ))}
          </div>
        )}

        {tool === 'fit' && (
          <div className="space-y-4">
            {/* 1. Shape */}
            <div className={cn('flex gap-3 overflow-x-auto perf-scroll pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', dimWhenDragging)}>
              {FIT_RATIOS.map((r) => {
                const active = Math.abs(fitRatio - r.value) < 0.001
                const w = r.value >= 1 ? 26 : 26 * r.value
                const h = r.value >= 1 ? 26 / r.value : 26
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setFitRatio(r.value)}
                    className="flex w-14 shrink-0 flex-col items-center gap-1"
                  >
                    <span className="grid size-8 place-items-center">
                      <span
                        className={cn(
                          'rounded-[3px] border-2 transition',
                          active ? 'border-primary bg-primary/25' : 'border-muted-foreground/60',
                        )}
                        style={{ width: w, height: h }}
                      />
                    </span>
                    <span
                      className={cn(
                        'truncate text-[10px]',
                        active ? 'font-bold text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {r.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 2. Size */}
            <div className={dimUnlessActive('Size')}>
              <SliderField {...sliderDrag('Size')}
                label="Size"
                value={fitScale}
                min={0.3}
                max={3}
                step={0.01}
                onChange={setFitScale}
              />
            </div>

            {/* 3. Background — one row of choices */}
            <div className={dimWhenDragging}>
              <p className="mb-2 text-[11px] font-semibold text-muted-foreground">Background</p>
              <div className="flex gap-2 overflow-x-auto perf-scroll pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setFitGradient(null)
                    setFitBackdrop(null)
                    setFitColor('#ffffff')
                    setFitBlur(28)
                  }}
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-full border-2 bg-muted transition active:scale-95',
                    fitBlur > 0 && !fitBackdrop ? 'border-primary text-primary' : 'border-border text-muted-foreground',
                  )}
                  aria-label="Blurred photo background"
                >
                  <Aperture className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFitGradient(null)
                    setFitBackdrop(null)
                    setFitBlur(0)
                    setFitColor('transparent')
                  }}
                  className={cn(
                    'checker-swatch size-10 shrink-0 rounded-full border-2 transition active:scale-95',
                    fitColor === 'transparent' && !fitGradient ? 'border-primary' : 'border-border',
                  )}
                  aria-label="Transparent background"
                />
                <button
                  type="button"
                  onClick={() => backdropInput.current?.click()}
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-full border-2 bg-muted transition active:scale-95',
                    fitBackdrop ? 'border-primary text-primary' : 'border-border text-muted-foreground',
                  )}
                  aria-label="Image background"
                >
                  <ImageIcon className="size-4" />
                </button>
                <label
                  className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-border"
                  style={{ background: fitColor === 'transparent' ? undefined : fitColor }}
                  aria-label="Pick custom color"
                >
                  <Pipette className="size-4 mix-blend-difference text-white" />
                  <input
                    type="color"
                    className="sr-only"
                    value={fitColor === 'transparent' ? '#ffffff' : fitColor}
                    onChange={(e) => {
                      setFitGradient(null)
                      setFitBackdrop(null)
                      setFitBlur(0)
                      setFitColor(e.target.value)
                    }}
                  />
                </label>
                {FIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setFitGradient(null)
                      setFitBackdrop(null)
                      setFitBlur(0)
                      setFitColor(c)
                    }}
                    aria-label={c}
                    className={cn(
                      'size-10 shrink-0 rounded-full border-2 transition active:scale-95',
                      !fitGradient && !fitBackdrop && fitBlur === 0 && fitColor === c
                        ? 'border-primary'
                        : 'border-border',
                    )}
                    style={{ background: c }}
                  />
                ))}
                {FIT_GRADIENTS.map((g) => (
                  <button
                    key={g.from + g.to}
                    type="button"
                    onClick={() => {
                      setFitBackdrop(null)
                      setFitBlur(0)
                      setFitGradient(g)
                    }}
                    aria-label="Gradient"
                    className={cn(
                      'size-10 shrink-0 rounded-full border-2 transition active:scale-95',
                      fitGradient?.from === g.from && fitGradient?.to === g.to
                        ? 'border-primary'
                        : 'border-border',
                    )}
                    style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                  />
                ))}
              </div>
              <input
                ref={backdropInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    setFitGradient(null)
                    setFitBlur(0)
                    setFitBackdrop(String(reader.result))
                  }
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}
              />
            </div>

            {/* 4. Advanced (collapsed by default) */}
            <div className="border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setFitAdvanced((v) => !v)}
                className={cn('flex w-full items-center justify-between text-xs font-semibold active:scale-[0.99]', dimWhenDragging)}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-primary" /> Adjust
                </span>
                <ChevronDown
                  className={cn('size-4 text-muted-foreground transition', fitAdvanced && 'rotate-180')}
                />
              </button>

              {fitAdvanced && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={dimUnlessActive('Move X')}>
                      <SliderField {...sliderDrag('Move X')}
                        label="Move X"
                        value={fitX}
                        min={-100}
                        max={100}
                        step={1}
                        onChange={setFitX}
                      />
                    </div>
                    <div className={dimUnlessActive('Move Y')}>
                      <SliderField {...sliderDrag('Move Y')}
                        label="Move Y"
                        value={fitY}
                        min={-100}
                        max={100}
                        step={1}
                        onChange={setFitY}
                      />
                    </div>
                  </div>
                  {(fitBlur > 0 || fitBackdrop) && (
                    <div className={dimUnlessActive('Background blur')}>
                      <SliderField {...sliderDrag('Background blur')}
                        label="Background blur"
                        value={fitBackdrop ? fitBackdropBlur : fitBlur}
                        min={0}
                        max={60}
                        step={1}
                        onChange={fitBackdrop ? setFitBackdropBlur : setFitBlur}
                      />
                    </div>
                  )}
                  <div className={dimUnlessActive('Background opacity')}>
                    <SliderField {...sliderDrag('Background opacity')}
                      label="Background opacity"
                      value={fitBgOpacity}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={setFitBgOpacity}
                    />
                  </div>
                  <div className={dimUnlessActive('Shadow')}>
                    <SliderField {...sliderDrag('Shadow')}
                      label="Shadow"
                      value={fitShadowBlur}
                      min={0}
                      max={100}
                      step={1}
                      onChange={setFitShadowBlur}
                    />
                  </div>
                  {fitShadowBlur > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className={dimUnlessActive('Shadow opacity')}>
                        <SliderField {...sliderDrag('Shadow opacity')}
                          label="Shadow opacity"
                          value={fitShadowOpacity}
                          min={0}
                          max={1}
                          step={0.01}
                          onChange={setFitShadowOpacity}
                        />
                      </div>
                      <div className={dimUnlessActive('Shadow offset')}>
                        <SliderField {...sliderDrag('Shadow offset')}
                          label="Shadow offset"
                          value={fitShadowOffset}
                          min={-100}
                          max={100}
                          step={1}
                          onChange={setFitShadowOffset}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}



        {tool === 'blur' && (
          <div className="space-y-4">
            <div className={cn('flex gap-2', dimWhenDragging)}>
              {(['whole', 'focus'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBlurMode(m)}
                  className={cn(
                    'flex-1 rounded-full border px-4 py-2 text-xs font-semibold transition active:scale-95',
                    blurMode === m
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-foreground/80',
                  )}
                >
                  {m === 'whole' ? 'Whole image' : 'Focus point'}
                </button>
              ))}
            </div>
            <div className={dimUnlessActive('Blur amount')}>
              <SliderField {...sliderDrag('Blur amount')}
                label="Blur amount"
                value={blurAmount}
                min={1}
                max={40}
                step={1}
                onChange={setBlurAmount}
              />
            </div>
            {blurMode === 'focus' && (
              <div className={dimUnlessActive('Focus size')}>
                <SliderField {...sliderDrag('Focus size')}
                  label="Focus size"
                  value={focus.r}
                  min={0.1}
                  max={0.8}
                  step={0.01}
                  onChange={(v) => setFocus((p) => ({ ...p, r: v }))}
                />
              </div>
            )}
          </div>
        )}
        </div>
      </div>

    </div>
  )
}

type CropHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'

function CropStage({
  src,
  rect,
  ratio,
  onChange,
}: {
  src: string
  rect: { x: number; y: number; w: number; h: number }
  ratio: number | null
  onChange: (r: { x: number; y: number; w: number; h: number }) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const rectRef = useRef(rect)
  rectRef.current = rect
  const MIN = 0.06

  /** Box aspect (w/h in px) so ratio locking works in real pixels. */
  const boxAspect = () => {
    const b = wrapRef.current?.getBoundingClientRect()
    return b && b.height ? b.width / b.height : 1
  }

  // Re-fit the crop box whenever a fixed ratio is picked.
  useEffect(() => {
    if (!ratio) return
    const a = boxAspect()
    let w = 0.9
    let h = (w * a) / ratio
    if (h > 0.9) {
      h = 0.9
      w = (h * ratio) / a
    }
    onChange({ x: (1 - w) / 2, y: (1 - h) / 2, w, h })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio, src])

  function startDrag(mode: 'move' | CropHandle) {
    return (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const box = wrapRef.current?.getBoundingClientRect()
      if (!box) return
      const sx = e.clientX
      const sy = e.clientY
      const start = rectRef.current
      const a = boxAspect()

      const move = (ev: PointerEvent) => {
        const dx = (ev.clientX - sx) / box.width
        const dy = (ev.clientY - sy) / box.height

        if (mode === 'move') {
          onChange({
            ...start,
            x: Math.min(Math.max(0, start.x + dx), 1 - start.w),
            y: Math.min(Math.max(0, start.y + dy), 1 - start.h),
          })
          return
        }

        let { x, y, w, h } = start
        const right = start.x + start.w
        const bottom = start.y + start.h

        if (mode.includes('w')) {
          x = Math.min(Math.max(0, start.x + dx), right - MIN)
          w = right - x
        }
        if (mode.includes('e')) {
          w = Math.min(Math.max(MIN, start.w + dx), 1 - start.x)
        }
        if (mode.includes('n')) {
          y = Math.min(Math.max(0, start.y + dy), bottom - MIN)
          h = bottom - y
        }
        if (mode.includes('s')) {
          h = Math.min(Math.max(MIN, start.h + dy), 1 - start.y)
        }

        if (ratio) {
          // Keep the locked aspect, driven by whichever axis moved most.
          const horizontal = mode === 'w' || mode === 'e' || Math.abs(dx) >= Math.abs(dy)
          if (horizontal) {
            h = (w * a) / ratio
            if (mode.includes('n')) y = bottom - h
            if (y + h > 1) {
              h = 1 - y
              w = (h * ratio) / a
              if (mode.includes('w')) x = right - w
            }
          } else {
            w = (h * ratio) / a
            if (mode.includes('w')) x = right - w
            if (x + w > 1) {
              w = 1 - x
              h = (w * a) / ratio
              if (mode.includes('n')) y = bottom - h
            }
          }
        }

        x = Math.max(0, Math.min(x, 1 - MIN))
        y = Math.max(0, Math.min(y, 1 - MIN))
        w = Math.max(MIN, Math.min(w, 1 - x))
        h = Math.max(MIN, Math.min(h, 1 - y))
        onChange({ x, y, w, h })
      }

      const end = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', end)
        window.removeEventListener('pointercancel', end)
      }
      window.addEventListener('pointermove', move, { passive: false })
      window.addEventListener('pointerup', end)
      window.addEventListener('pointercancel', end)
    }
  }

  const handle =
    'absolute size-7 rounded-full border-2 border-white bg-primary shadow-md touch-none'
  const edge = 'absolute rounded-full border-2 border-white/90 bg-primary/80 touch-none'

  return (
    <div ref={wrapRef} className="relative max-h-full max-w-full touch-none select-none">
      <img
        ref={imgRef}
        src={src}
        alt="Crop preview"
        className="max-h-[50dvh] max-w-full select-none"
        draggable={false}
      />
      <div
        className="absolute touch-none border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
        style={{
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.w * 100}%`,
          height: `${rect.h * 100}%`,
        }}
        onPointerDown={startDrag('move')}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/30" />
          ))}
        </div>

        {/* corners */}
        <div className={cn(handle, '-left-3.5 -top-3.5')} onPointerDown={startDrag('nw')} />
        <div className={cn(handle, '-right-3.5 -top-3.5')} onPointerDown={startDrag('ne')} />
        <div className={cn(handle, '-bottom-3.5 -left-3.5')} onPointerDown={startDrag('sw')} />
        <div className={cn(handle, '-bottom-3.5 -right-3.5')} onPointerDown={startDrag('se')} />

        {/* edges */}
        <div
          className={cn(edge, 'left-1/2 -top-2.5 h-5 w-10 -translate-x-1/2')}
          onPointerDown={startDrag('n')}
        />
        <div
          className={cn(edge, 'left-1/2 -bottom-2.5 h-5 w-10 -translate-x-1/2')}
          onPointerDown={startDrag('s')}
        />
        <div
          className={cn(edge, 'top-1/2 -left-2.5 h-10 w-5 -translate-y-1/2')}
          onPointerDown={startDrag('w')}
        />
        <div
          className={cn(edge, 'top-1/2 -right-2.5 h-10 w-5 -translate-y-1/2')}
          onPointerDown={startDrag('e')}
        />
      </div>
    </div>
  )
}


function BlurStage({
  src,
  amount,
  mode,
  focus,
  onFocus,
  compact,
}: {
  src: string
  amount: number
  mode: 'whole' | 'focus'
  focus: { x: number; y: number; r: number }
  onFocus: (f: { x: number; y: number }) => void
  compact?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  function move(e: React.PointerEvent) {
    if (mode !== 'focus' || e.buttons === 0) return
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    onFocus({
      x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)),
    })
  }

  return (
    <div
      ref={ref}
      className="relative max-h-full max-w-full touch-none"
      onPointerDown={move}
      onPointerMove={move}
    >
      <img
        src={src}
        alt="Blur preview"
        className={cn('max-w-full select-none', compact ? 'max-h-[22dvh]' : 'max-h-[50dvh]')}
        style={{ filter: `blur(${amount / 4}px)` }}
      />
      {mode === 'focus' && (
        <>
          <img
            src={src}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full"
            style={{
              WebkitMaskImage: `radial-gradient(circle at ${focus.x * 100}% ${focus.y * 100}%, black ${focus.r * 55}%, transparent ${focus.r * 100}%)`,
              maskImage: `radial-gradient(circle at ${focus.x * 100}% ${focus.y * 100}%, black ${focus.r * 55}%, transparent ${focus.r * 100}%)`,
            }}
          />
          <div
            className="pointer-events-none absolute rounded-full border-2 border-white/80"
            style={{
              left: `${focus.x * 100}%`,
              top: `${focus.y * 100}%`,
              width: `${focus.r * 160}%`,
              height: `${focus.r * 160}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </>
      )}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium text-white">
        {mode === 'focus' ? 'Drag to move focus' : `Blur ${amount}px`}
        <Aperture className="ml-1 inline size-3" />
      </div>
    </div>
  )
}

function FrameThumb({ spec }: { spec: FrameSpec }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const size = 96
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, size, size)

    const paintPhoto = (x: number, y: number, w: number, h: number) => {
      const g = ctx.createLinearGradient(x, y, x + w, y + h)
      g.addColorStop(0, '#94a3b8')
      g.addColorStop(1, '#475569')
      ctx.fillStyle = g
      ctx.fillRect(x, y, w, h)
    }

    if (spec.kind === 'matte' || spec.kind === 'polaroid') {
      const pad = (spec.pad ?? 0.06) * size
      const padBottom = (spec.padBottom ?? spec.pad ?? 0.06) * size
      ctx.fillStyle = spec.color
      ctx.fillRect(0, 0, size, size)
      paintPhoto(pad, pad, size - pad * 2, size - pad - padBottom)
      if (spec.accent) {
        ctx.strokeStyle = spec.accent
        ctx.lineWidth = 1
        ctx.strokeRect(pad, pad, size - pad * 2, size - pad - padBottom)
      }
    } else {
      paintPhoto(0, 0, size, size)
      paintFrame(ctx, size, size, spec)
    }
  }, [spec])

  return <canvas ref={ref} className="size-full rounded-none" style={{ aspectRatio: '1 / 1' }} />
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}
function ratioString(w: number, h: number): string {
  const g = gcd(Math.round(w), Math.round(h))
  return `${Math.round(w / g)}:${Math.round(h / g)}`
}

interface ResizeDialogProps {
  natural: { w: number; h: number } | null
  rw: number
  rh: number
  keepAspect: boolean
  onChange: (v: { w: number; h: number; keepAspect: boolean }) => void
  onCancel: () => void
  onApply: () => void
}

function ResizeDialog({ natural, rw, rh, keepAspect, onChange, onCancel, onApply }: ResizeDialogProps) {
  const { t } = useI18n()
  const ratio = natural ? ratioString(natural.w, natural.h) : '1:1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="glass-panel w-full max-w-[360px] rounded-2xl p-5 shadow-2xl">
        <h3 className="mb-4 text-center text-base font-semibold">{t('resize.title')}</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="keepAspect"
                checked={keepAspect}
                onCheckedChange={(v) => onChange({ w: rw, h: rh, keepAspect: v === true })}
              />
              <Label htmlFor="keepAspect" className="cursor-pointer text-sm font-medium">
                {t('resize.keepAspect')}
              </Label>
            </div>
            <span className="text-xs text-muted-foreground">{ratio}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t('resize.width')}</Label>
              <Input
                type="number"
                value={rw}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0
                  if (keepAspect && natural) {
                    onChange({ w: v, h: Math.round((v * natural.h) / natural.w), keepAspect })
                  } else {
                    onChange({ w: v, h: rh, keepAspect })
                  }
                }}
                className="h-10 rounded-lg text-center text-sm"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t('resize.height')}</Label>
              <Input
                type="number"
                value={rh}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0
                  if (keepAspect && natural) {
                    onChange({ w: Math.round((v * natural.w) / natural.h), h: v, keepAspect })
                  } else {
                    onChange({ w: rw, h: v, keepAspect })
                  }
                }}
                className="h-10 rounded-lg text-center text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} className="text-sm font-medium uppercase tracking-wide">
            {t('resize.cancel')}
          </Button>
          <Button onClick={onApply} className="text-sm font-medium uppercase tracking-wide">
            {t('resize.ok')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const BG_ICONS = { CropIcon, Square }
