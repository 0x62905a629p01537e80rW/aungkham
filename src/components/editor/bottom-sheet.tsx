import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PanelCloseButton, PanelMoveHandle, usePanelDrag } from './panel-drag'

interface BottomSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const panel = usePanelDrag()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[60dvh] w-full max-w-2xl flex-col rounded-t-3xl border border-white/20 shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{
          ...(open ? panel.style : {}),
          paddingBottom: 'env(safe-area-inset-bottom)',
          backgroundColor: 'color-mix(in oklab, var(--card) 55%, transparent)',
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div className="relative flex items-center justify-between border-b border-white/10 px-5 pb-3 pt-4">
          <div className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-foreground/30" />
          <div className="flex items-center gap-2">
            <PanelMoveHandle handleProps={panel.handleProps} moved={panel.moved} onReset={panel.reset} />
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <PanelCloseButton onClick={onClose} />
        </div>
        <div className="overflow-y-auto perf-scroll overscroll-contain">{children}</div>
      </div>
    </>
  )
}
