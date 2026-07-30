import { useEffect, useRef, useState } from 'react'
import {
  Layers,
  Lock,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import {
  addCustomFont,
  ensureCustomFontsLoaded,
  listCustomFonts,
  listFavorites,
  removeCustomFont,
  subscribeFonts,
  toggleFavorite,
} from '@/lib/custom-fonts'
import {
  AlignCenter,
  Circle,
  AlignLeft,
  AlignRight,
  Aperture,
  Blend,
  Box,
  Frame,
  Grid2x2,
  LayoutTemplate,
  Move,
  Rotate3d,
  Scissors,
  Spline,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Minus,
  RotateCcw,

  Bold,
  Crop,
  Droplet,
  FlipHorizontal,
  ImageUp,
  Italic,
  Maximize,
  MoveDiagonal,
  Palette,
  PenLine,
  Plus,
  RotateCw,
  Sparkles,
  SlidersHorizontal,
  Wand2,
  Square,
  Sun,
  Eraser,
  ImagePlus,
  Underline,
  Strikethrough,
  Type as TypeIcon,
  FlipVertical,
  TypeOutline,
  WandSparkles,
  Crown,

} from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SliderField, ColorField } from './control-fields'
import { BgRemover } from './bg-remover'
import { ColorPickerPanel, parseGradient } from './color-picker'
import { DEFAULT_STROKE_WIDTH, OUTLINE_PRESETS, shapeDataUrl } from '@/lib/shapes'
import { cn } from '@/lib/utils'
import { rotateImage } from '@/lib/texture-image'
import {
  FONTS,
  type FontOption,

  TEXTURES,
  fontFamily,
  type TextAlign,
  type TextLayer,
  type TextureType,
} from '@/lib/text-layer'

import { layerTextStyle } from './text-layer-view'



interface ToolBarProps {
  layers: TextLayer[]
  selected: TextLayer | null
  selectedId: string | null
  onSelect: (id: string) => void
  onChange: (patch: Partial<TextLayer>) => void
  onAdd: () => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onMoveLayer?: (id: string, dir: 'front' | 'back') => void
  onReplaceImage?: () => void
  onOpenTemplates?: () => void
  onImageTool?: (
    tool: 'crop' | 'resize' | 'flip' | 'fit' | 'frame' | 'blur' | 'adjust' | 'filter' | 'removebg',
  ) => void
  autoOpenTool?: ToolKey | null
  onAutoOpenHandled?: () => void
  /** Opens brush-erase mode directly on the main canvas (all layers at once). */
  onEraseAll: () => void
}

const IMAGE_TOOLS = [
  { key: 'replace', label: 'Replace', icon: ImageUp },
  { key: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
  { key: 'filter', label: 'Filters', icon: Wand2 },
  { key: 'crop', label: 'Crop', icon: Crop },
  { key: 'resize', label: 'Resize', icon: Maximize },
  { key: 'flip', label: 'Flip', icon: FlipHorizontal },
  { key: 'fit', label: 'Fit', icon: Square },
  { key: 'frame', label: 'Frame', icon: Frame },
  { key: 'blur', label: 'Blur', icon: Aperture },
  { key: 'removebg', label: 'Remove BG', icon: Scissors },
] as const


type ToolKey =
  | 'text'
  | 'font'
  | 'format'
  | 'spacing'
  | 'position'
  | 'color'
  | 'gradient'
  | 'texture'
  | 'opacity'
  | 'blend'
  | 'stroke'
  | 'shadow'
  | 'highlight'
  | 'rotate'
  | 'rotate3d'
  | 'depth3d'
  | 'perspective'
  | 'bend'
  | 'skew'
  | 'erase'
  | 'cutout'
  | 'outline'

interface ToolDef {
  key: ToolKey
  label: string
  icon: typeof TypeIcon
  needsLayer: boolean
  shapeOnly?: boolean
  /** only for image/sticker graphic layers */
  imageOnly?: boolean
}

const TOOLS: ToolDef[] = [
  { key: 'font', label: 'Font', icon: WandSparkles, needsLayer: true },
  { key: 'format', label: 'Format', icon: TypeIcon, needsLayer: true },
  { key: 'spacing', label: 'Spacing', icon: TypeOutline, needsLayer: true },
  { key: 'position', label: 'Position', icon: Move, needsLayer: true },
  { key: 'color', label: 'Color', icon: Palette, needsLayer: true },
  { key: 'gradient', label: 'Gradient', icon: Blend, needsLayer: true },
  { key: 'texture', label: 'Texture', icon: Grid2x2, needsLayer: true },
  { key: 'opacity', label: 'Opacity', icon: Droplet, needsLayer: true },
  { key: 'blend', label: 'Blend', icon: Layers, needsLayer: true },
  { key: 'stroke', label: 'Stroke', icon: PenLine, needsLayer: true },
  { key: 'shadow', label: 'Shadow', icon: Sparkles, needsLayer: true },
  { key: 'highlight', label: 'Highlight', icon: Sun, needsLayer: true },
  { key: 'rotate3d', label: '3D Rotate', icon: Rotate3d, needsLayer: true },
  { key: 'depth3d', label: '3D', icon: Box, needsLayer: true },
  { key: 'perspective', label: 'Perspective', icon: Frame, needsLayer: true },
  { key: 'bend', label: 'Bend', icon: Spline, needsLayer: true },
  { key: 'skew', label: 'Skew', icon: MoveDiagonal, needsLayer: true },
  { key: 'erase', label: 'Erase', icon: Eraser, needsLayer: false },
  { key: 'cutout', label: 'Remove BG', icon: Scissors, needsLayer: true, imageOnly: true },
  { key: 'outline', label: 'Outline', icon: Circle, needsLayer: true, shapeOnly: true },
]


export function ToolBar({
  layers,
  selected,
  selectedId,
  onSelect,
  onChange,
  onAdd,
  onDuplicate,
  onDelete,
  onMoveLayer,
  onReplaceImage,
  onOpenTemplates,
  onImageTool,
  autoOpenTool,
  onAutoOpenHandled,
  onEraseAll,
}: ToolBarProps) {
  const [openTool, setOpenTool] = useState<ToolKey | null>(null)
  const [cutoutOpen, setCutoutOpen] = useState(false)
  const toolRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const autoOpenRef = useRef<string | null>(null)
  const handledCbRef = useRef(onAutoOpenHandled)
  handledCbRef.current = onAutoOpenHandled

  useEffect(() => {
    if (!autoOpenTool) return
    if (autoOpenRef.current === autoOpenTool) return
    const key = autoOpenTool
    autoOpenRef.current = key

    let tries = 0
    // The button may not be mounted yet (shape-only tools appear once the new
    // layer is selected), so poll briefly for it, scroll it into view, then open.
    const tick = () => {
      const el = toolRefs.current[key]
      if (!el) {
        if (tries++ < 30) setTimeout(tick, 50)
        return
      }
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      setTimeout(() => {
        setOpenTool(key)
        autoOpenRef.current = null
        handledCbRef.current?.()
      }, 380)
    }
    tick()
  }, [autoOpenTool])





  return (
    <nav
      className="glass-bar fixed inset-x-0 bottom-0 z-30 border-t border-border/40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Image / background row — locked while a layer is selected */}
      <div
        aria-hidden={!!selected}
        className={cn(
          'flex items-center gap-1 overflow-x-auto border-b border-border/60 px-2 py-1.5 transition duration-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          selected && 'pointer-events-none select-none opacity-45',
        )}
      >
        <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          BG
        </span>
        {IMAGE_TOOLS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            disabled={!!selected}
            onClick={() =>
              key === 'replace'
                ? onReplaceImage?.()
                : onImageTool?.(
                    key as
                      | 'crop'
                      | 'resize'
                      | 'flip'
                      | 'fit'
                      | 'frame'
                      | 'blur'
                      | 'adjust'
                      | 'filter'
                      | 'removebg',
                  )
            }
            className="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2.5 py-1 text-[10px] font-medium text-foreground/75 transition active:scale-95"
          >
            <Icon className="size-[17px]" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add text layer"
          className="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground transition active:scale-95"
        >
          <Plus className="size-[18px]" strokeWidth={2.4} />
          Add
        </button>

        <button
          type="button"
          onClick={onOpenTemplates}
          className="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2.5 py-1.5 text-[10px] font-medium text-foreground/85 transition active:scale-95"
        >
          <LayoutTemplate className="size-[18px]" />
          Templates
        </button>

        <span className="mx-1 h-8 w-px shrink-0 bg-border" />


        {TOOLS.filter(
          (tool) =>
            (!tool.shapeOnly || !!selected?.graphic?.path) &&
            (!tool.imageOnly || (!!selected?.graphic && !selected.graphic.path)),
        ).map((tool) => {
          const disabled = tool.needsLayer && !selected
          const isOpen = openTool === tool.key
          const Icon = tool.icon

          if (tool.key === 'erase' || tool.key === 'cutout') {
            const eraseDisabled = tool.key === 'erase' ? layers.length === 0 : disabled
            return (
              <button
                key={tool.key}
                type="button"
                disabled={eraseDisabled}
                ref={(el) => {
                  toolRefs.current[tool.key] = el
                }}
                onClick={() => {
                  if (tool.key === 'cutout') {
                    setCutoutOpen(true)
                    return
                  }
                  // Erase paints directly on the main canvas across every layer.
                  onEraseAll()
                }}
                className={cn(
                  'flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2.5 py-1.5 text-[10px] font-medium text-foreground/75 transition active:scale-95',
                  eraseDisabled && 'opacity-35',
                )}
              >
                <Icon className="size-[18px]" />
                {tool.label}
              </button>
            )
          }


          return (
            <Popover
              key={tool.key}
              open={isOpen}
              onOpenChange={(o) => setOpenTool(o ? tool.key : null)}
            >
              <PopoverTrigger asChild>
                <button
                  ref={(el) => {
                    toolRefs.current[tool.key] = el
                  }}
                  type="button"
                  disabled={disabled}
                  className={cn(
                    'flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2.5 py-1.5 text-[10px] font-medium transition active:scale-95',
                    isOpen
                      ? 'bg-primary/12 text-primary'
                      : 'text-foreground/75 hover:text-foreground',
                    disabled && 'opacity-35',
                  )}
                >
                  <Icon
                    className="size-[18px]"
                    strokeWidth={isOpen ? 2.4 : 2}
                  />
                  {tool.label}
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="center"
                sideOffset={10}
                collisionPadding={12}
                className="glass-panel w-[min(92vw,340px)] rounded-3xl border-0 bg-transparent p-4 shadow-none"
              >
                <ToolContent
                  tool={tool.key}
                  layer={selected}
                  layers={layers}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    onSelect(id)
                  }}
                  onChange={onChange}
                  onAdd={onAdd}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onMoveLayer={onMoveLayer}
                  onCloseTool={() => setOpenTool(null)}
                />
              </PopoverContent>
            </Popover>
          )
        })}
      </div>

      {selected?.graphic && (
        <BgRemover
          open={cutoutOpen}
          src={selected.graphic.src}
          onClose={() => setCutoutOpen(false)}
          onApply={(url) =>
            selected.graphic && onChange({ graphic: { ...selected.graphic, src: url } })
          }
        />
      )}
    </nav>
  )
}

interface ToolContentProps {
  tool: ToolKey
  layer: TextLayer | null
  layers: TextLayer[]
  selectedId: string | null
  onSelect: (id: string) => void
  onChange: (patch: Partial<TextLayer>) => void
  onAdd: () => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onMoveLayer?: (id: string, dir: 'front' | 'back') => void
  onCloseTool?: () => void
}

const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
] as const

function ToolHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h3>
  )
}

type FontGroup = 'favorites' | 'english' | 'mm-free' | 'mm-premium' | 'custom'

const FONT_GROUPS: { key: FontGroup; label: string }[] = [
  { key: 'favorites', label: 'Favorites' },
  { key: 'english', label: 'English' },
  { key: 'mm-free', label: 'Myanmar' },
  { key: 'mm-premium', label: 'Premium' },
  { key: 'custom', label: 'My Fonts' },
]

function groupOf(cat: FontOption['category']): FontGroup {
  if (cat === 'Myanmar') return 'mm-free'
  if (cat === 'Myanmar Pro') return 'mm-premium'
  return 'english'
}

type FontEntry = { key: string; label: string; myanmar: boolean; customId?: string }

function FontCard({
  entry,
  active,
  fav,
  locked = false,
  onSelect,
  onFav,
  onDelete,
}: {
  entry: FontEntry
  active: boolean
  fav: boolean
  locked?: boolean
  onSelect: () => void
  onFav: () => void
  onDelete?: () => void
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border transition',
        active
          ? 'border-primary bg-primary/15 shadow-[0_0_0_1px_var(--color-primary)]'
          : 'border-border/60 bg-foreground/5 hover:bg-foreground/10',
      )}
    >
      <button type="button" onClick={onSelect} className="block w-full px-2 pb-1.5 pt-1.5 text-left">
        {locked && (
          <span className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-background/60 backdrop-blur-[2px]">
            <Lock className="size-4 text-[#8b5cf6]" />
          </span>
        )}
        <span
          className="block overflow-hidden text-ellipsis whitespace-nowrap py-1 text-[15px] text-foreground"
          style={{ fontFamily: fontFamily(entry.key), lineHeight: entry.myanmar ? 2 : 1.4 }}
        >
          {entry.myanmar ? 'မြန်မာစာ' : 'Aa Bb Cc'}
        </span>

        <span className="mt-0.5 block truncate text-[9px] uppercase tracking-wider text-muted-foreground">
          {entry.label}
        </span>
      </button>
      <div className="absolute right-1 top-1 flex gap-0.5">
        {onDelete && (
          <button
            type="button"
            aria-label="Delete font"
            onClick={onDelete}
            className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition active:scale-90"
          >
            <Trash2 className="size-3" />
          </button>
        )}
        <button
          type="button"
          aria-label="Favorite"
          onClick={onFav}
          className={cn(
            'flex size-5 items-center justify-center rounded-full transition active:scale-90',
            fav ? 'text-primary' : 'text-muted-foreground/60',
          )}
        >
          <Star className={cn('size-3', fav && 'fill-current')} />
        </button>
      </div>
    </div>
  )
}

function FontPicker({
  layer,
  onChange,
  onClose,
}: {
  layer: TextLayer
  onChange: (patch: Partial<TextLayer>) => void
  onClose?: () => void
}) {
  const current = FONTS.find((f) => f.key === layer.fontKey)
  const [group, setGroup] = useState<FontGroup>(
    layer.fontKey.startsWith('custom:') ? 'custom' : groupOf(current?.category ?? 'Sans'),
  )
  const [, force] = useState(0)
  const { isPro } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ensureCustomFontsLoaded()
    return subscribeFonts(() => force((n) => n + 1))
  }, [])

  const customs = listCustomFonts()
  const favs = listFavorites()

  const all: FontEntry[] = [
    ...FONTS.map((f) => ({
      key: f.key,
      label: f.label,
      myanmar: f.category === 'Myanmar' || f.category === 'Myanmar Pro',
    })),
    ...customs.map((c) => ({
      key: `custom:${c.id}`,
      label: c.label,
      myanmar: true,
      customId: c.id,
    })),
  ]

  const items =
    group === 'favorites'
      ? all.filter((f) => favs.includes(f.key))
      : group === 'custom'
        ? all.filter((f) => f.customId)
        : all.filter((f) => !f.customId && groupOf(FONTS.find((x) => x.key === f.key)!.category) === group)

  return (
    <div className="space-y-3">
      <ToolHeading>Typeface</ToolHeading>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {FONT_GROUPS.map((g) => {
          const premium = g.key === 'mm-premium'
          const on = group === g.key
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(g.key)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition active:scale-95',
                premium
                  ? on
                    ? 'bg-[linear-gradient(120deg,#f7d774,#e0a93c_45%,#fff1c1_70%,#c98a2b)] text-[#3a2a05] shadow-[0_2px_10px_-2px_rgba(224,169,60,0.7)]'
                    : 'border border-[#e0a93c]/50 bg-[#e0a93c]/10 text-[#e0a93c]'
                  : on
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border/60 bg-foreground/5 text-foreground/70',
              )}
            >
              {premium ? (
                <span className="flex items-center gap-1">
                  <Crown className="size-3" />
                  {g.label}
                </span>
              ) : (
                g.label
              )}
            </button>
          )
        })}
      </div>


      {group === 'custom' && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              const f = await addCustomFont(file)
              onChange({ fontKey: `custom:${f.id}` })
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-primary/10 py-3 text-xs font-semibold text-foreground transition active:scale-[0.99]"
          >
            <Upload className="size-4" /> Upload font (.ttf, .otf, .woff)
          </button>
        </>
      )}

      {group === 'mm-premium' && !isPro && (
        <p className="flex items-center gap-1.5 rounded-xl border border-[#e0a93c]/40 bg-[#e0a93c]/10 px-3 py-2 text-[11px] font-medium text-foreground">
          <Crown className="size-3.5 shrink-0 text-[#e0a93c]" />
          Premium fonts are free to try — Pro is required to export with them.
        </p>
      )}


      <div className="grid max-h-[46dvh] grid-cols-2 gap-2 overflow-y-auto pr-1">
        {items.map((f) => (
          <FontCard
            key={f.key}
            entry={f}
            active={layer.fontKey === f.key}
            fav={favs.includes(f.key)}
            locked={false}
            onSelect={() => {
              onChange({ fontKey: f.key })
              onClose?.()
            }}
            onFav={() => toggleFavorite(f.key)}
            onDelete={
              f.customId
                ? () => {
                    removeCustomFont(f.customId!)
                    if (layer.fontKey === f.key) onChange({ fontKey: 'anton' })
                  }
                : undefined
            }
          />
        ))}
        {items.length === 0 && (
          <p className="col-span-2 py-6 text-center text-xs text-muted-foreground">
            {group === 'favorites'
              ? 'No favorite fonts yet — tap the star on any font.'
              : 'No custom fonts yet — upload one above.'}
          </p>
        )}
      </div>
    </div>
  )
}


function ToolContent({
  tool,
  layer,
  layers,
  selectedId,
  onSelect,
  onChange,
  onAdd,
  onDuplicate,
  onDelete,
  onMoveLayer,
  onCloseTool,
}: ToolContentProps) {
  if (!layer) return null

  switch (tool) {
    case 'text':
      return (
        <div>
          <ToolHeading>Content</ToolHeading>
          <Textarea
            autoFocus
            value={layer.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Type your text..."
            rows={3}
            className="resize-none text-base"
          />
        </div>
      )
    case 'font':
      return <FontPicker layer={layer} onChange={onChange} onClose={onCloseTool} />


    case 'format':
      return <FormatPanel layer={layer} onChange={onChange} />

    case 'spacing':
      return (
        <div className="space-y-4">
          <ToolHeading>Spacing</ToolHeading>
          <SliderField
            label="Letter spacing"
            value={layer.letterSpacing}
            min={-20}
            max={80}
            onChange={(v) => onChange({ letterSpacing: v })}
          />
          <SliderField
            label="Line height"
            value={layer.lineHeight}
            min={0.7}
            max={2.5}
            step={0.05}
            onChange={(v) => onChange({ lineHeight: v })}
          />
        </div>
      )
    case 'color': {
      const currentValue =
        layer.fillType === 'gradient'
          ? `linear-gradient(${layer.gradientAngle ?? 90}deg, ${layer.gradientFrom ?? '#ff7a18'}, ${layer.gradientTo ?? '#af002d'})`
          : layer.color
      return (
        <div className="space-y-3">
          <ColorPickerPanel
            value={currentValue}
            allowGradient
            initialMode={layer.fillType === 'gradient' ? 'gradient' : 'solid'}
            onChange={(v) => {
              const parsed = parseGradient(v)
              if (parsed) {
                onChange({
                  fillType: 'gradient',
                  gradientFrom: parsed.stops[0].color,
                  gradientTo: parsed.stops[parsed.stops.length - 1].color,
                  gradientAngle: parsed.angle,
                })
              } else {
                onChange({ fillType: 'solid', color: v })
              }
            }}
          />
        </div>
      )
    }
    case 'blend':
      return (
        <div>
          <ToolHeading>Blend mode</ToolHeading>
          <div className="grid grid-cols-3 gap-1.5">
            {BLEND_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange({ blendMode: m })}
                className={cn(
                  'truncate rounded-xl border px-2 py-2 text-[10px] font-medium capitalize transition active:scale-95',
                  (layer.blendMode ?? 'normal') === m
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border/60 text-foreground/80',
                )}
              >
                {m.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      )
    case 'opacity':
      return (
        <div>
          <ToolHeading>Opacity</ToolHeading>
          <SliderField
            label="Opacity"
            value={layer.opacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ opacity: v })}
          />
        </div>
      )
    case 'stroke':
      return (
        <div className="space-y-4">
          <ToolHeading>Stroke</ToolHeading>
          <SliderField
            label="Width"
            value={layer.strokeWidth}
            min={0}
            max={20}
            step={0.5}
            onChange={(v) => onChange({ strokeWidth: v })}
          />
          {layer.strokeWidth > 0 && (
            <>
              <SliderField
                label="Opacity"
                value={Math.round((layer.strokeOpacity ?? 1) * 100)}
                min={0}
                max={100}
                suffix="%"
                onChange={(v) => onChange({ strokeOpacity: v / 100 })}
              />
              <ColorField
                label="Stroke color"
                value={layer.strokeColor}
                onChange={(v) => onChange({ strokeColor: v })}
              />
            </>
          )}
        </div>
      )
    case 'outline': {
      const g = layer.graphic
      if (!g?.path) return null
      const outline = !!g.outline
      const width = g.strokeWidth ?? DEFAULT_STROKE_WIDTH
      const strokeColor = g.strokeColor ?? layer.color
      const apply = (patch: Partial<typeof g>) => {
        const next = { ...g, ...patch }
        onChange({
          graphic: {
            ...next,
            src: shapeDataUrl(
              g.path!,
              '#000000',
              !!next.outline,
              next.strokeWidth ?? DEFAULT_STROKE_WIDTH,
            ),
          },
        })
      }
      return (
        <div className="space-y-4">
          <ToolHeading>Outline</ToolHeading>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => apply({ outline: false })}
              className={cn(
                'h-9 flex-1 rounded-xl border text-xs font-semibold transition active:scale-95',
                !outline ? 'border-primary bg-primary/15 text-primary' : 'border-border/60',
              )}
            >
              Filled
            </button>
            <button
              type="button"
              onClick={() => apply({ outline: true })}
              className={cn(
                'h-9 flex-1 rounded-xl border text-xs font-semibold transition active:scale-95',
                outline ? 'border-primary bg-primary/15 text-primary' : 'border-border/60',
              )}
            >
              Outline
            </button>
          </div>

          {outline && (
            <>
              <div className="flex gap-2">
                {OUTLINE_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => apply({ outline: true, strokeWidth: p.width })}
                    className={cn(
                      'h-9 flex-1 rounded-xl border text-[11px] font-semibold transition active:scale-95',
                      width === p.width
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border/60',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <SliderField
                label="Stroke width"
                value={width}
                min={1}
                max={40}
                step={1}
                onChange={(v) => apply({ outline: true, strokeWidth: v })}
              />

              <ColorField
                label="Stroke color"
                value={strokeColor}
                onChange={(v) => apply({ strokeColor: v })}
              />

              {g.strokeColor && (
                <button
                  type="button"
                  onClick={() => apply({ strokeColor: undefined })}
                  className="w-full rounded-xl border border-border/60 py-2 text-[11px] font-medium text-muted-foreground transition active:scale-95"
                >
                  Use layer color
                </button>
              )}
            </>
          )}
        </div>
      )
    }
    case 'shadow':
      return (
        <div className="space-y-4">
          <ToolHeading>Shadow</ToolHeading>
          <ColorField
            label="Color"
            value={layer.shadowColor}
            onChange={(v) => onChange({ shadowColor: v })}
          />
          <SliderField
            label="Blur"
            value={layer.shadowBlur}
            min={0}
            max={50}
            onChange={(v) => onChange({ shadowBlur: v })}
          />
          <SliderField
            label="Offset X"
            value={layer.shadowOffsetX}
            min={-40}
            max={40}
            onChange={(v) => onChange({ shadowOffsetX: v })}
          />
          <SliderField
            label="Offset Y"
            value={layer.shadowOffsetY}
            min={-40}
            max={40}
            onChange={(v) => onChange({ shadowOffsetY: v })}
          />
        </div>
      )
    case 'highlight':
      return (
        <div className="space-y-3">
          <ToolHeading>Highlight</ToolHeading>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Background block</Label>
            <Switch
              checked={layer.highlight}
              onCheckedChange={(v) => onChange({ highlight: v })}
            />
          </div>
          {layer.highlight && (
            <ColorField
              label="Color"
              value={layer.highlightColor}
              onChange={(v) => onChange({ highlightColor: v })}
            />
          )}
        </div>
      )
    case 'rotate':
      return (
        <div>
          <ToolHeading>Rotation</ToolHeading>
          <SliderField
            label="Rotation"
            value={layer.rotation}
            min={-180}
            max={180}
            suffix="°"
            onChange={(v) => onChange({ rotation: v })}
          />
        </div>
      )
    case 'skew':
      return (
        <div className="space-y-4">
          <ToolHeading>Skew</ToolHeading>
          <SliderField
            label="Tilt X"
            value={layer.skewX}
            min={-45}
            max={45}
            suffix="°"
            onChange={(v) => onChange({ skewX: v })}
          />
          <SliderField
            label="Tilt Y"
            value={layer.skewY}
            min={-45}
            max={45}
            suffix="°"
            onChange={(v) => onChange({ skewY: v })}
          />
        </div>
      )
    case 'position':
      return (
        <PositionPanel
          layer={layer}
          onChange={onChange}
          onMoveLayer={onMoveLayer}
        />
      )
    case 'gradient':
      return (
        <div className="space-y-4">
          <ToolHeading>Gradient fill</ToolHeading>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Use gradient</Label>
            <Switch
              checked={layer.fillType === 'gradient'}
              onCheckedChange={(v) => onChange({ fillType: v ? 'gradient' : 'solid' })}
            />
          </div>
          <ColorField
            label="From"
            value={layer.gradientFrom ?? '#ff7a18'}
            onChange={(v) => onChange({ gradientFrom: v, fillType: 'gradient' })}
          />
          <ColorField
            label="To"
            value={layer.gradientTo ?? '#af002d'}
            onChange={(v) => onChange({ gradientTo: v, fillType: 'gradient' })}
          />
          <SliderField
            label="Angle"
            value={layer.gradientAngle ?? 90}
            min={0}
            max={360}
            suffix="°"
            onChange={(v) => onChange({ gradientAngle: v })}
          />
        </div>
      )
    case 'texture': {
      const src = layer.textureSrc ?? layer.textureImage
      const applyRotate = (deg: number) => {
        onChange({ textureRotate: deg })
        if (!src) return
        rotateImage(src, deg)
          .then((url) => onChange({ textureImage: url, fillType: 'texture' }))
          .catch(() => undefined)
      }
      return (
        <div className="space-y-4">
          <ToolHeading>Texture from image</ToolHeading>
          <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border text-xs font-semibold transition active:scale-95">
            <ImagePlus className="size-4" />
            {layer.textureImage ? 'Change image' : 'Select image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const url = String(reader.result)
                  onChange({
                    textureSrc: url,
                    textureImage: url,
                    fillType: 'texture',
                    textureRotate: 0,
                    textureScaleX: 100,
                    textureScaleY: 100,
                    textureOffsetX: 50,
                    textureOffsetY: 50,
                  })
                }
                reader.readAsDataURL(file)
              }}
            />
          </label>

          {layer.textureImage && (
            <>
              <SliderField
                label="Rotate"
                value={layer.textureRotate ?? 0}
                min={0}
                max={360}
                suffix="°"
                onChange={applyRotate}
              />
              <SliderField
                label="Horizontal"
                value={layer.textureScaleX ?? 100}
                min={20}
                max={400}
                suffix="%"
                onChange={(v) => onChange({ textureScaleX: v })}
              />
              <SliderField
                label="Vertical"
                value={layer.textureScaleY ?? 100}
                min={20}
                max={400}
                suffix="%"
                onChange={(v) => onChange({ textureScaleY: v })}
              />
              <SliderField
                label="Move X"
                value={layer.textureOffsetX ?? 50}
                min={-100}
                max={200}
                suffix="%"
                onChange={(v) => onChange({ textureOffsetX: v })}
              />
              <SliderField
                label="Move Y"
                value={layer.textureOffsetY ?? 50}
                min={-100}
                max={200}
                suffix="%"
                onChange={(v) => onChange({ textureOffsetY: v })}
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    textureImage: undefined,
                    textureSrc: undefined,
                    fillType: 'solid',
                  })
                }
                className="h-9 w-full rounded-xl border border-border text-xs font-semibold transition active:scale-95"
              >
                Remove texture image
              </button>
            </>
          )}
          <ColorField label="Base color" value={layer.color} onChange={(v) => onChange({ color: v })} />
        </div>
      )
    }

    case 'rotate3d':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <ToolHeading>3D rotate</ToolHeading>
            <button
              type="button"
              aria-label="Reset 3D rotation"
              onClick={() => onChange({ rotateX: 0, rotateY: 0, rotation: 0 })}
              className="mb-3 text-muted-foreground transition active:scale-90"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
          <SliderField
            label="Vertical"
            value={layer.rotateX ?? 0}
            min={-80}
            max={80}
            suffix="°"
            onChange={(v) => onChange({ rotateX: v })}
          />
          <SliderField
            label="Horizontal"
            value={layer.rotateY ?? 0}
            min={-80}
            max={80}
            suffix="°"
            onChange={(v) => onChange({ rotateY: v })}
          />
          <SliderField
            label="2D"
            value={layer.rotation}
            min={-180}
            max={180}
            suffix="°"
            onChange={(v) => onChange({ rotation: v })}
          />
        </div>
      )
    case 'depth3d':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">3D depth</Label>
            <Switch
              checked={!!layer.depthOn}
              onCheckedChange={(v) => onChange({ depthOn: v })}
            />
          </div>
          <SliderField
            label="Depth"
            value={layer.depth ?? 30}
            min={0}
            max={100}
            onChange={(v) => onChange({ depth: v, depthOn: true })}
          />
          <SliderField
            label="Darken"
            value={layer.depthDarken ?? 48}
            min={0}
            max={100}
            onChange={(v) => onChange({ depthDarken: v })}
          />
          <ColorField
            label="Depth color"
            value={layer.depthColor ?? '#1d4ed8'}
            onChange={(v) => onChange({ depthColor: v, depthOn: true })}
          />
        </div>
      )
    case 'perspective':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <ToolHeading>Perspective</ToolHeading>
            <button
              type="button"
              onClick={() => onChange({ rotateX: 0, rotateY: 0, skewX: 0, skewY: 0 })}
              className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {PERSPECTIVE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.patch)}
                className="flex h-11 items-center justify-center rounded-xl border border-border text-[10px] font-semibold transition active:scale-95"
              >
                {p.label}
              </button>
            ))}
          </div>
          <SliderField
            label="Depth of field"
            value={layer.perspective ?? 600}
            min={200}
            max={2000}
            step={20}
            onChange={(v) => onChange({ perspective: v })}
          />
        </div>
      )
    case 'bend':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <ToolHeading>Bend</ToolHeading>
            <button
              type="button"
              onClick={() => onChange({ bend: 0 })}
              className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Reset
            </button>
          </div>
          <SliderField
            label="Arc"
            value={layer.bend ?? 0}
            min={-100}
            max={100}
            onChange={(v) => onChange({ bend: v })}
          />
        </div>
      )
    default:
      return null
  }
}

const PERSPECTIVE_PRESETS = [
  { label: 'Left', patch: { rotateY: -35, rotateX: 0 } },
  { label: 'Right', patch: { rotateY: 35, rotateX: 0 } },
  { label: 'Top', patch: { rotateX: 35, rotateY: 0 } },
  { label: 'Bottom', patch: { rotateX: -35, rotateY: 0 } },
] satisfies { label: string; patch: Partial<TextLayer> }[]

const POSITION_TABS = ['Move', 'Zoom', 'Rotate', 'Layer Order'] as const

function PositionPanel({
  layer,
  onChange,
  onMoveLayer,
}: {
  layer: TextLayer
  onChange: (patch: Partial<TextLayer>) => void
  onMoveLayer?: (id: string, dir: 'front' | 'back') => void
}) {
  const [tab, setTab] = useState<(typeof POSITION_TABS)[number]>('Move')
  const [step, setStep] = useState(10)

  const nudge = (dx: number, dy: number) =>
    onChange({
      x: Math.round((layer.x + (dx * step) / 10) * 10) / 10,
      y: Math.round((layer.y + (dy * step) / 10) * 10) / 10,
    })

  const iconBtn =
    'flex h-9 items-center justify-center rounded-xl border border-border text-foreground transition active:scale-95'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {POSITION_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-lg px-1 py-1 text-[10px] font-semibold transition',
              tab === t ? 'bg-primary/15 text-primary' : 'text-muted-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Move' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button type="button" className={iconBtn} aria-label="Align left" onClick={() => onChange({ x: 10 })}>
              <AlignLeft className="size-4" />
            </button>
            <button type="button" className={iconBtn} aria-label="Center horizontally" onClick={() => onChange({ x: 50 })}>
              <AlignCenter className="size-4" />
            </button>
            <button type="button" className={iconBtn} aria-label="Align right" onClick={() => onChange({ x: 90 })}>
              <AlignRight className="size-4" />
            </button>
            <button type="button" className={iconBtn} aria-label="Align top" onClick={() => onChange({ y: 10 })}>
              <ArrowUpToLine className="size-4" />
            </button>
            <button type="button" className={iconBtn} aria-label="Center vertically" onClick={() => onChange({ y: 50 })}>
              <Move className="size-4" />
            </button>
            <button type="button" className={iconBtn} aria-label="Align bottom" onClick={() => onChange({ y: 90 })}>
              <ArrowDownToLine className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Step {step}</Label>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Smaller step" className={cn(iconBtn, 'w-9')} onClick={() => setStep((s) => Math.max(1, s - 1))}>
                <Minus className="size-4" />
              </button>
              <button type="button" aria-label="Bigger step" className={cn(iconBtn, 'w-9')} onClick={() => setStep((s) => Math.min(50, s + 1))}>
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div className="mx-auto grid w-32 grid-cols-3 gap-1">
            <span />
            <button type="button" aria-label="Move up" className={iconBtn} onClick={() => nudge(0, -1)}>
              <ChevronUp className="size-4" />
            </button>
            <span />
            <button type="button" aria-label="Move left" className={iconBtn} onClick={() => nudge(-1, 0)}>
              <ChevronLeft className="size-4" />
            </button>
            <span />
            <button type="button" aria-label="Move right" className={iconBtn} onClick={() => nudge(1, 0)}>
              <ChevronRight className="size-4" />
            </button>
            <span />
            <button type="button" aria-label="Move down" className={iconBtn} onClick={() => nudge(0, 1)}>
              <ChevronDown className="size-4" />
            </button>
            <span />
          </div>
        </div>
      )}

      {tab === 'Zoom' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button type="button" className={cn(iconBtn, 'flex-1 gap-2 text-xs font-semibold')} onClick={() => onChange({ flipH: !layer.flipH })}>
              <FlipHorizontal className="size-4" /> Flip H
            </button>
            <button type="button" className={cn(iconBtn, 'flex-1 gap-2 text-xs font-semibold')} onClick={() => onChange({ flipV: !layer.flipV })}>
              <FlipVertical className="size-4" /> Flip V
            </button>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Zoom</Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {Math.round((layer.fontSize / 12) * 100)}%
              </span>
              <button
                type="button"
                aria-label="Zoom out"
                className={cn(iconBtn, 'w-9')}
                onClick={() => onChange({ fontSize: Math.max(2, Math.round((layer.fontSize - 0.5) * 2) / 2) })}
              >
                <Minus className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                className={cn(iconBtn, 'w-9')}
                onClick={() => onChange({ fontSize: Math.min(40, Math.round((layer.fontSize + 0.5) * 2) / 2) })}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <SliderField
            label="Size"
            value={layer.fontSize}
            min={2}
            max={40}
            step={0.5}
            onChange={(v) => onChange({ fontSize: v })}
          />
        </div>
      )}

      {tab === 'Rotate' && (
        <div className="space-y-3">
          <button
            type="button"
            aria-label="Reset rotation"
            className={cn(iconBtn, 'mx-auto w-12')}
            onClick={() => onChange({ rotation: 0 })}
          >
            <RotateCcw className="size-4" />
          </button>
          <SliderField
            label="Rotation"
            value={layer.rotation}
            min={-180}
            max={180}
            suffix="°"
            onChange={(v) => onChange({ rotation: v })}
          />
        </div>
      )}

      {tab === 'Layer Order' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={cn(iconBtn, 'gap-2 text-xs font-semibold')}
            onClick={() => onMoveLayer?.(layer.id, 'front')}
          >
            <ArrowUpToLine className="size-4" /> Front
          </button>
          <button
            type="button"
            className={cn(iconBtn, 'gap-2 text-xs font-semibold')}
            onClick={() => onMoveLayer?.(layer.id, 'back')}
          >
            <ArrowDownToLine className="size-4" /> Back
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------- Text style templates ---------------- */

