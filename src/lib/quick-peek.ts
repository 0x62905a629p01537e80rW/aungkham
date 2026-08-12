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
let marked: HTMLElement[] = []

function clearHost() {
  for (const el of marked) el.classList.remove('peek-host', 'peek-keep')
  marked = []
}

/**
 * Fade the panels out (call on every live slider frame).
 * `el` is the slider being dragged — every panel on its ancestor chain stays
 * visible, and inside each of those panels only the branch containing the
 * slider is kept.
 */
export function beginPeek(el?: HTMLElement | null) {
  if (typeof document === 'undefined' || !isQuickPeekEnabled()) return
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (el) {
    clearHost()
    let node: HTMLElement | null = el
    let prev: HTMLElement | null = null
    while (node && node !== document.body) {
      if (node.matches(HOST_SEL)) {
        node.classList.add('peek-host')
        marked.push(node)
        if (prev) {
          prev.classList.add('peek-keep')
          marked.push(prev)
        }
      }
      prev = node
      node = node.parentElement
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
