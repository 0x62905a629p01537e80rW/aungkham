import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Circle, Move3d, Pipette, Plus, Trash2, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GlassTabs } from '@/components/ui/glass-tabs'
import { getPhotoPalette, subscribePhotoPalette } from '@/lib/image-palette'
import { listRecentColors, recordRecentColor, subscribeRecents } from '@/lib/recents'

// ---------- color math ----------

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n))
}

function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length === 6) h += 'ff'
  if (h.length !== 8) return { r: 0, g: 0, b: 0, a: 1 }
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const a = parseInt(h.slice(6, 8), 16) / 255
  return { r, g, b, a }
}

function rgbaToHex(r: number, g: number, b: number, a = 1) {
  const to = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')
  const base = `#${to(r)}${to(g)}${to(b)}`
  return a >= 1 ? base : base + Math.round(clamp(a) * 255).toString(16).padStart(2, '0')
}

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s
  const hh = (h % 360) / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  let r = 0, g = 0, b = 0
  if (hh >= 0 && hh < 1) [r, g, b] = [c, x, 0]
  else if (hh < 2) [r, g, b] = [x, c, 0]
  else if (hh < 3) [r, g, b] = [0, c, x]
  else if (hh < 4) [r, g, b] = [0, x, c]
  else if (hh < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = v - c
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

// ---------- gradient helpers ----------

export type GradientStop = { id: number; color: string; pos: number }
type GradientType = 'linear' | 'radial'

let stopId = 0
const nextId = () => ++stopId

function buildGradient(type: GradientType, angle: number, stops: GradientStop[]) {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos)
  const body = sorted.map((s) => `${s.color} ${Math.round(s.pos)}%`).join(', ')
  return type === 'linear'
    ? `linear-gradient(${Math.round(angle)}deg, ${body})`
    : `radial-gradient(circle, ${body})`
}

export function parseGradient(
  value: string,
): { type: GradientType; angle: number; stops: GradientStop[] } | null {
  const m = /^(linear|radial)-gradient\((.*)\)$/is.exec(value.trim())
  if (!m) return null
  const type = m[1].toLowerCase() as GradientType
  const parts = m[2].split(/,(?![^(]*\))/).map((p) => p.trim())
  let angle = 90
  if (/deg$/i.test(parts[0])) angle = parseFloat(parts.shift()!) || 0
  else if (/^(circle|ellipse|to\s)/i.test(parts[0])) parts.shift()
  const stops: GradientStop[] = []
  parts.forEach((p, i) => {
    const sm = /^(.+?)(?:\s+([\d.]+)%)?$/.exec(p)
    if (!sm) return
    stops.push({
      id: nextId(),
      color: sm[1].trim(),
      pos: sm[2] !== undefined ? parseFloat(sm[2]) : (i / Math.max(1, parts.length - 1)) * 100,
    })
  })
  if (stops.length < 2) return null
  return { type, angle, stops }
}

// ---------- presets ----------

const QUICK_SWATCHES = [
  '#000000', '#8e8e93', '#c7c7cc', '#ffffff', '#1c2a5e',
  '#3657ff', '#7ef0ff', '#2f6f3e', '#8a8a2a', '#2c6e6e',
  '#4cf05a', '#6b1414', '#6b1e8a', '#af52de', '#ff2df0',
  '#ff3b30', '#ff9500', '#ffe93b', '#00c7be', '#34c759',
]

const QUICK_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)',
  'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)',
  'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
  'linear-gradient(135deg, #cc2b5e 0%, #753a88 100%)',
  'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
  'linear-gradient(135deg, #42275a 0%, #734b6d 100%)',
  'linear-gradient(135deg, #000428 0%, #004e92 100%)',
  'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
]

const SWATCH_STORAGE_KEY = 'color-picker:saved-swatches'

// ---------- component ----------

export function ColorPickerPanel({
  value,
  onChange,
  allowGradient = true,
  initialMode,
  onConfirm,
  confirmLabel = 'Confirm',
  className,
  collapsibleArea = false,
  defaultAreaOpen = false,
}: {
  value: string
  onChange: (v: string) => void
  allowGradient?: boolean
  initialMode?: 'solid' | 'gradient'
  onConfirm?: (v: string) => void
  confirmLabel?: string
  className?: string
  collapsibleArea?: boolean
  defaultAreaOpen?: boolean
}) {
  const [areaOpen, setAreaOpen] = useState(!collapsibleArea || defaultAreaOpen)

  const parsedGradient = useMemo(() => parseGradient(value), [])
  const initialSolid = parsedGradient ? parsedGradient.stops[0].color : value
  const init = hexToRgba(initialSolid)
  const initHsv = rgbToHsv(init.r, init.g, init.b)

  const [mode, setMode] = useState<'solid' | 'gradient'>(
    initialMode && allowGradient
      ? initialMode
      : parsedGradient && allowGradient
        ? 'gradient'
        : 'solid',
  )
  const [gradType, setGradType] = useState<GradientType>(parsedGradient?.type ?? 'linear')
  const [angle, setAngle] = useState(parsedGradient?.angle ?? 40)
  const [stops, setStops] = useState<GradientStop[]>(
    parsedGradient?.stops ?? [
      { id: nextId(), color: '#0cb7eb', pos: 0 },
      { id: nextId(), color: '#6ee7b7', pos: 100 },
    ],
  )
  const [activeStop, setActiveStop] = useState(0)

  const [h, setH] = useState(initHsv.h)
  const [s, setS] = useState(initHsv.s)
  const [v, setV] = useState(initHsv.v)
  const [a, setA] = useState(init.a)
  const [hexInput, setHexInput] = useState(initialSolid.replace('#', '').toUpperCase())
  const [customSwatches, setCustomSwatches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(SWATCH_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? (parsed as string[]) : []
    } catch {
      return []
    }
  })

  const [recents, setRecents] = useState<string[]>(() => listRecentColors())
  const [photoPalette, setPhotoPalette] = useState<string[]>(() => getPhotoPalette())

  const areaRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const alphaRef = useRef<HTMLDivElement>(null)
  const stopsRef = useRef<HTMLDivElement>(null)
  const firstRun = useRef(false)

  useEffect(() => subscribeRecents(() => setRecents(listRecentColors())), [])
  useEffect(() => subscribePhotoPalette(() => setPhotoPalette(getPhotoPalette())), [])

  // remember the last colour the user actually settled on
  const lastValueRef = useRef<string>('')
  useEffect(
    () => () => {
      if (firstRun.current && lastValueRef.current) recordRecentColor(lastValueRef.current)
    },
    [],
  )


  const pills = useMemo(() => {
    const isGrad = (c: string) => c.includes('gradient')
    const base =
      mode === 'gradient'
        ? [...recents.filter(isGrad), ...QUICK_GRADIENTS]
        : [...recents.filter((c) => !isGrad(c)), ...QUICK_SWATCHES]
    const seen = new Set<string>()
    const out: string[] = []
    for (const c of base) {
      const k = c.toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)
      out.push(c)
      if (out.length === 20) break
    }
    return out
  }, [recents, mode])


  const rgb = useMemo(() => hsvToRgb(h, s, v), [h, s, v])
  const hex = useMemo(() => rgbaToHex(rgb.r, rgb.g, rgb.b, a), [rgb, a])
  const solidHex = rgbaToHex(rgb.r, rgb.g, rgb.b, 1)
  const hueColor = `hsl(${h}, 100%, 50%)`

  // keep active gradient stop in sync with the HSV editor
  useEffect(() => {
    setHexInput(hex.replace('#', '').slice(0, 6).toUpperCase())
    if (mode === 'gradient') {
      setStops((prev) => prev.map((st, i) => (i === activeStop ? { ...st, color: hex } : st)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hex])

  const gradientCss = useMemo(
    () => buildGradient(gradType, angle, stops),
    [gradType, angle, stops],
  )

  // emit (only after the user actually interacts)
  useEffect(() => {
    if (!firstRun.current) return
    const out = mode === 'gradient' ? gradientCss : hex
    lastValueRef.current = out
    onChange(out)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, gradientCss, hex])

  function touch() {
    firstRun.current = true
  }

  function applyColorToEditor(color: string) {
    touch()
    const { r, g, b, a: aa } = hexToRgba(color)
    const nh = rgbToHsv(r, g, b)
    setH(nh.h); setS(nh.s); setV(nh.v); setA(aa)
  }


  function pointerDragging(
    ref: React.RefObject<HTMLDivElement | null>,
    onMove: (relX: number, relY: number) => void,
  ) {
    return (e: React.PointerEvent) => {
      const el = ref.current
      if (!el) return
      touch()
      el.setPointerCapture(e.pointerId)

      const rect = el.getBoundingClientRect()
      const handle = (clientX: number, clientY: number) => {
        onMove(
          clamp((clientX - rect.left) / rect.width),
          clamp((clientY - rect.top) / rect.height),
        )
      }
      handle(e.clientX, e.clientY)
      const move = (ev: PointerEvent) => handle(ev.clientX, ev.clientY)
      const up = (ev: PointerEvent) => {
        el.releasePointerCapture(ev.pointerId)
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    }
  }

  function submitHex(raw: string) {
    let hh = raw.replace('#', '').trim()
    if (hh.length === 3) hh = hh.split('').map((c) => c + c).join('')
    if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hh)) return
    applyColorToEditor('#' + hh)
  }

  function setChannel(channel: 'r' | 'g' | 'b', raw: string) {
    const n = clamp(parseInt(raw || '0', 10) || 0, 0, 255)
    const next = { r: rgb.r, g: rgb.g, b: rgb.b, [channel]: n } as Record<string, number>
    applyColorToEditor(rgbaToHex(next.r, next.g, next.b, a))
  }

  async function pickFromScreen() {
    const w = window as unknown as {
      EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> }
    }
    if (!w.EyeDropper) {
      alert('Screen color picker is not supported in this browser.')
      return
    }
    try {
      const result = await new w.EyeDropper().open()
      submitHex(result.sRGBHex)
    } catch {
      /* cancelled */
    }
  }

  function pickPreset(c: string) {
    const g = parseGradient(c)
    if (g && allowGradient) {
      setGradType(g.type)
      setAngle(g.angle)
      setStops(g.stops)
      setActiveStop(0)
      setMode('gradient')
      applyColorToEditor(g.stops[0].color)
    } else {
      setMode('solid')
      submitHex(c)
    }
    recordRecentColor(c)
  }

  function addSwatch() {
    const entry = mode === 'gradient' ? gradientCss : hex
    recordRecentColor(entry)
    setCustomSwatches((prev) => {
      const next = prev.includes(entry) ? prev : [entry, ...prev].slice(0, 20)
      try {
        window.localStorage.setItem(SWATCH_STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }


  function selectStop(i: number) {
    setActiveStop(i)
    applyColorToEditor(stops[i].color)
  }

  function addStop() {
    touch()
    const sorted = [...stops].sort((x, y) => x.pos - y.pos)
    const pos = clamp((sorted[0].pos + sorted[sorted.length - 1].pos) / 2, 0, 100) as number
    const st = { id: nextId(), color: hex, pos }
    const next = [...stops, st]
    setStops(next)
    setActiveStop(next.length - 1)
  }

  function removeStop() {
    touch()
    if (stops.length <= 2) return
    const next = stops.filter((_, i) => i !== activeStop)
    setStops(next)
    setActiveStop(0)
    applyColorToEditor(next[0].color)
  }

  const checker =
    'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22><rect width=%225%22 height=%225%22 fill=%22%23ccc%22/><rect x=%225%22 y=%225%22 width=%225%22 height=%225%22 fill=%22%23ccc%22/></svg>")'

  const preview = mode === 'gradient' ? gradientCss : solidHex
  const showFull = !collapsibleArea || areaOpen

  return (
    <div
      className={
        className ??
        'glass-panel w-full rounded-2xl p-2.5 text-foreground'
      }
    >
      {collapsibleArea && (
        <button
          type="button"
          onClick={() => setAreaOpen((o) => !o)}
          aria-expanded={areaOpen}
          className="mb-1.5 flex w-full items-center justify-between rounded-lg bg-muted px-2 py-1.5 text-[11px] font-semibold text-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="size-4 rounded-[4px] border border-black/10"
              style={{ background: preview }}
            />
            {areaOpen ? 'Hide color area' : 'Show color area'}
          </span>
          <ChevronDown className={`size-3.5 transition-transform ${areaOpen ? '' : 'rotate-180'}`} />
        </button>
      )}

      {/* Saturation/Value area */}
      {areaOpen && (
        <div
          ref={areaRef}
          className="relative aspect-[1.35/1] w-full cursor-crosshair touch-none overflow-hidden rounded-xl border border-black/10"
          style={{ background: hueColor }}
          onPointerDown={pointerDragging(areaRef, (x, y) => { setS(x); setV(1 - y) })}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }} />
          <div
            className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
            style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
          />
        </div>
      )}


      {/* Solid / Gradient + tools */}
      {showFull && (
      <div className="mt-2 flex items-center gap-1.5">
        {allowGradient ? (
          <GlassTabs
            size="sm"
            className="flex-1"
            value={mode}
            onChange={(m) => setMode(m as typeof mode)}
            items={[
              { key: 'solid', label: 'Solid' },
              { key: 'gradient', label: 'Gradient' },
            ]}
          />

        ) : (
          <div className="flex-1" />
        )}
        <button
          type="button"
          onClick={pickFromScreen}
          aria-label="Pick color from screen"
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-foreground transition active:scale-95"
        >
          <Pipette className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={addSwatch}
          aria-label="Save color"
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-foreground transition active:scale-95"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      )}

      {/* Gradient controls */}
      {showFull && allowGradient && mode === 'gradient' && (
        <>
          <div className="mt-1.5 flex items-center gap-1 rounded-lg bg-muted px-1 py-1">
            <button
              type="button"
              onClick={() => { touch(); setGradType('linear') }}
              aria-label="Linear gradient"
              className={`grid size-6 place-items-center rounded-md transition ${
                gradType === 'linear' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Move3d className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { touch(); setGradType('radial') }}
              aria-label="Radial gradient"
              className={`grid size-6 place-items-center rounded-md transition ${
                gradType === 'radial' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Circle className="size-3.5" />
            </button>

            <div className="ml-1 flex items-center gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground">∠</span>
              <input
                type="number"
                value={Math.round(angle)}
                disabled={gradType === 'radial'}
                onChange={(e) => { touch(); setAngle(clamp(parseFloat(e.target.value) || 0, 0, 360)) }}
                className="w-9 bg-transparent text-[11px] font-semibold text-foreground outline-none disabled:opacity-40"
              />
              <span className="text-[10px] text-muted-foreground">°</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Stop</span>
              <span className="text-[11px] font-semibold text-foreground">{activeStop}</span>
              <button
                type="button"
                onClick={addStop}
                aria-label="Add gradient stop"
                className="grid size-6 place-items-center rounded-md text-muted-foreground transition active:scale-90"
              >
                <Plus className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={removeStop}
                aria-label="Delete gradient stop"
                className="grid size-6 place-items-center rounded-md text-muted-foreground transition active:scale-90 disabled:opacity-30"
                disabled={stops.length <= 2}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Gradient stops bar */}
          <div
            ref={stopsRef}
            className="relative mt-2 h-3 w-full touch-none rounded-full border border-black/10"
            style={{ background: buildGradient('linear', 90, stops) }}
            onPointerDown={pointerDragging(stopsRef, (x) => {
              setStops((prev) =>
                prev.map((st, i) => (i === activeStop ? { ...st, pos: x * 100 } : st)),
              )
            })}
          >
            {stops.map((st, i) => (
              <button
                key={st.id}
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); selectStop(i) }}
                aria-label={`Gradient stop ${i}`}
                className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_0_1px_rgba(0,0,0,0.3)] ${
                  i === activeStop ? 'border-primary' : 'border-background'
                }`}
                style={{ left: `${st.pos}%`, background: st.color }}
              />
            ))}
          </div>
        </>
      )}

      {/* Hue slider */}
      {showFull && (<div
        ref={hueRef}
        className="relative mt-2 h-3 w-full cursor-pointer touch-none rounded-full border border-black/10"
        style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
        onPointerDown={pointerDragging(hueRef, (x) => setH(x * 360))}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: `${(h / 360) * 100}%`, background: hueColor }}
        />
      </div>)}

      {/* Alpha slider */}
      {showFull && (<div
        ref={alphaRef}
        className="relative mt-2 h-3 w-full cursor-pointer touch-none rounded-full border border-black/10"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${solidHex}), ${checker}` }}
        onPointerDown={pointerDragging(alphaRef, (x) => setA(x))}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: `${a * 100}%`, background: solidHex }}
        />
      </div>)}

      {/* HEX / R / G / B / A fields */}
      {showFull && (<div className="mt-2 grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-1">
        <Field
          label="HEX"
          value={hexInput}
          onChange={setHexInput}
          onCommit={submitHex}
        />
        <Field label="R" value={String(Math.round(rgb.r))} onCommit={(x) => setChannel('r', x)} />
        <Field label="G" value={String(Math.round(rgb.g))} onCommit={(x) => setChannel('g', x)} />
        <Field label="B" value={String(Math.round(rgb.b))} onCommit={(x) => setChannel('b', x)} />
        <Field
          label="A"
          value={String(Math.round(a * 100))}
          onCommit={(x) => { touch(); setA(clamp((parseFloat(x) || 0) / 100)) }}
        />
      </div>)}

      {/* Preview + recently used pills */}
      <div className="mt-2 flex items-start gap-1.5">
        <div
          className="size-[52px] shrink-0 rounded-lg border border-black/10"
          style={{ background: preview }}
        />
        <div className="grid flex-1 grid-cols-10 gap-1">
          {pills.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pickPreset(c)}
              className="aspect-square rounded-[4px] border border-black/10 transition active:scale-90"
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>


      {customSwatches.length > 0 && (
        <div className="mt-1.5 grid grid-cols-10 gap-1">
          {customSwatches.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                const g = parseGradient(c)
                if (g && allowGradient) {
                  setGradType(g.type)
                  setAngle(g.angle)
                  setStops(g.stops)
                  setActiveStop(0)
                  setMode('gradient')
                  applyColorToEditor(g.stops[0].color)
                } else {
                  setMode('solid')
                  submitHex(c)
                }
              }}
              className="aspect-square rounded-[4px] border border-black/10 transition active:scale-90"
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      )}

      {onConfirm && (
        <button
          type="button"
          onClick={() => {
            const out = mode === 'gradient' ? gradientCss : hex
            recordRecentColor(out)
            onConfirm(out)
          }}
          className="glass-cta mt-3 h-12 w-full rounded-xl text-sm font-semibold active:scale-[0.98]"
        >
          {confirmLabel}
        </button>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  onCommit: (v: string) => void
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <div className="rounded-lg border border-border bg-background px-1 py-1 text-center">
      <input
        value={onChange ? value : local}
        onChange={(e) => (onChange ? onChange(e.target.value) : setLocal(e.target.value))}
        onBlur={(e) => onCommit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit((e.target as HTMLInputElement).value)
        }}
        spellCheck={false}
        className="w-full min-w-0 bg-transparent text-center font-mono text-[11px] font-medium text-foreground outline-none"
      />
      <div className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

export function ColorPickerPopover({
  value,
  onChange,
  children,
  align = 'end',
  allowGradient = false,
  initialMode,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  allowGradient?: boolean
  initialMode?: 'solid' | 'gradient'
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        className="w-[268px] border-0 bg-transparent p-0 shadow-none"
      >
        <ColorPickerPanel
          value={value}
          onChange={onChange}
          allowGradient={allowGradient}
          initialMode={initialMode}
          collapsibleArea
        />
      </PopoverContent>
    </Popover>
  )
}

/** Full-screen color picker sheet (used on the home screen). */
export function ColorPickerFullScreen({
  open,
  value,
  allowGradient = true,
  initialMode,
  confirmLabel = 'Use this color',
  onConfirm,
  onClose,
}: {
  open: boolean
  value: string
  allowGradient?: boolean
  initialMode?: 'solid' | 'gradient'
  confirmLabel?: string
  onConfirm: (v: string) => void
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/70 backdrop-blur-sm">
      <div
        className="flex flex-1 flex-col overflow-y-auto perf-scroll bg-background"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-center justify-between px-4 pb-2">
          <span className="text-sm font-semibold text-foreground">Pick a color</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close color picker"
            className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 px-3">
          <ColorPickerPanel
            className="w-full bg-transparent text-foreground"
            value={value}
            allowGradient={allowGradient}
            initialMode={initialMode}
            onChange={() => {}}
            collapsibleArea
            defaultAreaOpen
            onConfirm={onConfirm}
            confirmLabel={confirmLabel}
          />
        </div>
      </div>
    </div>
  )
}
