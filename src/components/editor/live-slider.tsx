import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { beginInteraction, endInteraction, rafThrottle } from '@/lib/perf'
import { beginGesture, endGesture } from '@/lib/history-gate'
import { beginPeek, endPeek } from '@/lib/quick-peek'

/**
 * A slider that owns its value while the user is dragging.
 *
 * The thumb position and the numeric read-out live in this tiny component, so
 * scrubbing never re-renders the parent panel, the sibling tools or the canvas
 * wrapper. Live updates are coalesced to one call per frame and capped at
 * ~60fps, and the authoritative (expensive) update fires once on release.
 */
export interface LiveSliderProps {
  value: number
  min: number
  max: number
  step?: number
  /** Cheap preview update while dragging (rAF throttled, <=60fps). */
  onLive?: (v: number) => void
  /** Authoritative update once the gesture ends. */
  onCommit: (v: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  /** Receives the live value for a locally rendered read-out. */
  renderValue?: (v: number) => void
  className?: string
  showValue?: boolean
  formatValue?: (v: number) => string
}

export const LiveSlider = memo(function LiveSlider({
  value,
  min,
  max,
  step = 1,
  onLive,
  onCommit,
  onDragStart,
  onDragEnd,
  className,
  showValue,
  formatValue,
}: LiveSliderProps) {
  const [local, setLocal] = useState(value)
  const dragging = useRef(false)

  // Follow the parent only while idle — never fight the finger.
  useEffect(() => {
    if (!dragging.current) setLocal(value)
  }, [value])

  const liveRef = useRef(onLive)
  liveRef.current = onLive
  const emit = useRef(rafThrottle((v: number) => liveRef.current?.(v), 16)).current

  useEffect(
    () => () => {
      emit.cancel()
      if (dragging.current) {
        dragging.current = false
        endInteraction()
        endGesture('slider')
        endPeek(true)
      }
    },
    [emit],
  )

  const handleChange = useCallback(
    (v: number[]) => {
      if (!dragging.current) {
        dragging.current = true
        beginInteraction()
        beginGesture('slider')
        beginPeek()
        onDragStart?.()
      }
      setLocal(v[0])
      emit(v[0])
    },
    [emit, onDragStart],
  )

  const finish = useCallback(
    (v: number) => {
      emit.cancel()
      if (dragging.current) {
        dragging.current = false
        endInteraction()
        endGesture('slider')
      }
      endPeek()
      onCommit(v)
      onDragEnd?.()
    },
    [emit, onCommit, onDragEnd],
  )

  return (
    <Slider
      className={className}
      value={[local]}
      min={min}
      max={max}
      step={step}
      showValue={showValue}
      formatValue={formatValue}
      onValueChange={handleChange}
      onValueCommit={(v) => finish(v[0])}
    />
  )
})
