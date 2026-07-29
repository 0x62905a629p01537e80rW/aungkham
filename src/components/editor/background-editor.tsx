import { useEffect, useRef, useState } from 'react'
import {
  Aperture,
  Check,
  Crop as CropIcon,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
  Square,
  X,
} from 'lucide-react'
import { SliderField } from './control-fields'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '3:4', value: 3 / 4 },
  { label: '2:3', value: 2 / 3 },
  { label: '9:16', value: 9 / 16 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
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

interface Props {
  tool: BgTool
  image: string
  onCancel: () => void
  onApply: (dataUrl: string) => void
}

export function BackgroundEditor({ tool, image, onCancel, onApply }: Props) {
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
  const [fitBlur, setFitBlur] = useState(0)
  const [fitBgOpacity, setFitBgOpacity] = useState(1)
  const [fitX, setFitX] = useState(0)
  const [fitY, setFitY] = useState(0)
  const [fitPanel, setFitPanel] = useState<'ratio' | 'color' | 'blur' | 'position'>('ratio')
  const [fitPreview, setFitPreview] = useState<string | null>(null)

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
      offsetX: fitX,
      offsetY: fitY,
      blurBackground: fitBlur,
      backgroundOpacity: fitBgOpacity,
    }
  }

  // Live preview for Fit
  useEffect(() => {
    if (tool !== 'fit') return
    let alive = true
    const id = setTimeout(() => {
      ratioFit(working, {
        ratio: fitRatio,
        scale: fitScale,
        background: fitColor,
        offsetX: fitX,
        offsetY: fitY,
        blurBackground: fitBlur,
        backgroundOpacity: fitBgOpacity,
      }).then((url) => alive && setFitPreview(url))
    }, 90)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [tool, working, fitRatio, fitScale, fitColor, fitX, fitY, fitBlur, fitBgOpacity])

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header
        className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
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

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-muted/30 p-4">
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
          <div className="max-h-full max-w-full overflow-hidden rounded-2xl">
            <img
              src={
                tool === 'fit'
                  ? (fitPreview ?? working)
                  : tool === 'frame'
                    ? (framePreview ?? working)
                    : working
              }
              alt="Preview"
              className="max-h-[50dvh] max-w-full object-contain"
            />
          </div>
        )}
      </div>


      <div
        className="shrink-0 space-y-4 border-t border-border bg-background px-4 py-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {tool === 'crop' && (
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRatio(r.value)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition active:scale-95',
                  ratio === r.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-foreground/80',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {tool === 'resize' && natural && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Keep aspect ratio</Label>
              <Switch checked={keepAspect} onCheckedChange={setKeepAspect} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-[11px] text-muted-foreground">Width</Label>
                <Input
                  type="number"
                  value={rw}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0
                    setRw(v)
                    if (keepAspect) setRh(Math.round((v * natural.h) / natural.w))
                  }}
                />
              </div>
              <div className="flex-1">
                <Label className="text-[11px] text-muted-foreground">Height</Label>
                <Input
                  type="number"
                  value={rh}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0
                    setRh(v)
                    if (keepAspect) setRw(Math.round((v * natural.w) / natural.h))
                  }}
                />
              </div>
            </div>
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

        {tool === 'square' && (
          <div className="space-y-4">
            <SliderField
              label="Scale"
              value={fitScale}
              min={0.3}
              max={1.5}
              step={0.01}
              onChange={setFitScale}
            />
            <div className="flex gap-2">
              {FIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFitColor(c)}
                  aria-label={c}
                  className={cn(
                    'size-9 rounded-full border-2 transition active:scale-95',
                    fitColor === c ? 'border-primary' : 'border-border',
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}

        {tool === 'blur' && (
          <div className="space-y-4">
            <div className="flex gap-2">
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
            <SliderField
              label="Blur amount"
              value={blurAmount}
              min={1}
              max={40}
              step={1}
              onChange={setBlurAmount}
            />
            {blurMode === 'focus' && (
              <SliderField
                label="Focus size"
                value={focus.r}
                min={0.1}
                max={0.8}
                step={0.01}
                onChange={(v) => setFocus((p) => ({ ...p, r: v }))}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

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
  const drag = useRef<{ mode: 'move' | 'se'; sx: number; sy: number; start: typeof rect } | null>(
    null,
  )

  function onPointerDown(mode: 'move' | 'se') {
    return (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      drag.current = { mode, sx: e.clientX, sy: e.clientY, start: rect }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    const box = wrapRef.current?.getBoundingClientRect()
    if (!d || !box) return
    const dx = (e.clientX - d.sx) / box.width
    const dy = (e.clientY - d.sy) / box.height
    if (d.mode === 'move') {
      onChange({
        ...d.start,
        x: Math.min(Math.max(0, d.start.x + dx), 1 - d.start.w),
        y: Math.min(Math.max(0, d.start.y + dy), 1 - d.start.h),
      })
    } else {
      let w = Math.min(Math.max(0.1, d.start.w + dx), 1 - d.start.x)
      let h = ratio ? w / ratio : Math.min(Math.max(0.1, d.start.h + dy), 1 - d.start.y)
      if (h > 1 - d.start.y) {
        h = 1 - d.start.y
        if (ratio) w = h * ratio
      }
      onChange({ ...d.start, w, h })
    }
  }

  return (
    <div ref={wrapRef} className="relative max-h-full max-w-full">
      <img src={src} alt="Crop preview" className="max-h-[50dvh] max-w-full select-none" />
      <div
        className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
        style={{
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.w * 100}%`,
          height: `${rect.h * 100}%`,
        }}
        onPointerDown={onPointerDown('move')}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/30" />
          ))}
        </div>
        <div
          className="absolute -bottom-3 -right-3 size-6 rounded-full border-2 border-white bg-primary"
          onPointerDown={onPointerDown('se')}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
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
}: {
  src: string
  amount: number
  mode: 'whole' | 'focus'
  focus: { x: number; y: number; r: number }
  onFocus: (f: { x: number; y: number }) => void
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
        className="max-h-[50dvh] max-w-full select-none"
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

export const BG_ICONS = { CropIcon, Square }
