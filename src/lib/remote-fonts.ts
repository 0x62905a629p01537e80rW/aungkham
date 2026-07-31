/**
 * Fonts published at https://myandev.github.io/Fonts
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

const BASE = 'https://myandev.github.io/Fonts'
const INDEX_URL = `${BASE}/fonts.json`
const API_URL = 'https://api.github.com/repos/myandev/myandev.github.io/contents/Fonts'
const FONT_RE = /\.(ttf|otf|woff2?)$/i

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

  // 1) optional hand-written index
  try {
    const res = await fetch(`${INDEX_URL}?t=${Date.now()}`, { cache: 'no-store' })
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
      if (list.length) {
        catalogCache = list
        return list
      }
    }
  } catch {
    /* fall through */
  }

  // 2) GitHub contents API (works without an index file)
  const res = await fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error('Could not load the font list')
  const items = (await res.json()) as {
    name: string
    type: string
    size: number
    download_url: string | null
  }[]
  const list = items
    .filter((i) => i.type === 'file' && FONT_RE.test(i.name))
    .map((i) => ({
      name: prettyName(i.name),
      file: i.name,
      url: i.download_url ?? `${BASE}/${encodeURIComponent(i.name)}`,
      size: i.size,
    }))
  catalogCache = list
  return list
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
  const res = await fetch(font.url)
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
