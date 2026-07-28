import { ArrowLeft, ArrowRight, Grid3x3, Layers, Redo2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PremiumBadge } from './premium-badge'
import { LayersList } from './layers-list'
import { cn } from '@/lib/utils'
import type { TextLayer } from '@/lib/text-layer'

interface EditorHeaderProps {
  hasImage: boolean
  onNewImage: () => void
  onNext?: () => void
  showGrid?: boolean
  onToggleGrid?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  layers?: TextLayer[]
  selectedId?: string | null
  onSelectLayer?: (id: string) => void
  onAddLayer?: () => void
  onDuplicateLayer?: (id: string) => void
  onDeleteLayer?: (id: string) => void
  onToggleLayerVisibility?: (id: string) => void
  onMoveLayer?: (id: string, dir: 'front' | 'back') => void
}

export function EditorHeader({
  hasImage,
  onNewImage,
  onNext,
  showGrid = false,
  onToggleGrid,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  layers = [],
  selectedId = null,
  onSelectLayer,
  onAddLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onToggleLayerVisibility,
  onMoveLayer,
}: EditorHeaderProps) {
  return (
    <header
      className="glass-bar sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/40 px-2"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {hasImage ? (
        <div className="flex w-full items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to home"
            onClick={onNewImage}
            className="size-9 rounded-full"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle grid"
            onClick={onToggleGrid}
            className={cn('size-9 rounded-full', showGrid && 'bg-accent text-accent-foreground')}
          >
            <Grid3x3 className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Undo"
            onClick={onUndo}
            disabled={!canUndo}
            className="size-9 rounded-full"
          >
            <Undo2 className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Redo"
            onClick={onRedo}
            disabled={!canRedo}
            className="size-9 rounded-full"
          >
            <Redo2 className="size-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Layers" className="size-9 rounded-full">
                <Layers className="size-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={10}
              collisionPadding={12}
              className="glass-panel max-h-[65dvh] w-[min(92vw,320px)] overflow-y-auto rounded-3xl p-0"
            >
              <LayersList
                layers={layers}
                selectedId={selectedId}
                onSelect={(id) => onSelectLayer?.(id)}
                onAdd={() => onAddLayer?.()}
                onDuplicate={(id) => onDuplicateLayer?.(id)}
                onDelete={(id) => onDeleteLayer?.(id)}
                onToggleVisibility={onToggleLayerVisibility}
                onMove={onMoveLayer}
              />
            </PopoverContent>
          </Popover>

          <Button
            size="icon"
            aria-label="Next"
            onClick={onNext}
            className="size-9 rounded-full"
          >
            <ArrowRight className="size-5" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 pl-1">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <span className="font-brand-mm text-[15px] leading-none">မြန်</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Myan</p>
              <p className="text-[11px] text-muted-foreground">Add Text On Photo</p>
            </div>
          </div>
          <PremiumBadge />
        </>
      )}
    </header>
  )
}
