import { useRef, useState, type ChangeEvent } from 'react'
import {
  Camera,
  FolderOpen,
  ImageIcon,
  Images,
  Palette,
  Pipette,
  ShieldCheck,
  Sparkles,
  Type as TypeIcon,
} from 'lucide-react'
import { ColorPickerFullScreen } from './color-picker'


type Tab = 'gallery' | 'colors' | 'projects'

const SOLID_COLORS = [
  '#ffffff',
  '#0f172a',
  '#111111',
  '#f5f5f4',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

const GRADIENTS: { name: string; css: string; stops: [string, string, string?] }[] = [
  { name: 'Peach', css: 'linear-gradient(135deg,#ffecd2,#fcb69f)', stops: ['#ffecd2', '#fcb69f'] },
  { name: 'Purple', css: 'linear-gradient(135deg,#667eea,#764ba2)', stops: ['#667eea', '#764ba2'] },
  { name: 'Fire', css: 'linear-gradient(135deg,#f83600,#fe8c00)', stops: ['#f83600', '#fe8c00'] },
  { name: 'Night', css: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)', stops: ['#0f2027', '#203a43', '#2c5364'] },
]

function makeSolidDataUrl(color: string, size = 1200) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)
  return canvas.toDataURL('image/png')
}

function makeGradientDataUrl(stops: [string, string, string?], size = 1200) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, size, size)
  const filtered = stops.filter(Boolean) as string[]
  filtered.forEach((c, i) => grad.addColorStop(i / (filtered.length - 1), c))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return canvas.toDataURL('image/png')
}

/** Renders a solid hex OR a css linear/radial gradient string to a data URL. */
function makeBackgroundDataUrl(css: string, size = 1200) {
  const m = /^(linear|radial)-gradient\((.*)\)$/is.exec(css.trim())
  if (!m) return makeSolidDataUrl(css, size)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const parts = m[2].split(/,(?![^(]*\))/).map((p) => p.trim())
  let angle = 90
  if (/deg$/i.test(parts[0])) angle = parseFloat(parts.shift()!) || 0
  else if (/^(circle|ellipse|to\s)/i.test(parts[0])) parts.shift()

  const parsed = parts.map((p, i) => {
    const sm = /^(.+?)(?:\s+([\d.]+)%)?$/.exec(p)!
    return {
      color: sm[1].trim(),
      pos: sm[2] !== undefined ? parseFloat(sm[2]) / 100 : i / Math.max(1, parts.length - 1),
    }
  })

  let grad: CanvasGradient
  if (m[1].toLowerCase() === 'radial') {
    grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 1.4)
  } else {
    const rad = ((angle - 90) * Math.PI) / 180
    const cx = size / 2
    const cy = size / 2
    const len = Math.abs(size * Math.cos(rad)) / 2 + Math.abs(size * Math.sin(rad)) / 2
    grad = ctx.createLinearGradient(
      cx - Math.cos(rad) * len,
      cy - Math.sin(rad) * len,
      cx + Math.cos(rad) * len,
      cy + Math.sin(rad) * len,
    )
  }
  parsed.forEach((st) => grad.addColorStop(Math.min(1, Math.max(0, st.pos)), st.color))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return canvas.toDataURL('image/png')
}


function CustomTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid aspect-square place-items-center rounded-xl border border-dashed border-primary/50 bg-card text-primary shadow-sm transition active:scale-95"
    >
      <Pipette className="size-4" />
    </button>
  )
}

export function UploadZone({ onImage }: { onImage: (dataUrl: string) => void }) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('gallery')
  const [picker, setPicker] = useState<'solid' | 'gradient' | null>(null)

  function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden px-6 pb-8 pt-10"
      style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
    >
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 40% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%), radial-gradient(60% 40% at 50% 100%, color-mix(in oklab, var(--accent-foreground) 12%, transparent), transparent 70%)',
        }}
      />

      <div className="flex flex-col items-center text-center">
        <div
          className="mb-5 grid size-16 place-items-center rounded-[1.25rem] text-primary-foreground shadow-xl"
          style={{
            background:
              'linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 60%, white))',
            boxShadow: '0 18px 40px -12px color-mix(in oklab, var(--primary) 45%, transparent)',
          }}
        >
          <TypeIcon className="size-8" strokeWidth={2.4} />
        </div>

        <h1 className="text-balance text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
          Add <span className="text-primary">Text</span> to Your Photos
        </h1>
        <p className="mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
          Start from a photo, a color, or open a saved project.
        </p>
      </div>

      {/* Tabs */}
      <div className="mx-auto mt-6 flex w-full max-w-sm items-center gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
        {(
          [
            { id: 'gallery', label: 'Gallery', icon: Images },
            { id: 'colors', label: 'Colors', icon: Palette },
            { id: 'projects', label: 'Projects', icon: FolderOpen },
          ] as { id: Tab; label: string; icon: typeof Images }[]
        ).map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
                active
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="mx-auto mt-5 flex w-full max-w-sm flex-1 flex-col">
        {tab === 'gallery' && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg transition active:scale-[0.98]"
              style={{
                boxShadow:
                  '0 14px 30px -10px color-mix(in oklab, var(--primary) 55%, transparent)',
              }}
            >
              <ImageIcon className="size-5" />
              Choose from Library
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-card text-base font-semibold text-foreground transition active:scale-[0.98]"
            >
              <Camera className="size-5 text-primary" />
              Take a Photo
            </button>
            <p className="mt-1 inline-flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Your photo stays on this device.
            </p>
          </div>
        )}

        {tab === 'colors' && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Solid colors
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SOLID_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use ${c}`}
                    onClick={() => onImage(makeSolidDataUrl(c))}
                    className="aspect-square rounded-xl border border-border shadow-sm transition active:scale-95"
                    style={{ background: c }}
                  />
                ))}
                <CustomTile label="Custom solid color" onClick={() => setPicker('solid')} />
              </div>
            </div>

            <div>
              <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gradients
              </span>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    aria-label={g.name}
                    onClick={() => onImage(makeGradientDataUrl(g.stops))}
                    className="aspect-square rounded-xl border border-border shadow-sm transition active:scale-95"
                    style={{ background: g.css }}
                  />
                ))}
                <CustomTile label="Custom gradient" onClick={() => setPicker('gradient')} />
              </div>
            </div>
          </div>
        )}

        {tab === 'projects' && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center backdrop-blur">
            <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <FolderOpen className="size-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">No saved projects yet</p>
            <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
              Your saved projects will appear here so you can pick up where you left off.
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto mt-5 flex max-w-sm flex-wrap items-center justify-center gap-2">
        {[
          { icon: TypeIcon, label: 'Fonts' },
          { icon: Palette, label: 'Colors' },
          { icon: Sparkles, label: 'Effects' },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-secondary-foreground"
          >
            <Icon className="size-3.5 text-primary" />
            {label}
          </span>
        ))}
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={readFile} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={readFile}
      />

      <ColorPickerFullScreen
        key={picker ?? 'closed'}
        open={picker !== null}
        allowGradient
        initialMode={picker ?? 'solid'}
        value={picker === 'gradient' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#8235DC'}
        onClose={() => setPicker(null)}
        onConfirm={(css) => {
          setPicker(null)
          onImage(makeBackgroundDataUrl(css))
        }}
      />
    </div>
  )
}
