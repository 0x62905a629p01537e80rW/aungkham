import { ArrowLeft, ArrowRight, Grid3x3, Layers, Plus, Redo2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PremiumBadge } from './premium-badge'
import { SettingsSheet } from './settings-sheet'
import { ThemeToggle } from '@/components/theme-provider'
import { useI18n } from '@/components/i18n'
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
  onToggleLayerLock?: (id: string) => void
  onReorderLayers?: (from: number, to: number) => void
  onMoveLayer?: (id: string, dir: 'front' | 'back') => void
  onGroupLayers?: (ids: string[]) => void
  onUngroupLayer?: (id: string) => void
  onInsert?: () => void
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
  onToggleLayerLock,
  onReorderLayers,
  onMoveLayer,
  onGroupLayers,
  onUngroupLayer,
  onInsert,
}: EditorHeaderProps) {
  const { t } = useI18n()
  const iconBtn =
    'size-9 rounded-full text-foreground/80 transition hover:text-foreground active:scale-95'
  return (
    <header
      className="glass-bar sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/40 px-2"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {hasImage ? (
        <div className="flex w-full items-center justify-between gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to home"
            onClick={onNewImage}
            className={cn(iconBtn, 'glass-tile')}
          >
            <ArrowLeft className="size-5" />
          </Button>

          {/* Glass cluster of editing controls */}
          <div className="glass-tile flex items-center gap-0.5 rounded-full px-1 py-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle grid"
              onClick={onToggleGrid}
              className={cn(iconBtn, showGrid && 'bg-primary/15 text-primary')}
            >
              <Grid3x3 className="size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Undo"
              onClick={onUndo}
              disabled={!canUndo}
              className={iconBtn}
            >
              <Undo2 className="size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Add element"
              onClick={onInsert}
              className={cn(iconBtn, 'text-primary')}
            >
              <Plus className="size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Redo"
              onClick={onRedo}
              disabled={!canRedo}
              className={iconBtn}
            >
              <Redo2 className="size-5" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Layers" className={iconBtn}>
                  <Layers className="size-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="end"
                sideOffset={10}
                collisionPadding={12}
                className="glass-panel border-0 bg-transparent shadow-none max-h-[65dvh] w-[min(92vw,320px)] overflow-y-auto perf-scroll rounded-3xl p-0"
              >
                <LayersList
                  layers={layers}
                  selectedId={selectedId}
                  onSelect={(id) => onSelectLayer?.(id)}
                  onAdd={() => onAddLayer?.()}
                  onDuplicate={(id) => onDuplicateLayer?.(id)}
                  onDelete={(id) => onDeleteLayer?.(id)}
                  onToggleVisibility={onToggleLayerVisibility}
                  onToggleLock={onToggleLayerLock}
                  onReorder={onReorderLayers}
                  onMove={onMoveLayer}
                  onGroup={onGroupLayers}
                  onUngroup={onUngroupLayer}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            size="icon"
            aria-label="Next"
            onClick={onNext}
            className="size-9 rounded-full text-primary-foreground transition active:scale-95"
            style={{
              background:
                'linear-gradient(150deg, var(--primary), color-mix(in oklab, var(--primary) 65%, white))',
              boxShadow:
                'inset 0 1px 0 var(--glass-rim), 0 10px 22px -12px color-mix(in oklab, var(--primary) 80%, transparent)',
            }}
          >
            <ArrowRight className="size-5" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 pl-1">
            <div
              className="flex size-9 items-center justify-center rounded-2xl text-primary-foreground"
              style={{
                background:
                  'linear-gradient(150deg, var(--primary), color-mix(in oklab, var(--primary) 62%, white))',
                boxShadow:
                  'inset 0 1px 0 var(--glass-rim), 0 10px 22px -14px color-mix(in oklab, var(--primary) 80%, transparent)',
              }}
            >
              <span className="font-brand-mm text-[15px] leading-none">မြန်</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Myan</p>
              <p className="text-[11px] text-muted-foreground">{t('brand.tagline')}</p>
            </div>
          </div>
          <div className="glass-tile flex items-center gap-1 rounded-full p-1">
            <PremiumBadge />
            <ThemeToggle className="size-9 rounded-full text-foreground/80 hover:text-foreground" />
            <SettingsSheet />
          </div>
        </>
      )}
    </header>
  )
}

