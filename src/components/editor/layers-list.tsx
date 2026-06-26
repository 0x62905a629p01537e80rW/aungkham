import { Copy, Plus, Trash2, Type } from 'lucide-react'
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
}

export function LayersList({
  layers,
  selectedId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
}: LayersListProps) {
  return (
    <div className="space-y-3 px-5 py-5">
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
        {layers.map((layer) => {
          const active = layer.id === selectedId
          return (
            <div
              key={layer.id}
              onClick={() => onSelect(layer.id)}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 transition',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted',
              )}
            >
              <Type
                className={cn(
                  'size-4 shrink-0',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <span
                className="flex-1 truncate text-sm"
                style={{ fontFamily: fontFamily(layer.fontKey) }}
              >
                {layer.text || 'Empty layer'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(layer.id)
                }}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground"
                aria-label="Duplicate layer"
              >
                <Copy className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(layer.id)
                }}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete layer"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
