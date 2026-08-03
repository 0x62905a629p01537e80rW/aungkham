import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Grid3x3, History, Layers, Plus, Redo2, Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PremiumBadge } from './premium-badge'
import { SettingsSheet } from './settings-sheet'
import { ThemeToggle } from '@/components/theme-provider'
import { useI18n } from '@/components/i18n'
import { LayersList } from './layers-list'
import { cn } from '@/lib/utils'
import type { TextLayer } from '@/lib/text-layer'
import appLogo from '@/assets/logo.png.asset.json'

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
  onHistory?: () => void
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
  onExportTemplate?: () => void
  onSaveProject?: () => void
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
  onHistory,
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
  onExportTemplate,
  onSaveProject,
}: EditorHeaderProps) {
  const { t } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [subview, setSubview] = useState(false)
  useEffect(() => {
    const onScroll = (e: Event) => setScrolled(!!(e as CustomEvent<boolean>).detail)
    const onSub = (e: Event) => setSubview(!!(e as CustomEvent<boolean>).detail)
    window.addEventListener('home-scroll', onScroll as EventListener)
    window.addEventListener('home-subview', onSub as EventListener)
    return () => {
      window.removeEventListener('home-scroll', onScroll as EventListener)
      window.removeEventListener('home-subview', onSub as EventListener)
    }
  }, [])
  const transparent = !hasImage && !scrolled
  if (!hasImage && subview) return null

  const iconBtn =
    'size-9 rounded-lg text-foreground/75 transition-colors hover:bg-accent hover:text-foreground active:scale-95'
  return (
    <header
      className={cn(
        'z-30 flex h-14 items-center justify-between px-2 transition-colors duration-200',
        hasImage ? 'sticky top-0' : 'absolute inset-x-0 top-0',
        transparent
          ? 'border-b border-transparent bg-transparent'
          : 'glass-bar border-b border-border/70',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >


      {hasImage ? (
        <div className="flex w-full items-center justify-between gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to home"
            onClick={onNewImage}
            className={iconBtn}
          >
            <ArrowLeft className="size-5" />
          </Button>

          {/* Editing controls */}
          <div className="flex items-center gap-0.5 rounded-xl bg-secondary/70 px-1 py-1">

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

            {onHistory && (canUndo || canRedo) && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="History"
                onClick={onHistory}
                className={iconBtn}
              >
                <History className="size-5" />
              </Button>
            )}

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
                className="glass-panel max-h-[65dvh] w-[min(92vw,320px)] overflow-y-auto perf-scroll rounded-2xl p-0"
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
                  onSaveProject={onSaveProject}
                  onExportJson={onExportTemplate}
                />
              </PopoverContent>
            </Popover>
          </div>


          <Button
            size="icon"
            aria-label="Next"
            onClick={onNext}
            className="size-9 rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90 active:scale-95"
          >
            <ArrowRight className="size-5" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 pl-1">
            <img
              src={appLogo.url}
              alt="Myan app logo"
              className="size-9 shrink-0 object-contain"
            />
            <div className="leading-tight">
              <p className="font-display text-sm font-bold tracking-tight">Myan</p>
              <p className="text-[11px] text-muted-foreground">{t('brand.tagline')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <PremiumBadge />
            <ThemeToggle className="size-9 rounded-lg text-foreground/75 hover:bg-accent hover:text-foreground" />
            <SettingsSheet />
          </div>
        </>
      )}

    </header>
  )
}

