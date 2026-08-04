import type { LayerStyle } from '@/lib/style-clipboard'

/**
 * "My styles" — user-saved text looks, persisted locally so they survive
 * reloads and can be re-applied to any text layer later.
 */
export interface SavedStyle {
  id: string
  name: string
  /** Sample text shown on the preview tile. */
  sample: string
  createdAt: number
  style: LayerStyle
}

const KEY = 'editor.myStyles.v1'
const listeners = new Set<() => void>()

const EMPTY: SavedStyle[] = []
/**
 * Cached snapshot. useSyncExternalStore requires a stable reference between
 * reads — parsing localStorage on every call returns a new array and throws
 * "getSnapshot should be cached", which crashes the Style panel.
 */
let cache: SavedStyle[] | null = null

function read(): SavedStyle[] {
  if (typeof localStorage === 'undefined') return EMPTY
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as SavedStyle[]) : []
    cache = Array.isArray(parsed) ? parsed : EMPTY
  } catch {
    cache = EMPTY
  }
  return cache
}

function write(list: SavedStyle[]) {
  cache = list.slice(0, 60)
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* quota / private mode — styles simply won't persist */
  }
  listeners.forEach((fn) => fn())
}

export function listSavedStyles(): SavedStyle[] {
  return read()
}

export function serverSavedStyles(): SavedStyle[] {
  return EMPTY
}


export function saveStyle(entry: Omit<SavedStyle, 'id' | 'createdAt'>): SavedStyle {
  const item: SavedStyle = {
    ...entry,
    id: `st_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  }
  write([item, ...read()])
  return item
}

export function deleteSavedStyle(id: string) {
  write(read().filter((s) => s.id !== id))
}

export function renameSavedStyle(id: string, name: string) {
  write(read().map((s) => (s.id === id ? { ...s, name } : s)))
}

export function subscribeSavedStyles(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
