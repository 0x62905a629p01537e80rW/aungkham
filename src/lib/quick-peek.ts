/**
 * "Quick Peek Slider" — while a slider is being scrubbed, fade every floating
 * tool panel out so the canvas is fully visible, then fade back in 800ms after
 * the gesture ends.
 */
const KEY = 'quick-peek-slider'
const CLASS = 'quick-peek'
const HOLD_MS = 800

let timer: ReturnType<typeof setTimeout> | null = null

export function isQuickPeekEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setQuickPeekEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (!on) endPeek(true)
}

/** Fade the panels out (call on every live slider frame). */
export function beginPeek() {
  if (typeof document === 'undefined' || !isQuickPeekEnabled()) return
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  document.documentElement.classList.add(CLASS)
}

/** Fade the panels back in after the hold window (or immediately). */
export function endPeek(immediate = false) {
  if (typeof document === 'undefined') return
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (immediate) {
    document.documentElement.classList.remove(CLASS)
    return
  }
  timer = setTimeout(() => {
    timer = null
    document.documentElement.classList.remove(CLASS)
  }, HOLD_MS)
}
