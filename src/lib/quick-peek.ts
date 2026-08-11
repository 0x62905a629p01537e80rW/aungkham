/**
 * "Quick Peek Slider" — while a slider is being scrubbed, fade every floating
 * tool panel out so the canvas is fully visible, then fade back in 800ms after
 * the gesture ends.
 */
const KEY = 'quick-peek-slider'
const CLASS = 'quick-peek'
const HOLD_MS = 100

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

const HOST_SEL = '.glass-panel, .glass-bar, [data-radix-popper-content-wrapper], [data-bottom-sheet]'
let host: HTMLElement | null = null
let keep: HTMLElement | null = null

function clearHost() {
  host?.classList.remove('peek-host')
  keep?.classList.remove('peek-keep')
  host = null
  keep = null
}

/**
 * Fade the panels out (call on every live slider frame).
 * `el` is the slider being dragged — its own panel stays visible.
 */
export function beginPeek(el?: HTMLElement | null) {
  if (typeof document === 'undefined' || !isQuickPeekEnabled()) return
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (el) {
    const nextHost = el.closest<HTMLElement>(HOST_SEL)
    if (nextHost !== host) clearHost()
    if (nextHost) {
      host = nextHost
      nextHost.classList.add('peek-host')
      let child: HTMLElement | null = el
      while (child && child.parentElement !== nextHost) child = child.parentElement
      keep = child
      child?.classList.add('peek-keep')
    }
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
    clearHost()
    return
  }
  timer = setTimeout(() => {
    timer = null
    document.documentElement.classList.remove(CLASS)
    setTimeout(clearHost, 340)
  }, HOLD_MS)
}
