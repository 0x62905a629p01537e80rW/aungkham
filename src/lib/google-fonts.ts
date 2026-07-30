import catalog from './google-fonts-catalog.json'

export interface GoogleFontMeta {
  /** family name */
  f: string
  /** category */
  c: string
  /** popularity rank */
  p: number
  /** available weights */
  w: number[]
  /** notable subsets */
  s: string[]
}

export const GOOGLE_FONTS = catalog as GoogleFontMeta[]

export function googleFontKey(family: string) {
  return `gf:${family}`
}

export function googleFamilyFromKey(key: string) {
  return key.startsWith('gf:') ? key.slice(3) : null
}

export function googleCssFamily(family: string) {
  return `GF_${family.replace(/[^A-Za-z0-9]+/g, '_')}`
}

/* ---------------- offline storage (IndexedDB) ---------------- */

const DB_NAME = 'myan-gfonts'
const STORE = 'files'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key: string): Promise<ArrayBuffer | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as ArrayBuffer | undefined)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: ArrayBuffer) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbDel(key: string) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ---------------- installed index (localStorage) ---------------- */

const KEY = 'myan.googleFonts'

const listeners = new Set<() => void>()
export function subscribeGoogleFonts(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
function emit() {
  listeners.forEach((l) => l())
}

export function listInstalledGoogleFonts(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]') as string[]
  } catch {
    return []
  }
}

function writeInstalled(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  emit()
}

export function isGoogleFontInstalled(family: string) {
  return listInstalledGoogleFonts().includes(family)
}

/* ---------------- download + register ---------------- */

const loaded = new Set<string>()
const inflight = new Map<string, Promise<void>>()

async function registerBuffer(family: string, buf: ArrayBuffer) {
  const face = new FontFace(googleCssFamily(family), buf)
  const f = await face.load()
  document.fonts.add(f)
  loaded.add(family)
  emit()
}

async function fetchFontFile(family: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400&display=swap`
  const css = await fetch(url).then((r) => {
    if (!r.ok) throw new Error('css failed')
    return r.text()
  })

  // css2 returns one @font-face per unicode subset (cyrillic, greek, latin…).
  // Pick the block that actually covers the glyphs we render, otherwise the
  // installed file has no letters and the text silently falls back.
  const blocks = css.split('@font-face').slice(1)
  let best: { url: string; score: number } | null = null
  for (const block of blocks) {
    const m =
      block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/) ||
      block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)
    if (!m) continue
    const range = block.match(/unicode-range:([^;]+);/)?.[1] ?? ''
    let score = 1
    if (/U\+1000/i.test(range)) score = 3 // Myanmar
    else if (/U\+0000|U\+0-00FF|U\+0041|U\+0100/i.test(range)) score = 2 // latin
    if (!best || score > best.score) best = { url: m[1], score }
  }
  if (!best) throw new Error('no font file found')
  const res = await fetch(best.url)
  if (!res.ok) throw new Error('download failed')
  return res.arrayBuffer()
}

/** Cache key — bumped when the download logic changes so stale files refetch. */
function cacheKey(family: string) {
  return `v2:${family}`
}

/** Download a Google font and keep it in the app for offline use. */
export async function installGoogleFont(family: string): Promise<void> {
  if (loaded.has(family)) return
  const existing = inflight.get(family)
  if (existing) return existing
  const task = (async () => {
    let buf = await idbGet(cacheKey(family)).catch(() => undefined)
    if (!buf) {
      buf = await fetchFontFile(family)
      await idbSet(cacheKey(family), buf).catch(() => {})
      await idbDel(family).catch(() => {})
    }
    await registerBuffer(family, buf)
    const list = listInstalledGoogleFonts()
    if (!list.includes(family)) writeInstalled([...list, family])
  })()
  inflight.set(family, task)
  try {
    await task
  } finally {
    inflight.delete(family)
  }
}

export async function removeGoogleFont(family: string) {
  await idbDel(cacheKey(family)).catch(() => {})
  await idbDel(family).catch(() => {})
  loaded.delete(family)
  writeInstalled(listInstalledGoogleFonts().filter((f) => f !== family))
}

/** Re-register every previously downloaded font at app start (works offline). */
export async function ensureGoogleFontsLoaded() {
  if (typeof window === 'undefined' || !('FontFace' in window)) return
  const installedList = listInstalledGoogleFonts()
  // Web preview so downloaded fonts always render, even before registration.
  preloadGoogleFontPreview(installedList)
  for (const family of installedList) {
    if (loaded.has(family)) continue
    try {
      const buf = await idbGet(cacheKey(family))
      if (buf) await registerBuffer(family, buf)
      else await installGoogleFont(family).catch(() => {})
    } catch {
      /* ignore */
    }
  }
}


/** true once the family is usable for rendering/export */
export function isGoogleFontReady(family: string) {
  return loaded.has(family)
}

/* ---------------- lightweight preview (no download/install) ---------------- */

const previewLinks = new Set<string>()

/**
 * Loads families through the Google Fonts CSS API purely so the picker can show
 * a live sample. Nothing is stored — installing is still an explicit action.
 */
export function preloadGoogleFontPreview(families: string[], weight = 400) {
  if (typeof document === 'undefined' || families.length === 0) return
  const pending = families.filter((f) => !previewLinks.has(`${f}@${weight}`))
  if (pending.length === 0) return
  pending.forEach((f) => previewLinks.add(`${f}@${weight}`))

  for (let i = 0; i < pending.length; i += 12) {
    const batch = pending.slice(i, i + 12)
    const q = batch
      .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@${weight}`)
      .join('&')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${q}&display=swap`
    document.head.appendChild(link)
  }
}

/** Nearest supported weight for a family. */
export function nearestWeight(available: number[], want: number) {
  if (!available || available.length === 0) return 400
  return available.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a))
}
