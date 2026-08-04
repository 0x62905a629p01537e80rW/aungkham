/**
 * "My shapes" — shapes designed in the Shape Lab and saved by Pro users so
 * they can be reused later from the Shapes picker.
 */
export interface SavedShape {
  id: string
  name: string
  createdAt: number
  /** SVG path data in a 0..100 viewBox. */
  path: string
  color: string
  outline: boolean
  strokeWidth: number
}

const KEY = 'editor.myShapes.v1'
const listeners = new Set<() => void>()

const EMPTY: SavedShape[] = []
/** Cached snapshot — useSyncExternalStore needs a stable reference. */
let cache: SavedShape[] | null = null

function read(): SavedShape[] {
  if (typeof localStorage === 'undefined') return EMPTY
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as SavedShape[]) : []
    cache = Array.isArray(parsed) ? parsed : EMPTY
  } catch {
    cache = EMPTY
  }
  return cache
}

function write(list: SavedShape[]) {
  cache = list.slice(0, 120)
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* quota / private mode — shapes simply won't persist */
  }
  listeners.forEach((fn) => fn())
}

export function listSavedShapes(): SavedShape[] {
  return read()
}

export function serverSavedShapes(): SavedShape[] {
  return EMPTY
}

export function saveShape(entry: Omit<SavedShape, 'id' | 'createdAt'>): SavedShape {
  const item: SavedShape = {
    ...entry,
    id: `sh_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  }
  write([item, ...read()])
  return item
}

export function deleteSavedShape(id: string) {
  write(read().filter((s) => s.id !== id))
}

export function subscribeSavedShapes(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
