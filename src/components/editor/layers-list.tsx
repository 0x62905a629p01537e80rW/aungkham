import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  LockOpen,
  Plus,
  Trash2,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fontFamily, type TextLayer } from '@/lib/text-layer'

interface LayersListProps {
  layers: TextLayer[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onToggleVisibility?: (id: string) => void
  onToggleLock?: (id: string) => void
  onMove?: (id: string, dir: 'front' | 'back') => void
  onReorder?: (from: number, to: number) => void
}

const ROW_H = 64

export function LayersList({
  layers,
  selectedId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onToggleLock,
  onMove,
  onReorder,
}: LayersListProps) {
  const [drag, setDrag] = useState<{ index: number; dy: number } | null>(null)
  const dragRef = useRef<{ index: number; startY: number } | null>(null)

  function startDrag(e: ReactPointerEvent, index: number) {
    e.stopPropagation()
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { index, startY: e.clientY }
    setDrag({ index, dy: 0 })
  }

  function moveDrag(e: ReactPointerEvent) {
    const st = dragRef.current
    if (!st) return
    setDrag({ index: st.index, dy: e.clientY - st.startY })
  }

  function endDrag(e: ReactPointerEvent) {
    const st = dragRef.current
    dragRef.current = null
    if (!st) return
    const steps = Math.round((e.clientY - st.startY) / ROW_H)
    setDrag(null)
    if (!steps) return
    const to = Math.max(0, Math.min(layers.length - 1, st.index + steps))
    if (to !== st.index) onReorder?.(st.index, to)
  }

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Text Layers
        </h3>
        <Button size="sm" variant="outline" onClick={onAdd} className="h-8 gap-1.5 rounded-full">
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      <div className="space-y-1.5">
        {layers.length === 0 && (
          <p className="rounded-xl bg-muted/60 px-3 py-4 text-center text-xs text-muted-foreground">
            No layers yet — tap “Add”.
          </p>
        )}
        {layers.map((layer, index) => {
          const active = layer.id === selectedId
          const dragging = drag?.index === index
          return (
            <div
              key={layer.id}
              onClick={() => onSelect(layer.id)}
              style={
                dragging
                  ? { transform: `translateY(${drag!.dy}px)`, zIndex: 20, position: 'relative' }
                  : undefined
              }
              className={cn(
                'cursor-pointer rounded-xl border px-3 py-2 transition',
                dragging && 'shadow-lg transition-none',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted',
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-label="Drag to reorder"
                  onPointerDown={(e) => startDrag(e, index)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onClick={(e) => e.stopPropagation()}
                  className="-ml-1 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
                >
                  <GripVertical className="size-4" />
                </span>
                <Type
                  className={cn(
                    'size-4 shrink-0',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span
                  className={cn('flex-1 truncate text-sm', layer.hidden && 'opacity-40')}
                  style={{ fontFamily: fontFamily(layer.fontKey) }}
                >
                  {layer.text || 'Empty layer'}
                </span>
                {layer.locked && <Lock className="size-3.5 shrink-0 text-primary" />}
              </div>

              <div className="mt-1.5 flex items-center justify-end gap-1">
                <IconBtn
                  label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  onClick={() => onToggleLock?.(layer.id)}
                >
                  {layer.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
                </IconBtn>
                <IconBtn
                  label={layer.hidden ? 'Show layer' : 'Hide layer'}
                  onClick={() => onToggleVisibility?.(layer.id)}
                >
                  {layer.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </IconBtn>
                <IconBtn label="Bring to front" onClick={() => onMove?.(layer.id, 'front')}>
                  <ArrowUpToLine className="size-3.5" />
                </IconBtn>
                <IconBtn label="Send to back" onClick={() => onMove?.(layer.id, 'back')}>
                  <ArrowDownToLine className="size-3.5" />
                </IconBtn>
                <IconBtn label="Duplicate layer" onClick={() => onDuplicate(layer.id)}>
                  <Copy className="size-3.5" />
                </IconBtn>
                <IconBtn
                  label="Delete layer"
                  danger
                  onClick={() => onDelete(layer.id)}
                >
                  <Trash2 className="size-3.5" />
                </IconBtn>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'flex size-7 items-center justify-center rounded-full text-muted-foreground transition',
        danger ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-background hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
