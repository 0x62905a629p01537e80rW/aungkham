/**
 * Fonts published at https://cdn.jsdelivr.net/gh/0x62905a629p01537e80rW/0x62905a629p01537e80rW.github.io/Fonts
 * Listed at runtime, downloaded on demand and kept offline in IndexedDB.
 */

export interface RemoteFont {
  /** display name (file name without extension) */
  name: string
  /** file name */
  file: string
  /** absolute download url */
  url: string
  /** bytes, when known */
  size?: number
}

import { cdnBase, cdnFetch, cdnListUrl, ghListUrl } from './cdn-ref'

/** jsDelivr edge CDN, pinned to the newest commit so uploads appear at once */
const base = () => cdnBase('Fonts')
const FONT_RE = /\.(ttf|otf|woff2?)$/i

/* ---------------- free / premium tiers ---------------- */

export type FontTier = 'free' | 'premium'

let tierCache: Record<string, FontTier> | null = null

function tierKey(v: string) {
  return v.trim().toLowerCase()
}

/** Reads check.json → { fonts: { premium: [...], free: [...] } } */
export async function fetchFontTiers(force = false): Promise<Record<string, FontTier>> {
  if (tierCache && !force) return tierCache
  const map: Record<string, FontTier> = {}
  try {
    // Plain cacheable request — jsDelivr serves whatever the repo owner
    // last purged; no cache-busting query, no parallel raw hit.
    const res = await cdnFetch(`${await base()}/check.json`)
    if (res?.ok) {
      const json = (await res.json()) as {
        fonts?: { premium?: string[]; free?: string[] }
        premium?: string[]
        free?: string[]
      }
      const premium = json.fonts?.premium ?? json.premium ?? []
      const free = json.fonts?.free ?? json.free ?? []
      for (const f of free) map[tierKey(f)] = 'free'
      for (const f of premium) map[tierKey(f)] = 'premium'
    }
  } catch {
    /* offline — treat everything as free */
  }
  tierCache = map
  return map
}

/** Tier for a font, matching on file name or display name. */
export function fontTier(
  font: { file: string; name: string },
  tiers: Record<string, FontTier> | null,
): FontTier {
  if (!tiers) return 'free'
  return (
    tiers[tierKey(font.file)] ??
    tiers[tierKey(font.name)] ??
    tiers[tierKey(font.file.replace(FONT_RE, ''))] ??
    'free'
  )
}

export function remoteFontKey(name: string) {
  return `rf:${name}`
}

export function remoteFontNameFromKey(key: string) {
  return key.startsWith('rf:') ? key.slice(3) : null
}

export function remoteCssFamily(name: string) {
  return `RF_${name.replace(/[^A-Za-z0-9]+/g, '_')}`
}

function prettyName(file: string) {
  return file.replace(FONT_RE, '').replace(/[_-]+/g, ' ').trim()
}

/* ---------------- listing ---------------- */

let catalogCache: RemoteFont[] | null = null

export async function fetchRemoteFonts(force = false): Promise<RemoteFont[]> {
  if (catalogCache && !force) return catalogCache
  try {
    catalogCache = await fetchCatalog()
  } catch {
    // CDN unreachable — no catalog available
    catalogCache = []
  }
  return catalogCache
}

async function fetchCatalog(): Promise<RemoteFont[]> {
  const BASE = await base()

  // 1) optional hand-written index
  try {
    const res = await cdnFetch(`${BASE}/fonts.json`)
    if (res.ok) {
      const raw = (await res.json()) as unknown
      const arr = Array.isArray(raw) ? raw : ((raw as { fonts?: unknown[] })?.fonts ?? [])
      const list: RemoteFont[] = (arr as unknown[])
        .map((it) => {
          if (typeof it === 'string') {
            return { name: prettyName(it), file: it, url: `${BASE}/${it}` }
          }
          const o = it as { name?: string; file?: string; url?: string; size?: number }
          const file = o.file ?? o.url?.split('/').pop() ?? ''
          if (!file) return null
          return {
            name: o.name ?? prettyName(file),
            file,
            url: o.url?.startsWith('http') ? o.url : `${BASE}/${file}`,
            size: o.size,
          }
        })
        .filter(Boolean) as RemoteFont[]
      if (list.length) return list
    }
  } catch {
    /* fall through */
  }

  // 2) jsDelivr file listing (no rate limit)
  return fetchJsdelivrFonts(BASE)
}

async function fetchJsdelivrFonts(BASE: string): Promise<RemoteFont[]> {
  let files: { name: string; size?: number }[] = []
  try {
    const res = await fetch(await cdnListUrl())
    if (!res.ok) throw new Error('jsdelivr list failed')
    const json = (await res.json()) as { files?: { name: string; size?: number }[] }
    files = json.files ?? []
  } catch {
    files = []
  }
  const list = files
    .filter((f) => f.name.startsWith('/Fonts/') && FONT_RE.test(f.name))
    .map((f) => {
      const file = f.name.slice('/Fonts/'.length)
      return {
        name: prettyName(file),
        file,
        url: `${BASE}/${encodeURIComponent(file)}`,
        size: f.size,
      }
    })
  if (list.length) return list
  // jsDelivr listing empty or stale — read the folder straight from GitHub
  return fetchGithubFonts(BASE)
}

async function fetchGithubFonts(BASE: string): Promise<RemoteFont[]> {
  const res = await fetch(ghListUrl('Fonts'))
  if (!res.ok) throw new Error('github list failed')
  const json = (await res.json()) as { name: string; size?: number; type?: string }[]
  return (Array.isArray(json) ? json : [])
    .filter((f) => f.type !== 'dir' && FONT_RE.test(f.name))
    .map((f) => ({
      name: prettyName(f.name),
      file: f.name,
      url: `${BASE}/${encodeURIComponent(f.name)}`,
      size: f.size,
    }))
}

/* ---------------- offline storage ---------------- */

const DB_NAME = 'myan-remote-fonts'
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

/* ---------------- installed index ---------------- */

const KEY = 'myan.remoteFonts'

const listeners = new Set<() => void>()
export function subscribeRemoteFonts(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
function emit() {
  listeners.forEach((l) => l())
}

export function listInstalledRemoteFonts(): RemoteFont[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]') as RemoteFont[]
  } catch {
    return []
  }
}

function writeInstalled(list: RemoteFont[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  emit()
}

export function isRemoteFontInstalled(name: string) {
  return listInstalledRemoteFonts().some((f) => f.name === name)
}

/* ---------------- download + register ---------------- */

const loaded = new Set<string>()
const inflight = new Map<string, Promise<void>>()

async function registerBuffer(name: string, buf: ArrayBuffer) {
  const face = new FontFace(remoteCssFamily(name), buf)
  document.fonts.add(await face.load())
  loaded.add(name)
  emit()
}

export function isRemoteFontReady(name: string) {
  return loaded.has(name)
}

/** Load a font just for previewing — nothing is persisted. */
export async function previewRemoteFont(font: RemoteFont): Promise<void> {
  if (loaded.has(font.name)) return
  const existing = inflight.get(font.name)
  if (existing) return existing
  const task = (async () => {
    const cached = await idbGet(font.name).catch(() => undefined)
    const buf = cached ?? (await fetchFile(font))
    await registerBuffer(font.name, buf)
  })()
  inflight.set(font.name, task)
  try {
    await task
  } finally {
    inflight.delete(font.name)
  }
}

async function fetchFile(font: RemoteFont): Promise<ArrayBuffer> {
  const res = await cdnFetch(font.url)
  if (!res.ok) throw new Error('download failed')
  return res.arrayBuffer()
}

/** Download and keep the font in the app for offline use. */
export async function installRemoteFont(font: RemoteFont): Promise<void> {
  let buf = await idbGet(font.name).catch(() => undefined)
  if (!buf) buf = await fetchFile(font)
  await idbSet(font.name, buf).catch(() => {})
  if (!loaded.has(font.name)) await registerBuffer(font.name, buf)
  const list = listInstalledRemoteFonts()
  if (!list.some((f) => f.name === font.name)) writeInstalled([...list, font])
  else emit()
}

export async function removeRemoteFont(name: string) {
  await idbDel(name).catch(() => {})
  loaded.delete(name)
  writeInstalled(listInstalledRemoteFonts().filter((f) => f.name !== name))
}

/** Re-register every downloaded font at app start (works offline). */
export async function ensureRemoteFontsLoaded() {
  if (typeof window === 'undefined' || !('FontFace' in window)) return
  for (const font of listInstalledRemoteFonts()) {
    if (loaded.has(font.name)) continue
    try {
      const buf = await idbGet(font.name)
      if (buf) await registerBuffer(font.name, buf)
      else await installRemoteFont(font).catch(() => {})
    } catch {
      /* ignore */
    }
  }
}

/**
 * Make sure the remote (GitHub) fonts referenced by `rf:` keys are loaded,
 * even when the user never opened the Download Fonts page.
 * Fonts are loaded for rendering only — nothing is marked as installed.
 */
export async function ensureRemoteFontsForKeys(keys: Iterable<string>): Promise<void> {
  if (typeof window === 'undefined' || !('FontFace' in window)) return
  const names = new Set<string>()
  for (const key of keys) {
    const name = remoteFontNameFromKey(key)
    if (name && !loaded.has(name)) names.add(name)
  }
  if (!names.size) return

  // installed entries first (offline friendly), then the remote catalog
  const known = new Map<string, RemoteFont>()
  for (const f of listInstalledRemoteFonts()) known.set(f.name, f)
  if ([...names].some((n) => !known.has(n))) {
    try {
      for (const f of await fetchRemoteFonts()) if (!known.has(f.name)) known.set(f.name, f)
    } catch {
      /* offline */
    }
  }

  await Promise.all(
    [...names].map(async (name) => {
      const font =
        known.get(name) ??
        [...known.values()].find((f) => f.name.toLowerCase() === name.toLowerCase())
      if (!font) return
      await previewRemoteFont(font).catch(() => {})
    }),
  )
}
