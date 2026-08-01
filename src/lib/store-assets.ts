/**
 * Asset store — images published under
 * <cdn>/Store/<Background|Shapes|Stickers>/
 * Each folder carries its own check.json describing free/premium tiers.
 * Downloaded assets are kept offline in IndexedDB.
 */
import { cdnBase, cdnFetch, cdnListUrl, ghListUrl, rawBase } from './cdn-ref'

export type StoreKind = 'Background' | 'Shapes' | 'Stickers'
export const STORE_KINDS: StoreKind[] = ['Background', 'Shapes', 'Stickers']

export type StoreTier = 'free' | 'premium'

export interface StoreAsset {
  kind: StoreKind
  /** display name (file name without extension) */
  name: string
  /** file name */
  file: string
  /** absolute download url */
  url: string
  size?: number
}

const IMG_RE = /\.(png|jpe?g|webp|svg|gif|avif)$/i
const folder = (kind: StoreKind) => `Store/${kind}`
const base = (kind: StoreKind) => cdnBase(folder(kind))

function prettyName(file: string) {
  return file
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
}

const key = (v: string) => v.trim().toLowerCase()

/* ---------------- tiers ---------------- */

const tierCache = new Map<StoreKind, Record<string, StoreTier>>()

/** Reads Store/<kind>/check.json → { premium: [...], free: [...] } */
export async function fetchStoreTiers(
  kind: StoreKind,
  force = false,
): Promise<Record<string, StoreTier>> {
  const hit = tierCache.get(kind)
  if (hit && !force) return hit
  const map: Record<string, StoreTier> = {}
  try {
    // Cacheable request; the repo owner purges jsDelivr manually.
    const res = await cdnFetch(`${await base(kind)}/check.json`)
    if (res?.ok) {
      const json = (await res.json()) as Record<string, unknown>
      const section = (json[kind.toLowerCase()] ?? json['assets'] ?? json) as {
        premium?: string[]
        free?: string[]
      }
      for (const f of section.free ?? []) map[key(f)] = 'free'
      for (const f of section.premium ?? []) map[key(f)] = 'premium'
    }
  } catch {
    /* offline — everything is free */
  }
  tierCache.set(kind, map)
  return map
}

export function storeTier(
  asset: { file: string; name: string },
  tiers: Record<string, StoreTier> | null,
): StoreTier {
  if (!tiers) return 'free'
  return (
    tiers[key(asset.file)] ??
    tiers[key(asset.name)] ??
    tiers[key(asset.file.replace(/\.[^.]+$/, ''))] ??
    'free'
  )
}

/* ---------------- listing ---------------- */

const catalog = new Map<StoreKind, StoreAsset[]>()

export async function fetchStoreAssets(kind: StoreKind, force = false): Promise<StoreAsset[]> {
  const hit = catalog.get(kind)
  if (hit && !force) return hit
  const BASE = await base(kind)
  const prefix = `/${folder(kind)}/`

  // 1) optional hand-written index
  try {
    const res = await cdnFetch(`${BASE}/index.json`)
    if (res.ok) {
      const raw = (await res.json()) as unknown
      const arr = Array.isArray(raw) ? raw : ((raw as { files?: unknown[] })?.files ?? [])
      const list = (arr as unknown[])
        .map((it) => {
          const file =
            typeof it === 'string'
              ? it
              : ((it as { file?: string; url?: string }).file ??
                (it as { url?: string }).url?.split('/').pop() ??
                '')
          if (!file) return null
          const o = it as { name?: string; size?: number }
          return {
            kind,
            name: typeof it === 'string' ? prettyName(it) : (o.name ?? prettyName(file)),
            file,
            url: `${BASE}/${encodeURIComponent(file)}`,
            size: o.size,
          } satisfies StoreAsset
        })
        .filter(Boolean) as StoreAsset[]
      if (list.length) {
        catalog.set(kind, list)
        return list
      }
    }
  } catch {
    /* fall through */
  }

  // 2) jsDelivr flat listing
  let files: { name: string; size?: number }[] = []
  try {
    const res = await fetch(await cdnListUrl())
    if (res.ok) {
      const json = (await res.json()) as { files?: { name: string; size?: number }[] }
      files = json.files ?? []
    }
  } catch {
    files = []
  }
  let list = files
    .filter((f) => f.name.startsWith(prefix) && IMG_RE.test(f.name))
    .map((f) => {
      const file = f.name.slice(prefix.length)
      return { kind, name: prettyName(file), file, url: `${BASE}/${encodeURIComponent(file)}`, size: f.size }
    })

  // 3) GitHub folder listing when jsDelivr is empty or stale
  if (!list.length) {
    try {
      const gh = await fetch(ghListUrl(folder(kind)))
      if (gh.ok) {
        const json = (await gh.json()) as { name: string; size?: number; type?: string }[]
        list = (Array.isArray(json) ? json : [])
          .filter((f) => f.type !== 'dir' && IMG_RE.test(f.name))
          .map((f) => ({
            kind,
            name: prettyName(f.name),
            file: f.name,
            url: `${BASE}/${encodeURIComponent(f.name)}`,
            size: f.size,
          }))
      }
    } catch {
      /* folder not published yet */
    }
  }

  catalog.set(kind, list)
  return list
}

/* ---------------- offline storage ---------------- */

const DB_NAME = 'myan-store-assets'
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

function idbKey(kind: StoreKind, file: string) {
  return `${kind}/${file}`
}

async function idbGet(k: string): Promise<string | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(k)
    req.onsuccess = () => resolve(req.result as string | undefined)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(k: string, value: string) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, k)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbDel(k: string) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(k)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ---------------- installed index ---------------- */

const KEY = 'myan.storeAssets'

const listeners = new Set<() => void>()
export function subscribeStoreAssets(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
function emit() {
  listeners.forEach((l) => l())
}

function readInstalled(): StoreAsset[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]') as StoreAsset[]
  } catch {
    return []
  }
}

export function listInstalledStoreAssets(kind?: StoreKind): StoreAsset[] {
  const list = readInstalled()
  return kind ? list.filter((a) => a.kind === kind) : list
}

function writeInstalled(list: StoreAsset[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  emit()
}

export function isStoreAssetInstalled(kind: StoreKind, file: string) {
  return readInstalled().some((a) => a.kind === kind && a.file === file)
}

/* ---------------- download + cache ---------------- */

/** kind/file -> data url, ready to render */
const cache = new Map<string, string>()

export function getStoreAssetSrc(kind: StoreKind, file: string): string | undefined {
  return cache.get(idbKey(kind, file))
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await cdnFetch(url)
  if (!res.ok) throw new Error('download failed')
  const blob = await res.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Load an asset just for previewing — nothing is persisted. */
export async function previewStoreAsset(asset: StoreAsset): Promise<string> {
  const k = idbKey(asset.kind, asset.file)
  const hit = cache.get(k)
  if (hit) return hit
  const cached = await idbGet(k).catch(() => undefined)
  const src = cached ?? (await fetchAsDataUrl(asset.url))
  cache.set(k, src)
  emit()
  return src
}

export async function installStoreAsset(asset: StoreAsset): Promise<void> {
  const k = idbKey(asset.kind, asset.file)
  let src = cache.get(k) ?? (await idbGet(k).catch(() => undefined))
  if (!src) src = await fetchAsDataUrl(asset.url)
  cache.set(k, src)
  await idbSet(k, src).catch(() => {})
  const list = readInstalled()
  if (!list.some((a) => a.kind === asset.kind && a.file === asset.file))
    writeInstalled([...list, asset])
  else emit()
}

export async function removeStoreAsset(kind: StoreKind, file: string) {
  const k = idbKey(kind, file)
  await idbDel(k).catch(() => {})
  cache.delete(k)
  writeInstalled(readInstalled().filter((a) => !(a.kind === kind && a.file === file)))
}

/** Re-hydrate every downloaded asset (works offline). */
export async function ensureStoreAssetsLoaded() {
  if (typeof window === 'undefined') return
  for (const asset of readInstalled()) {
    const k = idbKey(asset.kind, asset.file)
    if (cache.has(k)) continue
    try {
      const src = await idbGet(k)
      if (src) {
        cache.set(k, src)
        emit()
      } else if (asset.url) {
        await installStoreAsset(asset).catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }
}
