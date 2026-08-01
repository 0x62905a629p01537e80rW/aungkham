/**
 * Procedural vector shape library (500+ shapes).
 * Every shape is a path string inside a 0 0 100 100 viewBox.
 */

import { Y2K_SHAPES } from './shapes-y2k'

export interface ShapeDef {
  id: string
  name: string
  group: ShapeGroup
  path: string
  outline?: boolean
}

export type ShapeGroup =
  | 'Basic'
  | 'Outlined'
  | 'Stars'
  | 'Bursts'
  | 'Scallop'
  | 'Flowers'
  | 'Gears'
  | 'Blobs'
  | 'Dots'
  | 'Arrows'
  | 'Badges'
  | 'Rings'
  | 'Waves'
  | 'Y2K'

export const SHAPE_GROUPS: ShapeGroup[] = [
  'Basic',
  'Outlined',
  'Y2K',
  'Stars',
  'Bursts',
  'Scallop',
  'Flowers',
  'Gears',
  'Blobs',
  'Dots',
  'Arrows',
  'Badges',
  'Rings',
  'Waves',
]

const C = 50
const n2 = (v: number) => Math.round(v * 100) / 100

function pts(list: [number, number][]) {
  return `M${list.map(([x, y]) => `${n2(x)},${n2(y)}`).join('L')}Z`
}

function polygon(sides: number, r = 48, rot = -90) {
  const out: [number, number][] = []
  for (let i = 0; i < sides; i += 1) {
    const a = ((rot + (360 / sides) * i) * Math.PI) / 180
    out.push([C + r * Math.cos(a), C + r * Math.sin(a)])
  }
  return pts(out)
}

function star(points: number, inner: number, r = 48, rot = -90) {
  const out: [number, number][] = []
  for (let i = 0; i < points * 2; i += 1) {
    const rad = i % 2 === 0 ? r : r * inner
    const a = ((rot + (360 / (points * 2)) * i) * Math.PI) / 180
    out.push([C + rad * Math.cos(a), C + rad * Math.sin(a)])
  }
  return pts(out)
}

function circlePath(cx: number, cy: number, r: number) {
  return `M${n2(cx - r)},${n2(cy)}a${n2(r)},${n2(r)} 0 1,0 ${n2(r * 2)},0a${n2(r)},${n2(r)} 0 1,0 ${n2(-r * 2)},0Z`
}

function scallop(lobes: number, depth = 0.16) {
  const R = 44
  const lr = (R * Math.PI * 2 * depth) / lobes + 2
  let d = circlePath(C, C, R - lr * 0.4)
  for (let i = 0; i < lobes; i += 1) {
    const a = ((360 / lobes) * i * Math.PI) / 180
    d += circlePath(C + (R - lr * 0.4) * Math.cos(a), C + (R - lr * 0.4) * Math.sin(a), lr)
  }
  return d
}

function flower(petals: number, len = 46, width = 0.55) {
  let d = ''
  for (let i = 0; i < petals; i += 1) {
    const a = ((360 / petals) * i - 90) * (Math.PI / 180)
    const ax = Math.cos(a)
    const ay = Math.sin(a)
    const px = C + ax * len
    const py = C + ay * len
    const w = len * width
    d += `M${C},${C}Q${n2(C + ax * len * 0.6 - ay * w)},${n2(C + ay * len * 0.6 + ax * w)} ${n2(px)},${n2(py)}Q${n2(C + ax * len * 0.6 + ay * w)},${n2(C + ay * len * 0.6 - ax * w)} ${C},${C}Z`
  }
  return d
}

function gear(teeth: number, depth = 0.18) {
  const out: [number, number][] = []
  const R = 46
  const r = R * (1 - depth)
  const step = 360 / teeth
  for (let i = 0; i < teeth; i += 1) {
    const a0 = (i * step - 90) * (Math.PI / 180)
    const a1 = ((i + 0.28) * step - 90) * (Math.PI / 180)
    const a2 = ((i + 0.5) * step - 90) * (Math.PI / 180)
    const a3 = ((i + 0.78) * step - 90) * (Math.PI / 180)
    out.push([C + r * Math.cos(a0), C + r * Math.sin(a0)])
    out.push([C + R * Math.cos(a1), C + R * Math.sin(a1)])
    out.push([C + R * Math.cos(a2), C + R * Math.sin(a2)])
    out.push([C + r * Math.cos(a3), C + r * Math.sin(a3)])
  }
  return pts(out)
}

function seeded(seed: number) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function blob(seed: number, nodes = 7) {
  const rnd = seeded(seed)
  const list: [number, number][] = []
  for (let i = 0; i < nodes; i += 1) {
    const a = ((360 / nodes) * i - 90) * (Math.PI / 180)
    const r = 30 + rnd() * 18
    list.push([C + r * Math.cos(a), C + r * Math.sin(a)])
  }
  let d = ''
  for (let i = 0; i < list.length; i += 1) {
    const cur = list[i]
    const next = list[(i + 1) % list.length]
    const mid: [number, number] = [(cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2]
    if (i === 0) d += `M${n2(mid[0])},${n2(mid[1])}`
    const after = list[(i + 1) % list.length]
    const nextMid: [number, number] = [
      (after[0] + list[(i + 2) % list.length][0]) / 2,
      (after[1] + list[(i + 2) % list.length][1]) / 2,
    ]
    d += `Q${n2(next[0])},${n2(next[1])} ${n2(nextMid[0])},${n2(nextMid[1])}`
  }
  return `${d}Z`
}

function roundRect(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  return `M${n2(x + rr)},${n2(y)}H${n2(x + w - rr)}A${n2(rr)},${n2(rr)} 0 0 1 ${n2(x + w)},${n2(y + rr)}V${n2(y + h - rr)}A${n2(rr)},${n2(rr)} 0 0 1 ${n2(x + w - rr)},${n2(y + h)}H${n2(x + rr)}A${n2(rr)},${n2(rr)} 0 0 1 ${n2(x)},${n2(y + h - rr)}V${n2(y + rr)}A${n2(rr)},${n2(rr)} 0 0 1 ${n2(x + rr)},${n2(y)}Z`
}

function dotsRing(count: number, dot: number, R: number, extra = 0) {
  let d = ''
  for (let i = 0; i < count; i += 1) {
    const a = ((360 / count) * i - 90) * (Math.PI / 180)
    d += circlePath(C + R * Math.cos(a), C + R * Math.sin(a), dot)
  }
  if (extra > 0) d += circlePath(C, C, extra)
  return d
}

function ring(outer: number, inner: number) {
  return `${circlePath(C, C, outer)}M${n2(C - inner)},${C}a${n2(inner)},${n2(inner)} 0 1,1 ${n2(inner * 2)},0a${n2(inner)},${n2(inner)} 0 1,1 ${n2(-inner * 2)},0Z`
}

function wavyCircle(waves: number, amp: number) {
  const out: [number, number][] = []
  const steps = 240
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2
    const r = 42 + Math.sin(t * waves) * amp
    out.push([C + r * Math.cos(t), C + r * Math.sin(t)])
  }
  return pts(out)
}

function arrow(dir: number, style: number) {
  const head = 26 + style * 3
  const tail = 10 + style * 2
  const base: [number, number][] = [
    [92, 50],
    [92 - head, 50 - head * 0.8],
    [92 - head, 50 - tail / 2],
    [8, 50 - tail / 2],
    [8, 50 + tail / 2],
    [92 - head, 50 + tail / 2],
    [92 - head, 50 + head * 0.8],
  ]
  const a = (dir * Math.PI) / 180
  const rot = base.map(([x, y]): [number, number] => {
    const dx = x - C
    const dy = y - C
    return [C + dx * Math.cos(a) - dy * Math.sin(a), C + dx * Math.sin(a) + dy * Math.cos(a)]
  })
  return pts(rot)
}

function quatrefoil(lobes: number, r: number) {
  let d = circlePath(C, C, r * 0.9)
  for (let i = 0; i < lobes; i += 1) {
    const a = ((360 / lobes) * i - 90) * (Math.PI / 180)
    d += circlePath(C + r * 0.75 * Math.cos(a), C + r * 0.75 * Math.sin(a), r * 0.62)
  }
  return d
}

const HAND: [string, string][] = [
  ['Heart', 'M50,88C22,68 8,52 8,36A20,20 0 0 1 50,26A20,20 0 0 1 92,36C92,52 78,68 50,88Z'],
  ['Drop', 'M50,8C68,32 82,44 82,60A32,32 0 0 1 18,60C18,44 32,32 50,8Z'],
  ['Shield', 'M50,6L88,20V50C88,72 70,86 50,94C30,86 12,72 12,50V20Z'],
  ['Bubble', 'M14,16H86A8,8 0 0 1 94,24V64A8,8 0 0 1 86,72H46L26,90V72H14A8,8 0 0 1 6,64V24A8,8 0 0 1 14,16Z'],
  ['Cloud', 'M28,74A20,20 0 0 1 30,34A24,24 0 0 1 74,40A18,18 0 0 1 74,74Z'],
  ['Moon', 'M62,8A44,44 0 1 0 62,92A36,36 0 1 1 62,8Z'],
  ['Tag', 'M52,8H88V44L46,90L8,52ZM76,22A6,6 0 1 0 76,34A6,6 0 0 0 76,22Z'],
  ['Banner', 'M10,20H90V70L74,60L58,70L42,60L26,70L10,60Z'],
  ['Ribbon', 'M12,18H88L74,44L88,70H12L26,44Z'],
  ['Flag', 'M18,8H86L70,32L86,56H18V94H10V8H18Z'],
  ['Bookmark', 'M24,8H76V92L50,72L24,92Z'],
  ['Chevron', 'M24,10L70,50L24,90L38,50Z'],
  ['Cross', 'M38,8H62V38H92V62H62V92H38V62H8V38H38Z'],
  ['Plus round', 'M40,8H60A6,6 0 0 1 66,14V34H86A6,6 0 0 1 92,40V60A6,6 0 0 1 86,66H66V86A6,6 0 0 1 60,92H40A6,6 0 0 1 34,86V66H14A6,6 0 0 1 8,60V40A6,6 0 0 1 14,34H34V14A6,6 0 0 1 40,8Z'],
  ['Diamond', 'M50,6L94,50L50,94L6,50Z'],
  ['Leaf', 'M12,88C12,44 44,12 88,12C88,56 56,88 12,88Z'],
  ['Wave label', 'M8,26C30,14 70,38 92,22V72C70,88 30,62 8,78Z'],
  ['Ticket', 'M8,24H92V42A8,8 0 0 0 92,58V76H8V58A8,8 0 0 0 8,42Z'],
  ['Seal', 'M50,4L62,16L78,12L84,28L98,36L90,50L98,64L84,72L78,88L62,84L50,96L38,84L22,88L16,72L2,64L10,50L2,36L16,28L22,12L38,16Z'],
  ['Speech round', 'M50,10A40,32 0 1 1 50,74H40L20,92L26,72A32,30 0 0 1 50,10Z'],
]

function build(): ShapeDef[] {
  const out: ShapeDef[] = []
  const add = (group: ShapeGroup, name: string, path: string, outline?: boolean) =>
    out.push({ id: `${group}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, group, path, outline })

  // Basic
  add('Basic', 'Circle', circlePath(C, C, 46))
  add('Basic', 'Square', roundRect(6, 6, 88, 88, 0))
  for (let r = 4; r <= 44; r += 4) add('Basic', `Rounded ${r}`, roundRect(6, 6, 88, 88, r))
  for (let r = 0; r <= 30; r += 6) add('Basic', `Wide ${r}`, roundRect(4, 22, 92, 56, r))
  for (let r = 0; r <= 30; r += 6) add('Basic', `Tall ${r}`, roundRect(22, 4, 56, 92, r))
  for (let s = 3; s <= 20; s += 1) add('Basic', `${s}-gon`, polygon(s))
  for (let s = 3; s <= 12; s += 1) add('Basic', `${s}-gon tilt`, polygon(s, 48, -90 + 180 / s))
  HAND.forEach(([name, path]) => add('Basic', name, path))

  // Outlined
  add('Outlined', 'Circle', circlePath(C, C, 46), true)
  add('Outlined', 'Square', roundRect(6, 6, 88, 88, 0), true)
  add('Outlined', 'Rounded 12', roundRect(6, 6, 88, 88, 12), true)
  add('Outlined', 'Rounded 24', roundRect(6, 6, 88, 88, 24), true)
  add('Outlined', 'Rounded 36', roundRect(6, 6, 88, 88, 36), true)
  add('Outlined', 'Triangle', polygon(3), true)
  add('Outlined', 'Square tilt', polygon(4, 48, -45), true)
  add('Outlined', 'Pentagon', polygon(5), true)
  add('Outlined', 'Hexagon', polygon(6), true)
  add('Outlined', 'Octagon', polygon(8), true)
  add('Outlined', 'Star 5', star(5, 0.5), true)
  add('Outlined', 'Star 6', star(6, 0.5), true)
  add('Outlined', 'Heart', HAND.find(([n]) => n === 'Heart')![1], true)
  add('Outlined', 'Shield', HAND.find(([n]) => n === 'Shield')![1], true)
  add('Outlined', 'Diamond', HAND.find(([n]) => n === 'Diamond')![1], true)
  add('Outlined', 'Cross', HAND.find(([n]) => n === 'Cross')![1], true)
  add('Outlined', 'Plus round', HAND.find(([n]) => n === 'Plus round')![1], true)
  add('Outlined', 'Moon', HAND.find(([n]) => n === 'Moon')![1], true)
  add('Outlined', 'Cloud', HAND.find(([n]) => n === 'Cloud')![1], true)
  add('Outlined', 'Arrow', arrow(0, 2), true)
  add('Outlined', 'Chevron', HAND.find(([n]) => n === 'Chevron')![1], true)
  add('Outlined', 'Banner', HAND.find(([n]) => n === 'Banner')![1], true)
  add('Outlined', 'Bookmark', HAND.find(([n]) => n === 'Bookmark')![1], true)
  add('Outlined', 'Bubble', HAND.find(([n]) => n === 'Bubble')![1], true)
  add('Outlined', 'Tag', HAND.find(([n]) => n === 'Tag')![1], true)

  // Stars
  for (let p = 3; p <= 20; p += 1) {
    ;[0.38, 0.5, 0.62, 0.74].forEach((inner, i) =>
      add('Stars', `Star ${p}-${i + 1}`, star(p, inner)),
    )
  }

  // Bursts
  for (let t = 8; t <= 44; t += 2) {
    ;[0.78, 0.86, 0.92].forEach((inner, i) => add('Bursts', `Burst ${t}-${i + 1}`, star(t, inner)))
  }

  // Scallop
  for (let l = 5; l <= 32; l += 1) {
    ;[0.14, 0.22].forEach((d, i) => add('Scallop', `Scallop ${l}-${i + 1}`, scallop(l, d)))
  }

  // Flowers
  for (let p = 3; p <= 16; p += 1) {
    ;[0.42, 0.58, 0.76].forEach((w, i) => add('Flowers', `Flower ${p}-${i + 1}`, flower(p, 46, w)))
  }

  // Gears
  for (let t = 6; t <= 26; t += 1) {
    ;[0.14, 0.22].forEach((d, i) => add('Gears', `Gear ${t}-${i + 1}`, gear(t, d)))
  }

  // Blobs
  for (let i = 1; i <= 60; i += 1) add('Blobs', `Blob ${i}`, blob(i, 6 + (i % 5)))

  // Dots
  for (let c = 3; c <= 24; c += 1) {
    add('Dots', `Ring dots ${c}`, dotsRing(c, 7, 36))
    add('Dots', `Ring dots ${c} core`, dotsRing(c, 6, 38, 16))
    add('Dots', `Ring dots ${c} fine`, dotsRing(c, 4, 42, 22))
  }

  // Arrows
  for (let d = 0; d < 360; d += 45) {
    for (let s = 0; s < 5; s += 1) add('Arrows', `Arrow ${d}-${s}`, arrow(d, s))
  }

  // Badges (quatrefoil / moroccan)
  for (let l = 3; l <= 12; l += 1) {
    ;[26, 32, 38].forEach((r, i) => add('Badges', `Badge ${l}-${i + 1}`, quatrefoil(l, r)))
  }

  // Rings
  for (let i = 1; i <= 20; i += 1) add('Rings', `Ring ${i}`, ring(46, 46 - i * 2))

  // Waves
  for (let w = 3; w <= 16; w += 1) {
    ;[3, 6, 9].forEach((amp, i) => add('Waves', `Wave ${w}-${i + 1}`, wavyCircle(w, amp)))
  }

  // Y2K pack
  Y2K_SHAPES.forEach((s) => add('Y2K', s.name, s.path))

  return out
}

export const SHAPES: ShapeDef[] = build()

export const OUTLINE_PRESETS: { key: 'thin' | 'medium' | 'bold'; label: string; width: number }[] = [
  { key: 'thin', label: 'Thin', width: 4 },
  { key: 'medium', label: 'Medium', width: 12 },
  { key: 'bold', label: 'Bold', width: 22 },
]

export const DEFAULT_STROKE_WIDTH = 12

export function shapeSvg(path: string, color = '#000000', outline = false, strokeWidth = DEFAULT_STROKE_WIDTH) {
  if (outline) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" d="${path}"/></svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path fill="${color}" fill-rule="evenodd" d="${path}"/></svg>`
}

export function shapeDataUrl(
  path: string,
  color = '#000000',
  outline = false,
  strokeWidth = DEFAULT_STROKE_WIDTH,
) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(shapeSvg(path, color, outline, strokeWidth))}`
}
