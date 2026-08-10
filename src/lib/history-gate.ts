/**
 * History gate.
 *
 * Continuous gestures (dragging a layer, resizing, rotating, stretching,
 * warping, scrubbing a slider) emit dozens of state updates per second. Each
 * of those would otherwise become its own undo step and flood the history
 * list. Components open a gate while a gesture is in flight; the editor holds
 * back history recording until every gate is closed and then records the whole
 * gesture as a single step.
 */

const active = new Set<string>()
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

/** Opens a gate. Calling twice with the same key is a no-op. */
export function beginGesture(key: string) {
  if (active.has(key)) return
  active.add(key)
}

/** Closes a gate; when the last one closes, subscribers are notified. */
export function endGesture(key: string) {
  if (!active.delete(key)) return
  if (active.size === 0) notify()
}

/** Emergency release — used when a pointer stream dies without an up event. */
export function endAllGestures() {
  if (active.size === 0) return
  active.clear()
  notify()
}

export function isGestureActive() {
  return active.size > 0
}

/** Subscribe to "all gestures finished" events. */
export function onGestureEnd(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

if (typeof window !== 'undefined') {
  // A cancelled or lost pointer must never leave history permanently muted.
  const release = () => endAllGestures()
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', release)
  window.addEventListener('blur', release)
}
