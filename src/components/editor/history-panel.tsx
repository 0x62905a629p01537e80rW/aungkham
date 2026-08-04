import { Check, History } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PanelCloseButton, PanelFullscreenButton, PanelHideButton, PanelMoveHandle, usePanelCollapse, usePanelDrag } from './panel-drag'
import { cn } from '@/lib/utils'

export interface HistoryEntry {
  label: string
  detail: string
}

interface HistoryPanelProps {
  open: boolean
  entries: HistoryEntry[]
  /** index of the state currently on the canvas */
  current: number
  onClose: () => void
  onJump: (index: number) => void
}

/** Jump-to-any-state timeline built on the existing undo/redo stacks. */
export function HistoryPanel({ open, entries, current, onClose, onJump }: HistoryPanelProps) {
  const panel = usePanelDrag()
  const collapse = usePanelCollapse()
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" style={panel.style} className="max-h-[70vh] rounded-t-2xl p-0">
        <SheetHeader className="px-4 pb-2 pt-4">
          <SheetTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <History className="size-4" /> History
            </span>
            <span className="flex items-center gap-1.5">
              <PanelMoveHandle
                handleProps={panel.handleProps}
                moved={panel.moved}
                onReset={panel.reset}
                className="size-7"
              />
              <PanelHideButton collapsed={collapse.collapsed} onToggle={collapse.toggle} className="size-7" />
              <PanelCloseButton onClick={onClose} className="size-7" />
            </span>
          </SheetTitle>
        </SheetHeader>

        <div hidden={collapse.collapsed} className="max-h-[52vh] overflow-y-auto perf-scroll px-3 pb-6">
          {entries.map((e, i) => {
            const active = i === current
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onJump(i)
                  onClose()
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                  active ? 'bg-primary/15 text-primary' : 'hover:bg-muted',
                  i > current && !active && 'opacity-55',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {active ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{e.label}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{e.detail}</span>
                </span>
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
