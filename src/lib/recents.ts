const RECENT_FONTS_KEY = 'myan.recentFonts'
const RECENT_COLORS_KEY = 'myan.recentColors'

const listeners = new Set<() => void>()

export function subscribeRecents(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function read(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as string[]).filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function push(key: string, value: string, max: number) {
  if (typeof window === 'undefined' || !value) return
  const next = [value, ...read(key).filter((x) => x !== value)].slice(0, max)
  try {
    window.localStorage.setItem(key, JSON.stringify(next))
  } catch {
    /* quota */
  }
  emit()
}

/* ---------- fonts ---------- */

export function listRecentFonts(): string[] {
  return read(RECENT_FONTS_KEY)
}

export function recordRecentFont(key: string) {
  push(RECENT_FONTS_KEY, key, 24)
}

/* ---------- colors ---------- */

export function listRecentColors(): string[] {
  return read(RECENT_COLORS_KEY)
}

export function recordRecentColor(color: string) {
  const c = color?.trim()
  if (!c) return
  push(RECENT_COLORS_KEY, c, 20)
}
