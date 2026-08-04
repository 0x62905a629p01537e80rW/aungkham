import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { ChevronDown, ChevronUp, Minus, Move } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Collapse state for a panel: keeps the header bar, hides the body. */
export function usePanelCollapse() {
  const [collapsed, setCollapsed] = useState(false)
  return { collapsed, toggle: () => setCollapsed((v) => !v), setCollapsed }
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
