import {
  ArrowUpRight,
  Check,
  Circle,
  Eraser,
  Highlighter,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Redo2,
  Square,
  Trash2,
  Undo2,
  Waves,
} from 'lucide-react'

import { SliderField } from './control-fields'
import { ColorPickerPopover } from './color-picker'
import { PanelCloseButton, PanelMoveHandle, usePanelDrag } from './panel-drag'
import type { MarkShape, MarkStyle } from '@/lib/marks'
import type { MarkTool } from './mark-layer'
import { cn } from '@/lib/utils'

const SHAPES: { shape: MarkShape; label: string; Icon: typeof Minus }[] = [
  { shape: 'arrow', label: 'Arrow', Icon: ArrowUpRight },
  { shape: 'line', label: 'Line', Icon: Minus },
  { shape: 'wave', label: 'Wave', Icon: Waves },
  { shape: 'dashed', label: 'Dashed', Icon: MoreHorizontal },
  { shape: 'rect', label: 'Box', Icon: Square },
  { shape: 'rectFill', label: 'Filled box', Icon: Square },
  { shape: 'ellipse', label: 'Circle', Icon: Circle },
  { shape: 'ellipseFill', label: 'Filled dot', Icon: Circle },
  { shape: 'highlight', label: 'Highlight', Icon: Highlighter },
]

const SWATCHES = [
  '#ffffff',
  '#000000',
  '#ff2d55',
  '#ff9500',
  '#ffd60a',
  '#34c759',
  '#00c7be',
  '#0a84ff',
  '#5e5ce6',
  '#af52de',
]

interface MarkBarProps {
  style: MarkStyle
  onStyle: (patch: Partial<MarkStyle>) => void
  tool: MarkTool
  onTool: (t: MarkTool) => void
  hasSelection: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onDeleteSelected: () => void
  onCancel: () => void
  onApply: () => void
}

/** Bottom bar for the Mark tool. */
export function MarkBar({
  style,
  onStyle,
  tool,
  onTool,
  hasSelection,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDeleteSelected,
  onCancel,
  onApply,
}: MarkBarProps) {
  const panel = usePanelDrag()
  const iconBtn =
    'flex size-9 items-center justify-center rounded-xl transition active:scale-95 disabled:opacity-35'

  return (
    <div
      className="glass-bar fixed inset-x-0 bottom-0 z-50 max-h-[44dvh] space-y-1.5 overflow-y-auto perf-scroll px-3 pb-3 pt-1.5"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', ...panel.style }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <PanelMoveHandle handleProps={panel.handleProps} moved={panel.moved} onReset={panel.reset} />
          <PanelCloseButton onClick={onCancel} label="Discard and close" />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Select marks"
            className={cn(iconBtn, tool === 'select' && 'bg-primary text-primary-foreground')}
            onClick={() => onTool(tool === 'select' ? 'draw' : 'select')}
          >
            <MousePointer2 className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Erase marks"
            className={cn(iconBtn, tool === 'erase' && 'bg-primary text-primary-foreground')}
            onClick={() => onTool(tool === 'erase' ? 'draw' : 'erase')}
          >
            <Eraser className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Delete selected mark"
            disabled={!hasSelection}
            className={iconBtn}
            onClick={onDeleteSelected}
          >
            <Trash2 className="size-[18px]" />
          </button>
          <button type="button" aria-label="Undo" disabled={!canUndo} className={iconBtn} onClick={onUndo}>
            <Undo2 className="size-[18px]" />
          </button>
          <button type="button" aria-label="Redo" disabled={!canRedo} className={iconBtn} onClick={onRedo}>
            <Redo2 className="size-[18px]" />
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-95"
          onClick={onApply}
        >
          <Check className="size-4" />
          Done
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {SHAPES.map(({ shape, label, Icon }) => (
          <button
            key={shape}
            type="button"
            aria-label={label}
            onClick={() => {
              onStyle({ shape })
              onTool('draw')
            }}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-xl border px-1 py-1.5 text-[9px] font-medium leading-tight transition active:scale-95',
              tool === 'draw' && style.shape === shape
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground/75',
            )}
          >
            <Icon className={cn('size-[18px]', shape.endsWith('Fill') && 'fill-current')} />
            <span className="w-full truncate">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto perf-scroll pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ColorPickerPopover value={style.color} onChange={(color) => onStyle({ color })}>
          <button
            type="button"
            aria-label="Pick color"
            className="size-7 shrink-0 rounded-full border-2 border-primary"
            style={{ background: style.color }}
          />
        </ColorPickerPopover>
        <span className="mx-0.5 h-6 w-px shrink-0 bg-border" />
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => onStyle({ color: c })}
            className={cn(
              'size-7 shrink-0 rounded-full border transition active:scale-90',
              style.color.toLowerCase() === c ? 'border-primary ring-2 ring-primary/40' : 'border-border',
            )}
            style={{ background: c }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <SliderField label="Size" value={style.size} min={1} max={80} onChange={(v) => onStyle({ size: v })} />
        <SliderField
          label="Opacity"
          value={style.opacity}
          min={5}
          max={100}
          onChange={(v) => onStyle({ opacity: v })}
        />
      </div>
    </div>
  )
}
