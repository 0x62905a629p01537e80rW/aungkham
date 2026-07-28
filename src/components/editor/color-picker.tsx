import { useEffect, useMemo, useRef, useState } from 'react'
import { Pipette, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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

// ---------- presets ----------

const QUICK_SWATCHES = [
  '#000000', '#ffffff', '#ff3b30', '#ff9500', '#ffcc00',
  '#34c759', '#00c7be', '#3657ff', '#af52de', '#ff2d55',
]

const SWATCH_STORAGE_KEY = 'color-picker:saved-swatches'

// ---------- component ----------

export function ColorPickerPanel({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const initial = hexToRgba(value)
  const initialHsv = rgbToHsv(initial.r, initial.g, initial.b)
  const [h, setH] = useState(initialHsv.h)
  const [s, setS] = useState(initialHsv.s)
  const [v, setV] = useState(initialHsv.v)
  const [a, setA] = useState(initial.a)
  const [hexInput, setHexInput] = useState(value.toUpperCase())
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

  const areaRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const alphaRef = useRef<HTMLDivElement>(null)

  const rgb = useMemo(() => hsvToRgb(h, s, v), [h, s, v])
  const hex = useMemo(() => rgbaToHex(rgb.r, rgb.g, rgb.b, a), [rgb, a])

  useEffect(() => {
    setHexInput(hex.toUpperCase())
    onChange(hex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hex])

  function pointerDragging(
    ref: React.RefObject<HTMLDivElement | null>,
    onMove: (relX: number, relY: number) => void,
  ) {
    return (e: React.PointerEvent) => {
      const el = ref.current
      if (!el) return
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
    let h = raw.replace('#', '').trim()
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(h)) return
    const { r, g, b, a: aa } = hexToRgba('#' + h)
    const nh = rgbToHsv(r, g, b)
    setH(nh.h); setS(nh.s); setV(nh.v); setA(aa)
  }

  async function pickFromScreen() {
    const w = window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }
    if (!w.EyeDropper) {
      alert('Screen color picker is not supported in this browser.')
      return
    }
    try {
      const result = await new w.EyeDropper().open()
      submitHex(result.sRGBHex)
    } catch {
      /* user cancelled */
    }
  }

  function addSwatch() {
    setCustomSwatches((prev) => {
      const next = prev.includes(hex) ? prev : [hex, ...prev].slice(0, 12)
      try {
        window.localStorage.setItem(SWATCH_STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }

  const hueColor = `hsl(${h}, 100%, 50%)`
  const solidHex = rgbaToHex(rgb.r, rgb.g, rgb.b, 1)

  return (
    <div className="rounded-xl bg-[#f3f2f7] p-3 text-neutral-800 shadow-[0_14px_32px_-14px_rgba(15,15,40,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]">
      {/* Saturation/Value area */}
      <div
        ref={areaRef}
        className="relative aspect-[2.6/1] w-full cursor-crosshair touch-none overflow-hidden rounded-lg"
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

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="relative mt-2.5 h-2.5 w-full cursor-pointer touch-none overflow-hidden rounded-full"
        style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
        onPointerDown={pointerDragging(hueRef, (x) => setH(x * 360))}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: `${(h / 360) * 100}%`, background: hueColor }}
        />
      </div>

      {/* Alpha slider */}
      <div
        ref={alphaRef}
        className="relative mt-2 h-2.5 w-full cursor-pointer touch-none overflow-hidden rounded-full"
        style={{
          backgroundImage:
            'linear-gradient(to right, transparent, ' + solidHex + '), url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22><rect width=%225%22 height=%225%22 fill=%22%23ccc%22/><rect x=%225%22 y=%225%22 width=%225%22 height=%225%22 fill=%22%23ccc%22/></svg>")',
        }}
        onPointerDown={pointerDragging(alphaRef, (x) => setA(x))}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: `${a * 100}%`, background: solidHex }}
        />
      </div>

      {/* Hex + eyedropper + add */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.04)]">
          <span className="size-3.5 shrink-0 rounded-[3px] border border-black/10" style={{ background: solidHex }} />
          <input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value.toUpperCase())}
            onBlur={(e) => submitHex(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitHex((e.target as HTMLInputElement).value) }}
            className="w-full min-w-0 bg-transparent font-mono text-[12px] font-medium tracking-wide text-neutral-800 outline-none"
            spellCheck={false}
          />
        </div>
        <button
          type="button"
          onClick={pickFromScreen}
          aria-label="Pick color from screen"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.04)] transition active:scale-95"
        >
          <Pipette className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={addSwatch}
          aria-label="Save color"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.04)] transition active:scale-95"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Quick swatches */}
      <div className="mt-2.5 grid grid-cols-10 gap-1">
        {QUICK_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => submitHex(c)}
            className="aspect-square rounded-[5px] border border-black/10 transition active:scale-90"
            style={{ background: c }}
            aria-label={c}
          />
        ))}
      </div>

      {/* Custom saved swatches */}
      {customSwatches.length > 0 && (
        <div className="mt-2 grid grid-cols-10 gap-1">
          {customSwatches.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => submitHex(c)}
              className="aspect-square rounded-[5px] border border-black/10 transition active:scale-90"
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ColorPickerPopover({
  value,
  onChange,
  children,
  align = 'end',
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        className="w-[248px] border-0 bg-transparent p-0 shadow-none"
      >
        <ColorPickerPanel value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}
