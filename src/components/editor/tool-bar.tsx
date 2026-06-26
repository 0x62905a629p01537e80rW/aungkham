import { useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Droplet,
  Italic,
  Layers as LayersIcon,
  MoveDiagonal,
  Palette,
  PenLine,
  Plus,
  RotateCw,
  Ruler,
  Sparkles,
  Sun,
  Type as TypeIcon,
  TypeOutline,
  WandSparkles,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SliderField, ColorField } from './control-fields'
import { LayersList } from './layers-list'
import { cn } from '@/lib/utils'
import {
  FONTS,
  TEXTURES,
  fontFamily,
  type TextAlign,
  type TextLayer,
  type TextureType,
} from '@/lib/text-layer'

interface ToolBarProps {
  layers: TextLayer[]
  selected: TextLayer | null
  selectedId: string | null
  onSelect: (id: string) => void
  onChange: (patch: Partial<TextLayer>) => void
  onAdd: () => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

type ToolKey =
  | 'text'
  | 'font'
  | 'size'
  | 'weight'
  | 'style'
  | 'align'
  | 'spacing'
  | 'color'
  | 'opacity'
  | 'stroke'
  | 'shadow'
  | 'highlight'
  | 'rotate'
  | 'skew'
  | 'layers'

interface ToolDef {
  key: ToolKey
  label: string
  icon: typeof TypeIcon
  needsLayer: boolean
}

const TOOLS: ToolDef[] = [
  { key: 'layers', label: 'Layers', icon: LayersIcon, needsLayer: false },
  { key: 'text', label: 'Text', icon: TypeIcon, needsLayer: true },
  { key: 'font', label: 'Font', icon: WandSparkles, needsLayer: true },
  { key: 'size', label: 'Size', icon: Ruler, needsLayer: true },
  { key: 'weight', label: 'Weight', icon: Bold, needsLayer: true },
  { key: 'style', label: 'Style', icon: Italic, needsLayer: true },
  { key: 'align', label: 'Align', icon: AlignCenter, needsLayer: true },
  { key: 'spacing', label: 'Spacing', icon: TypeOutline, needsLayer: true },
  { key: 'color', label: 'Color', icon: Palette, needsLayer: true },
  { key: 'opacity', label: 'Opacity', icon: Droplet, needsLayer: true },
  { key: 'stroke', label: 'Stroke', icon: PenLine, needsLayer: true },
  { key: 'shadow', label: 'Shadow', icon: Sparkles, needsLayer: true },
  { key: 'highlight', label: 'Highlight', icon: Sun, needsLayer: true },
  { key: 'rotate', label: 'Rotate', icon: RotateCw, needsLayer: true },
  { key: 'skew', label: 'Skew', icon: MoveDiagonal, needsLayer: true },
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
}: ToolBarProps) {
  const [openTool, setOpenTool] = useState<ToolKey | null>(null)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
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

        <span className="mx-1 h-8 w-px shrink-0 bg-border" />

        {TOOLS.map((tool) => {
          const disabled = tool.needsLayer && !selected
          const isOpen = openTool === tool.key
          const Icon = tool.icon
          return (
            <Popover
              key={tool.key}
              open={isOpen}
              onOpenChange={(o) => setOpenTool(o ? tool.key : null)}
            >
              <PopoverTrigger asChild>
                <button
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
                className="w-[min(92vw,300px)] rounded-2xl border-border/40 bg-popover/40 p-4 shadow-2xl backdrop-blur-2xl"
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
                />
              </PopoverContent>
            </Popover>
          )
        })}
      </div>
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
}

function ToolHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h3>
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
}: ToolContentProps) {
  if (tool === 'layers') {
    return (
      <div className="-mx-4 -my-4 max-h-[55dvh] overflow-y-auto">
        <LayersList
          layers={layers}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdd={onAdd}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    )
  }

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
      return (
        <div className="space-y-3">
          <ToolHeading>Typeface</ToolHeading>
          <Select value={layer.fontKey} onValueChange={(v) => onChange({ fontKey: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  <span style={{ fontFamily: fontFamily(f.key) }}>{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    case 'size':
      return (
        <div>
          <ToolHeading>Font size</ToolHeading>
          <SliderField
            label="Size"
            value={layer.fontSize}
            min={2}
            max={40}
            step={0.5}
            onChange={(v) => onChange({ fontSize: v })}
          />
        </div>
      )
    case 'weight':
      return (
        <div>
          <ToolHeading>Weight</ToolHeading>
          <SliderField
            label="Weight"
            value={layer.fontWeight}
            min={100}
            max={900}
            step={100}
            onChange={(v) => onChange({ fontWeight: v })}
          />
        </div>
      )
    case 'style':
      return (
        <div className="space-y-3">
          <ToolHeading>Style</ToolHeading>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ fontWeight: layer.fontWeight >= 700 ? 400 : 700 })}
              className={cn(
                'flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition active:scale-95',
                layer.fontWeight >= 700
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border',
              )}
            >
              <Bold className="size-4" />
              Bold
            </button>
            <button
              type="button"
              onClick={() => onChange({ italic: !layer.italic })}
              className={cn(
                'flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition active:scale-95',
                layer.italic
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border',
              )}
            >
              <Italic className="size-4" />
              Italic
            </button>
          </div>
        </div>
      )
    case 'align':
      return (
        <div>
          <ToolHeading>Alignment</ToolHeading>
          <ToggleGroup
            type="single"
            value={layer.align}
            onValueChange={(v) => v && onChange({ align: v as TextAlign })}
            className="w-full"
          >
            <ToggleGroupItem value="left" aria-label="Align left" className="flex-1">
              <AlignLeft className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center" className="flex-1">
              <AlignCenter className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right" className="flex-1">
              <AlignRight className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )
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
    case 'color':
      return (
        <div className="space-y-3">
          <ToolHeading>Fill & Texture</ToolHeading>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TEXTURES) as TextureType[]).map((key) => {
              const t = TEXTURES[key]
              const active = layer.texture === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ texture: key })}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-xl border text-xs font-semibold transition active:scale-95',
                    active
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50',
                  )}
                  style={
                    t.gradient
                      ? {
                          backgroundImage: t.gradient,
                          color: 'transparent',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                        }
                      : undefined
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>
          {layer.texture === 'none' && (
            <ColorField label="Color" value={layer.color} onChange={(v) => onChange({ color: v })} />
          )}
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
            <ColorField
              label="Stroke color"
              value={layer.strokeColor}
              onChange={(v) => onChange({ strokeColor: v })}
            />
          )}
        </div>
      )
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
          <ToolHeading>Perspective</ToolHeading>
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
    default:
      return null
  }
}
