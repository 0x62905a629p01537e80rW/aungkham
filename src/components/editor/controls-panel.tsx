import { AlignCenter, AlignLeft, AlignRight, Bold, Italic } from 'lucide-react'
import { Section, SliderField, ColorField } from './control-fields'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import {
  FONTS,
  TEXTURES,
  fontFamily,
  type TextAlign,
  type TextLayer,
  type TextureType,
} from '@/lib/text-layer'

export type ControlCategory = 'text' | 'color' | 'effects' | 'transform'

interface ControlsPanelProps {
  layer: TextLayer
  category: ControlCategory
  onChange: (patch: Partial<TextLayer>) => void
}

export function ControlsPanel({ layer, category, onChange }: ControlsPanelProps) {
  if (category === 'text') {
    return (
      <div>
        <Section title="Content">
          <Textarea
            value={layer.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Type your text..."
            rows={2}
            className="resize-none text-base"
          />
        </Section>

        <Section title="Font">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Typeface</Label>
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

          <SliderField
            label="Size"
            value={layer.fontSize}
            min={2}
            max={40}
            step={0.5}
            onChange={(v) => onChange({ fontSize: v })}
          />
          <SliderField
            label="Weight"
            value={layer.fontWeight}
            min={100}
            max={900}
            step={100}
            onChange={(v) => onChange({ fontWeight: v })}
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={layer.fontWeight >= 700 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ fontWeight: layer.fontWeight >= 700 ? 400 : 700 })}
              className="h-9 w-9 p-0"
            >
              <Bold className="size-4" />
            </Button>
            <Button
              type="button"
              variant={layer.italic ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ italic: !layer.italic })}
              className="h-9 w-9 p-0"
            >
              <Italic className="size-4" />
            </Button>
            <ToggleGroup
              type="single"
              value={layer.align}
              onValueChange={(v) => v && onChange({ align: v as TextAlign })}
              className="ml-auto"
            >
              <ToggleGroupItem value="left" aria-label="Align left">
                <AlignLeft className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Align center">
                <AlignCenter className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Align right">
                <AlignRight className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </Section>

        <Section title="Spacing">
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
        </Section>
      </div>
    )
  }

  if (category === 'color') {
    return (
      <div>
        <Section title="Fill & Texture">
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
                    'flex h-12 items-center justify-center rounded-xl border text-sm font-semibold transition active:scale-95',
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
          <SliderField
            label="Opacity"
            value={layer.opacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ opacity: v })}
          />
        </Section>
      </div>
    )
  }

  if (category === 'effects') {
    return (
      <div>
        <Section title="Stroke">
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
        </Section>

        <Section title="Shadow">
          <ColorField
            label="Shadow color"
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
        </Section>

        <Section title="Highlight">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Background block</Label>
            <Switch
              checked={layer.highlight}
              onCheckedChange={(v) => onChange({ highlight: v })}
            />
          </div>
          {layer.highlight && (
            <ColorField
              label="Highlight color"
              value={layer.highlightColor}
              onChange={(v) => onChange({ highlightColor: v })}
            />
          )}
        </Section>
      </div>
    )
  }

  // transform
  return (
    <div>
      <Section title="Transform & Perspective">
        <SliderField
          label="Rotation"
          value={layer.rotation}
          min={-180}
          max={180}
          suffix="°"
          onChange={(v) => onChange({ rotation: v })}
        />
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
      </Section>

      <Section title="Position">
        <SliderField
          label="Horizontal"
          value={layer.x}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => onChange({ x: v })}
        />
        <SliderField
          label="Vertical"
          value={layer.y}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => onChange({ y: v })}
        />
        <p className="text-xs text-muted-foreground">
          Tip: drag the text on the image to move it, or pinch the corner handle to resize.
        </p>
      </Section>
    </div>
  )
}
