import { ArrowLeft, ImageUp, Layers, Loader2, Save, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PremiumBadge } from './premium-badge'
import { LayersList } from './layers-list'
import type { TextLayer } from '@/lib/text-layer'

interface EditorHeaderProps {
  hasImage: boolean
  exporting: boolean
  onNewImage: () => void
  onDownload: () => void
  onReplaceImage?: () => void
  onSaveProject?: () => void
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
  exporting,
  onNewImage,
  onDownload,
  onReplaceImage,
  onSaveProject,
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
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-3 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {hasImage ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to home"
            onClick={onNewImage}
            className="size-9 rounded-full"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              aria-label="Replace image"
              onClick={onReplaceImage}
              className="size-9 rounded-full"
            >
              <ImageUp className="size-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Layers"
                  className="size-9 rounded-full"
                >
                  <Layers className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="end"
                sideOffset={10}
                collisionPadding={12}
                className="max-h-[65dvh] w-[min(92vw,320px)] overflow-y-auto rounded-2xl border-border/40 bg-popover/70 p-0 shadow-2xl backdrop-blur-2xl"
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
              variant="outline"
              size="icon"
              aria-label="Save project"
              onClick={onSaveProject}
              className="size-9 rounded-full"
            >
              <FolderPlus className="size-4" />
            </Button>
            <Button
              size="icon"
              aria-label="Save image"
              onClick={onDownload}
              disabled={exporting}
              className="size-9 rounded-full"
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <span className="font-brand-mm text-[15px] leading-none">မြန်</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">
                Text on <span className="text-primary">Photo</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Native photo text editor</p>
            </div>
          </div>
          <PremiumBadge />
        </>
      )}
    </header>
  )
}
