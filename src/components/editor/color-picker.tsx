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

const PALETTE_PRESETS: { name: string; stops: string[] }[] = [
  { name: 'Glowing Blue', stops: ['#1a0b6b', '#2635c9', '#3657ff', '#6b8bff', '#a9bbff'] },
  { name: 'Sunset', stops: ['#3a0a3a', '#7a1f5a', '#c73866', '#ff7a59', '#ffc48a'] },
  { name: 'Forest', stops: ['#0b2e1a', '#1a5a30', '#3d8a4a', '#84c07a', '#d7ecb8'] },
  { name: 'Rose Gold', stops: ['#3a1519', '#7a2b3b', '#c07178', '#e4b0a4', '#f6dcc9'] },
]

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
  const [customSwatches, setCustomSwatches] = useState<string[]>([])

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
    setCustomSwatches((prev) => (prev.includes(hex) ? prev : [hex, ...prev].slice(0, 12)))
  }

  const hueColor = `hsl(${h}, 100%, 50%)`
  const solidHex = rgbaToHex(rgb.r, rgb.g, rgb.b, 1)

  return (
    <div className="rounded-2xl bg-[#f3f2f7] p-4 text-neutral-800 shadow-[0_18px_40px_-14px_rgba(15,15,40,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium text-neutral-700">Color Picker</span>
        <div className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(0,0,0,0.04)]">
          Hex
          <svg viewBox="0 0 12 12" className="size-3 text-neutral-400"><path fill="currentColor" d="M3 4.5l3 3 3-3" /></svg>
        </div>
      </div>

      {/* Saturation/Value area */}
      <div
        ref={areaRef}
        className="relative aspect-[1.7/1] w-full cursor-crosshair touch-none overflow-hidden rounded-xl"
        style={{ background: hueColor }}
        onPointerDown={pointerDragging(areaRef, (x, y) => { setS(x); setV(1 - y) })}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }} />
        <div
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="relative mt-3 h-3 w-full cursor-pointer touch-none overflow-hidden rounded-full"
        style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
        onPointerDown={pointerDragging(hueRef, (x) => setH(x * 360))}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: `${(h / 360) * 100}%`, background: hueColor }}
        />
      </div>

      {/* Alpha slider */}
      <div
        ref={alphaRef}
        className="relative mt-2 h-3 w-full cursor-pointer touch-none overflow-hidden rounded-full"
        style={{
          backgroundImage:
            'linear-gradient(to right, transparent, ' + solidHex + '), url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22><rect width=%225%22 height=%225%22 fill=%22%23ccc%22/><rect x=%225%22 y=%225%22 width=%225%22 height=%225%22 fill=%22%23ccc%22/></svg>")',
        }}
        onPointerDown={pointerDragging(alphaRef, (x) => setA(x))}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: `${a * 100}%`, background: solidHex }}
        />
      </div>

      {/* Hex + eyedropper + add */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.04)]">
          <span className="size-4 rounded-[4px] border border-black/10" style={{ background: solidHex }} />
          <input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value.toUpperCase())}
            onBlur={(e) => submitHex(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitHex((e.target as HTMLInputElement).value) }}
            className="w-full bg-transparent font-mono text-[13px] font-medium tracking-wide text-neutral-800 outline-none"
            spellCheck={false}
          />
        </div>
        <button
          type="button"
          onClick={pickFromScreen}
          aria-label="Pick color from screen"
          className="grid size-10 place-items-center rounded-xl bg-white text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.04)] transition active:scale-95"
        >
          <Pipette className="size-4" />
        </button>
        <button
          type="button"
          onClick={addSwatch}
          aria-label="Save color"
          className="grid size-10 place-items-center rounded-xl bg-white text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.04)] transition active:scale-95"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* Custom saved swatches */}
      {customSwatches.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[12px] font-medium text-neutral-700">Saved</div>
          <div className="flex flex-wrap gap-1.5">
            {customSwatches.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => submitHex(c)}
                className="size-6 rounded-md border border-black/10 shadow-sm transition active:scale-90"
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset palettes */}
      <div className="mt-4 space-y-3">
        {PALETTE_PRESETS.map((p) => {
          const isActive = p.stops.includes(solidHex.toLowerCase())
          return (
            <div key={p.name}>
              <div className="mb-1.5 text-[13px] font-medium text-neutral-800">{p.name}</div>
              <div className="relative flex overflow-hidden rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                {p.stops.map((c, i) => {
                  const active = isActive && c.toLowerCase() === solidHex.toLowerCase()
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => submitHex(c)}
                      className="relative h-7 flex-1 transition active:scale-95"
                      style={{ background: c }}
                      aria-label={c}
                    >
                      {active && (
                        <span className="pointer-events-none absolute inset-x-1 -top-1 -bottom-1 rounded-md bg-white/90 text-[10px] font-semibold uppercase leading-[1.9rem] tracking-wider text-neutral-700 shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
                          {c.toUpperCase()}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
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
        className="w-[300px] border-0 bg-transparent p-0 shadow-none"
      >
        <ColorPickerPanel value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}
