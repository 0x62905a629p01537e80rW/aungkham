import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Minus, Move, SlidersHorizontal } from 'lucide-react'
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
export function usePanelCollapse(open?: boolean) {
  const [collapsed, setCollapsed] = useState(false)
  const [full, setFull] = useState(false)

  const reset = useCallback(() => {
    setCollapsed(false)
    setFull(false)
  }, [])

  // Any panel closing (including a tap outside) snaps every panel back.
  useEffect(() => {
    resetters.add(reset)
    return () => {
      resetters.delete(reset)
      reset()
    }
  }, [reset])

  useEffect(() => {
    if (open === false) reset()
  }, [open, reset])

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
    /** Apply to the panel container: fullscreen, or fully hidden when collapsed. */
    fullClass: collapsed
      ? 'pointer-events-none !opacity-0'
      : full
        ? 'panel-fullscreen !fixed !inset-0 !left-0 !top-0 z-[70] !m-0 !h-[100dvh] !max-h-none !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none overflow-y-auto perf-scroll'
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


/**
 * "Hide tools" button: tucks the whole panel away and drops a floating
 * "Show tools" pill at the bottom of the screen to bring it back.
 */
export function PanelHideButton({
  collapsed,
  onToggle,
  className,
}: {
  collapsed: boolean
  onToggle: () => void
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Show tools' : 'Hide tools'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Show tools' : 'Hide tools'}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95',
          className,
        )}
      >
        {collapsed ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {mounted && collapsed
        ? createPortal(
            <button
              type="button"
              onClick={onToggle}
              className="fixed inset-x-3 bottom-3 z-[80] flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/90 px-4 py-3 text-sm font-semibold text-foreground shadow-2xl backdrop-blur-xl transition active:scale-[0.98]"
              style={{ marginBottom: 'var(--safe-bottom)' }}
            >
              <SlidersHorizontal className="size-4" />
              Show tools
            </button>,
            document.body,
          )
        : null}
    </>
  )
}


/**
 * Lets a floating panel (bottom sheet, tool bar, dialog) be dragged out of the
 * way so the user can see the part of the canvas it covers while editing.
 */
export function usePanelDrag(open?: boolean) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const start = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)
  /** Where the drag handle sits with a zero offset — used to clamp on screen. */
  const home = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      start.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y }
      const r = e.currentTarget.getBoundingClientRect()
      home.current = { x: r.left - offset.x, y: r.top - offset.y, w: r.width, h: r.height }
    },
    [offset.x, offset.y],
  )

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const s = start.current
    if (!s) return
    let x = s.ox + (e.clientX - s.px)
    let y = s.oy + (e.clientY - s.py)
    // Keep the handle itself fully on screen so the panel can always be dragged back.
    const h = home.current
    if (h) {
      const pad = 4
      x = Math.min(Math.max(x, pad - h.x), window.innerWidth - h.w - pad - h.x)
      y = Math.min(Math.max(y, pad - h.y), window.innerHeight - h.h - pad - h.y)
    }
    setOffset({ x, y })
  }, [])


  const onPointerUp = useCallback((e: PointerEvent<HTMLElement>) => {
    start.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  // Use the standalone `translate` property (not `transform`): panel entrance
  // animations and Tailwind translate utilities animate `transform`, which
  // would otherwise override the inline drag offset and make dragging look dead.
  const style: CSSProperties =
    offset.x || offset.y ? ({ translate: `${offset.x}px ${offset.y}px` } as CSSProperties) : {}


  const handleProps = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }

  const reset = useCallback(() => setOffset({ x: 0, y: 0 }), [])

  // Register so any panel close snaps every panel back to its home position.
  useEffect(() => {
    resetters.add(reset)
    return () => {
      resetters.delete(reset)
      reset()
    }
  }, [reset])

  // Closing by tapping outside (or any other route) also snaps it home.
  useEffect(() => {
    if (open === false) reset()
  }, [open, reset])

  return { style, handleProps, moved: !!(offset.x || offset.y), reset }
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
      onClick={() => {
        resetAllPanels()
        onClick()
      }}
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
