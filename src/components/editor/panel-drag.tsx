import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Minus, Move } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Every mounted panel registers its reset so closing snaps panels home again. */
const resetters = new Set<() => void>()
function resetAllPanels() {
  resetters.forEach((fn) => fn())
}

/**
 * Collapse + fullscreen state for a panel: keeps the header bar, hides the body,
 * or expands the whole panel to fill the screen.
 */
export function usePanelCollapse() {
  const [collapsed, setCollapsed] = useState(false)
  const [full, setFull] = useState(false)
  return {
    collapsed,
    toggle: () => setCollapsed((v) => !v),
    setCollapsed,
    full,
    toggleFull: () =>
      setFull((v) => {
        if (!v) setCollapsed(false)
        return !v
      }),
    setFull,
    /** Apply to the panel container to make it cover the screen. */
    fullClass: full
      ? 'fixed inset-0 z-[70] !m-0 !h-auto !max-h-none !w-auto !max-w-none !translate-x-0 !translate-y-0 !rounded-none overflow-y-auto perf-scroll'
      : '',
  }
}

/** Expands the panel to fill the screen (and back again). */
export function PanelFullscreenButton({
  full,
  onToggle,
  className,
}: {
  full: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={full ? 'Exit full screen' : 'Full screen'}
      aria-pressed={full}
      title={full ? 'Exit full screen' : 'Full screen'}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95',
        className,
      )}
    >
      {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
    </button>
  )
}

/** Chevron button that hides/shows the panel body, sits before the close button. */
export function PanelHideButton({
  collapsed,
  onToggle,
  className,
}: {
  collapsed: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? 'Show panel' : 'Hide panel'}
      aria-expanded={!collapsed}
      title={collapsed ? 'Show panel' : 'Hide panel'}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95',
        className,
      )}
    >
      {collapsed ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
    </button>
  )
}

/**
 * Lets a floating panel (bottom sheet, tool bar, dialog) be dragged out of the
 * way so the user can see the part of the canvas it covers while editing.
 */
export function usePanelDrag() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const start = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      start.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y }
    },
    [offset.x, offset.y],
  )

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const s = start.current
    if (!s) return
    setOffset({ x: s.ox + (e.clientX - s.px), y: s.oy + (e.clientY - s.py) })
  }, [])

  const onPointerUp = useCallback((e: PointerEvent<HTMLElement>) => {
    start.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  const style: CSSProperties =
    offset.x || offset.y ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` } : {}

  const handleProps = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }

  return { style, handleProps, moved: !!(offset.x || offset.y), reset: () => setOffset({ x: 0, y: 0 }) }
}

interface MoveHandleProps {
  handleProps: ReturnType<typeof usePanelDrag>['handleProps']
  moved?: boolean
  onReset?: () => void
  className?: string
}

/** Grab button that drags the panel it belongs to; double-tap snaps it back. */
export function PanelMoveHandle({ handleProps, moved, onReset, className }: MoveHandleProps) {
  return (
    <button
      type="button"
      aria-label={moved ? 'Move panel (double tap to reset)' : 'Move panel'}
      title="Drag to move this panel"
      onDoubleClick={onReset}
      {...handleProps}
      className={cn(
        'flex size-8 cursor-grab touch-none items-center justify-center rounded-full text-muted-foreground transition active:scale-95 active:cursor-grabbing',
        moved ? 'bg-primary/20 text-primary' : 'bg-muted',
        className,
      )}
    >
      <Move className="size-4" />
    </button>
  )
}

/** Window-style close control (a minus bar) used on every floating panel. */
export function PanelCloseButton({
  onClick,
  label = 'Close',
  className,
}: {
  onClick: () => void
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95',
        className,
      )}
    >
      <Minus className="size-4" />
    </button>
  )
}
