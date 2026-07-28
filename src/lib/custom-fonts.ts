export interface CustomFont {
  id: string
  label: string
  dataUrl: string
}

const FONTS_KEY = 'myan.customFonts'
const FAVS_KEY = 'myan.favoriteFonts'

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function subscribeFonts(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota */
  }
}

/* ---------- custom fonts ---------- */

export function customFontFamily(id: string) {
  return `CF_${id}`
}

export function listCustomFonts(): CustomFont[] {
  return read<CustomFont[]>(FONTS_KEY, [])
}

const registered = new Set<string>()

export function ensureCustomFontsLoaded() {
  if (typeof window === 'undefined' || !('FontFace' in window)) return
  for (const f of listCustomFonts()) {
    if (registered.has(f.id)) continue
    registered.add(f.id)
    try {
      const face = new FontFace(customFontFamily(f.id), `url(${f.dataUrl})`)
      face
        .load()
        .then((loaded) => {
          document.fonts.add(loaded)
          emit()
        })
        .catch(() => {
          registered.delete(f.id)
        })
    } catch {
      registered.delete(f.id)
    }
  }
}

export async function addCustomFont(file: File): Promise<CustomFont> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
  const font: CustomFont = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: file.name.replace(/\.[^.]+$/, ''),
    dataUrl,
  }
  write(FONTS_KEY, [...listCustomFonts(), font])
  ensureCustomFontsLoaded()
  emit()
  return font
}

export function removeCustomFont(id: string) {
  write(
    FONTS_KEY,
    listCustomFonts().filter((f) => f.id !== id),
  )
  emit()
}

/* ---------- favorites ---------- */

export function listFavorites(): string[] {
  return read<string[]>(FAVS_KEY, [])
}

export function isFavorite(key: string) {
  return listFavorites().includes(key)
}

export function toggleFavorite(key: string) {
  const favs = listFavorites()
  write(FAVS_KEY, favs.includes(key) ? favs.filter((k) => k !== key) : [...favs, key])
  emit()
}
