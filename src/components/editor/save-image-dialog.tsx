import { useEffect, useMemo, useState } from 'react'
import { Crown, X } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { PaymentPage } from './payment-page'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  FORMAT_EXT,
  FORMAT_LABEL,
  dataUrlSize,
  defaultFilename,
  downloadDataUrl,
  encodeImage,
  formatBytes,
  supportsQuality,
  type ExportFormat,
} from '@/lib/export-image'

const FORMATS: ExportFormat[] = ['jpeg', 'png', 'webp']

const SCALES: { value: number; label: string; pro: boolean }[] = [
  { value: 1, label: '1x', pro: false },
  { value: 2, label: '2x HD', pro: true },
  { value: 3, label: '3x', pro: true },
  { value: 4, label: '4x Ultra', pro: true },
]

interface SaveImageDialogProps {
  open: boolean
  preview: string | null
  onClose: () => void
}

export function SaveImageDialog({ open, preview, onClose }: SaveImageDialogProps) {
  const [name, setName] = useState(defaultFilename)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState(100)
  const [size, setSize] = useState<number | null>(null)
  const { isPro } = useAuth()
  const [scale, setScale] = useState(1)
  const [pay, setPay] = useState(false)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    if (open) setName(defaultFilename())
  }, [open])

  useEffect(() => {
    if (!isPro) setScale(1)
  }, [isPro])

  // Track the source pixel size so we can show the exported resolution.
  useEffect(() => {
    if (!open || !preview) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setDims({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = preview
    return () => {
      cancelled = true
    }
  }, [open, preview])

  // Estimate output size whenever the encoding settings change.
  useEffect(() => {
    if (!open || !preview) return
    let cancelled = false
    setSize(null)
    const id = setTimeout(async () => {
      const url = await encodeImage(preview, format, quality, scale)
      if (!cancelled) setSize(dataUrlSize(url))
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [open, preview, format, quality, scale])

  const filename = useMemo(
    () => `${name || defaultFilename()}.${FORMAT_EXT[format]}`,
    [name, format],
  )

  if (!open) return null

  async function handleSave() {
    if (!preview) return
    const url = await encodeImage(preview, format, quality, isPro ? scale : 1)
    downloadDataUrl(url, filename)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-5">
      <div className="glass-panel w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl">
        <h2 className="text-center text-xl font-semibold">Save Image</h2>

        <div className="mt-5">
          <label className="text-xs text-muted-foreground" htmlFor="export-filename">
            Filename
          </label>
          <div className="flex items-center gap-2 border-b border-border">
            <input
              id="export-filename"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none"
            />
            <button
              type="button"
              aria-label="Clear filename"
              onClick={() => setName('')}
              className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs text-muted-foreground">Format</p>
          <div className="mt-2 flex items-center gap-4">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className="flex items-center gap-2 text-sm"
                aria-pressed={format === f}
              >
                <span
                  className={`grid size-5 place-items-center rounded-full border-2 ${
                    format === f ? 'border-primary' : 'border-muted-foreground/50'
                  }`}
                >
                  {format === f && <span className="size-2.5 rounded-full bg-primary" />}
                </span>
                {FORMAT_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              High quality
              {!isPro && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(120deg,#f7d774,#e0a93c_55%,#c98a2b)] px-1.5 py-[2px] text-[9px] font-bold uppercase leading-none text-[#3a2a05]">
                  <Crown className="size-2.5" strokeWidth={2.6} /> Pro
                </span>
              )}
            </p>
            {dims && (
              <p className="text-[11px] tabular-nums text-muted-foreground">
                {Math.round(dims.w * scale)} x {Math.round(dims.h * scale)}
              </p>
            )}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {SCALES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => (s.pro && !isPro ? setPay(true) : setScale(s.value))}
                className={`relative h-9 rounded-xl border text-[11px] font-semibold transition active:scale-95 ${
                  scale === s.value
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {s.label}
                {s.pro && !isPro && (
                  <Crown className="absolute -right-1 -top-1 size-3 text-[#e0a93c]" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>

        {supportsQuality(format) && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <p className="text-xs text-muted-foreground">Quality</p>
              <p className="text-sm font-medium tabular-nums">{quality}%</p>
            </div>
            <Slider
              className="mt-3"
              value={[quality]}
              min={10}
              max={100}
              step={1}
              onValueChange={([v]) => setQuality(v)}
              aria-label="Quality"
            />
          </div>
        )}

        <p className="mt-5 text-sm text-muted-foreground">
          File size: <span className="font-medium text-foreground">{size === null ? '…' : formatBytes(size)}</span>
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button className="rounded-xl px-6" onClick={handleSave} disabled={!preview}>
            Save
          </Button>
        </div>
      </div>
      <PaymentPage open={pay} onClose={() => setPay(false)} />
    </div>
  )
}
