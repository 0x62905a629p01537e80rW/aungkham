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

function read(): SavedStyle[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as SavedStyle[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(list: SavedStyle[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 60)))
  } catch {
    /* quota / private mode — styles simply won't persist */
  }
  listeners.forEach((fn) => fn())
}

export function listSavedStyles(): SavedStyle[] {
  return read()
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
