/**
 * Runtime performance helpers.
 *
 * The editor is gesture heavy: dragging, pinch-zoom and slider scrubbing all
 * run at the display refresh rate (up to 120Hz on modern phones). To keep the
 * main thread free we
 *  - coalesce high-frequency pointer updates into a single rAF tick, and
 *  - drop expensive paint work (backdrop blur, big shadows, transitions)
 *    while a gesture is in flight via the `perf-interact` class on <html>.
 */

let interactCount = 0
let releaseTimer: ReturnType<typeof setTimeout> | null = null

export function beginInteraction() {
  if (typeof document === 'undefined') return
  interactCount++
  if (releaseTimer) {
    clearTimeout(releaseTimer)
    releaseTimer = null
  }
  document.documentElement.classList.add('perf-interact')
}

export function endInteraction() {
  if (typeof document === 'undefined') return
  interactCount = Math.max(0, interactCount - 1)
  if (interactCount > 0) return
  if (releaseTimer) clearTimeout(releaseTimer)
  // Small grace period so quick successive gestures don't thrash the
  // compositor by re-creating backdrop-filter layers.
  releaseTimer = setTimeout(() => {
    releaseTimer = null
    if (interactCount === 0) document.documentElement.classList.remove('perf-interact')
  }, 180)
}

/** Keeps the interaction class alive for the duration of a burst of events. */
export function pulseInteraction(ms = 220) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.add('perf-interact')
  if (releaseTimer) clearTimeout(releaseTimer)
  releaseTimer = setTimeout(() => {
    releaseTimer = null
    if (interactCount === 0) document.documentElement.classList.remove('perf-interact')
  }, ms)
}

/**
 * Returns a function that runs `fn` at most once per animation frame with the
 * latest arguments. Pass `minIntervalMs` (e.g. 16) to additionally cap the
 * rate — on 120Hz phones an uncapped rAF loop can double the amount of state
 * updates the WebView has to service while a slider is being dragged.
 */
export function rafThrottle<A extends unknown[]>(fn: (...args: A) => void, minIntervalMs = 0) {
  let frame: number | null = null
  let latest: A | null = null
  let lastRun = 0

  const run = () => {
    frame = null
    if (!latest) return
    if (minIntervalMs > 0) {
      const now = performance.now()
      if (now - lastRun < minIntervalMs) {
        frame = requestAnimationFrame(run)
        return
      }
      lastRun = now
    }
    const args = latest
    latest = null
    fn(...args)
  }

  const throttled = (...args: A) => {
    latest = args
    if (frame != null) return
    frame = requestAnimationFrame(run)
  }

  throttled.cancel = () => {
    if (frame != null) cancelAnimationFrame(frame)
    frame = null
    latest = null
  }

  throttled.flush = () => {
    if (frame != null) cancelAnimationFrame(frame)
    frame = null
    if (!latest) return
    const args = latest
    latest = null
    lastRun = performance.now()
    fn(...args)
  }

  return throttled
}

