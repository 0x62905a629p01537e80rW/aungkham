/**
 * Asset store — images published under
 * <cdn>/Store/<Background|Shapes|Stickers>/
 * Each folder carries its own check.json describing free/premium tiers.
 * Downloaded assets are kept offline in IndexedDB.
 */
import { bust, cdnBase, cdnFetch, cdnListUrl, ghTreeUrl, noStore, rawBase } from './cdn-ref'

export type StoreKind = 'Background' | 'Shapes' | 'Stickers'
export const STORE_KINDS: StoreKind[] = ['Background', 'Shapes', 'Stickers']

export type StoreTier = 'free' | 'premium'

export interface StoreAsset {
  kind: StoreKind
  /** display name (file name without extension) */
  name: string
  /** file path relative to the section root — may include a pack folder */
  file: string
  /** pack (sub folder) this asset belongs to, if any */
  pack?: string
  /** absolute download url */
  url: string
  size?: number
}

const IMG_RE = /\.(png|jpe?g|webp|svg|gif|avif)$/i
/** Repo folder holding the store sections (note the space in the name). */
const ROOT = 'Assets Store'
/** URL-safe path segment, e.g. `Assets%20Store/Shapes` */
const folder = (kind: StoreKind) => `${encodeURIComponent(ROOT)}/${kind}`
/** Decoded path prefix as it appears in listings, e.g. `/Assets Store/Shapes/` */
const listPrefix = (kind: StoreKind) => `/${ROOT}/${kind}/`
const base = (kind: StoreKind) => cdnBase(folder(kind))

/** Encodes each path segment so pack folders survive in the URL. */
const encPath = (p: string) => p.split('/').map(encodeURIComponent).join('/')

/** `iOS/foo.png` → `iOS` */
export function packOf(file: string): string | undefined {
  const i = file.lastIndexOf('/')
  return i > 0 ? file.slice(0, i) : undefined
}

function prettyName(file: string) {
  return file
    .split('/')
    .pop()!
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
}

const key = (v: string) => v.trim().toLowerCase()

/**
 * Metadata (check.json / index.json) read straight from GitHub first — the
 * jsDelivr branch ref can serve a cached copy for hours after an upload.
 */
async function fetchMeta(kind: StoreKind, file: string): Promise<Response | null> {
  const urls = [
    `${pagesBase(folder(kind))}/${encPath(file)}`,
    `${rawBase(folder(kind))}/${encPath(file)}`,
    `${await base(kind)}/${encPath(file)}`,
  ]
  for (const url of urls) {
    try {
      const res = await cdnFetch(bust(url), noStore)
      if (res.ok) return res
    } catch {
      /* try next */
    }
  }
  return null
}

/**
 * Full repo file list via the GitHub tree API. jsDelivr's data API and folder
 * pages can lag behind a fresh push (new pack folders simply do not appear),
 * so this is the authoritative listing when the device is online.
 */
let treePromise: Promise<string[]> | null = null
async function fetchRepoTree(force = false): Promise<string[]> {
  if (force) treePromise = null
  if (!treePromise) {
    treePromise = (async () => {
      try {
        const res = await fetch(bust(ghTreeUrl()), noStore)
        if (!res.ok) return []
        const json = (await res.json()) as {
          tree?: { path: string; type: string; size?: number }[]
        }
        return (json.tree ?? []).filter((t) => t.type === 'blob').map((t) => t.path)
      } catch {
        return []
      }
    })()
  }
  return treePromise
}


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
    // Metadata is always fetched fresh so newly purged tiers show up at once.
    const res = await fetchMeta(kind, 'check.json')
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
  asset: { file: string; name: string; pack?: string },
  tiers: Record<string, StoreTier> | null,
): StoreTier {
  if (!tiers) return 'free'
  const pack = asset.pack ?? packOf(asset.file)
  return (
    (pack ? tiers[key(pack)] : undefined) ??
    tiers[key(asset.file)] ??
    tiers[key(asset.name)] ??
    tiers[key(asset.file.replace(/\.[^.]+$/, ''))] ??
    'free'
  )
}

/** Tier of a whole pack (falls back to its first member). */
export function packTier(
  pack: string,
  members: StoreAsset[],
  tiers: Record<string, StoreTier> | null,
): StoreTier {
  if (!tiers) return 'free'
  return tiers[key(pack)] ?? (members[0] ? storeTier(members[0], tiers) : 'free')
}

/* ---------------- listing ---------------- */

const catalog = new Map<StoreKind, StoreAsset[]>()

/** Reads a jsDelivr directory page, returning image files and sub folders. */
async function readFolderPage(
  url: string,
): Promise<{ files: string[]; folders: string[] }> {
  const out = { files: [] as string[], folders: [] as string[] }
  try {
    const page = await fetch(bust(url), noStore)
    if (!page.ok) return out
    const html = await page.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const here = decodeURIComponent(new URL(url).pathname).replace(/\/*$/, '/')
    for (const anchor of Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
      let pathname: string
      try {
        pathname = decodeURIComponent(new URL(anchor.href, url).pathname)
      } catch {
        continue
      }
      if (!pathname.startsWith(here) || pathname === here) continue
      const rest = pathname.slice(here.length)
      if (!rest || rest.includes('/') !== rest.endsWith('/')) continue
      if (rest.endsWith('/')) out.folders.push(rest.slice(0, -1))
      else if (IMG_RE.test(rest)) out.files.push(rest)
    }
  } catch {
    /* offline */
  }
  return out
}

export async function fetchStoreAssets(kind: StoreKind, force = false): Promise<StoreAsset[]> {
  const hit = catalog.get(kind)
  if (hit && !force) return hit
  const BASE = await base(kind)
  const prefix = listPrefix(kind)
  let list: StoreAsset[] = []

  const make = (file: string, size?: number, name?: string): StoreAsset => ({
    kind,
    name: name ?? prettyName(file),
    file,
    pack: packOf(file),
    url: `${BASE}/${encPath(file)}`,
    size,
  })

  const merge = (incoming: StoreAsset[]) => {
    const byFile = new Map(list.map((asset) => [key(asset.file), asset]))
    for (const asset of incoming) byFile.set(key(asset.file), asset)
    list = [...byFile.values()]
  }

  // 1) optional hand-written index (entries may include a pack folder)
  try {
    const res = await fetchMeta(kind, 'index.json')
    if (res?.ok) {
      const raw = (await res.json()) as unknown
      const arr = Array.isArray(raw) ? raw : ((raw as { files?: unknown[] })?.files ?? [])
      const indexed = (arr as unknown[])
        .map((it) => {
          const file =
            typeof it === 'string'
              ? it
              : ((it as { file?: string; url?: string }).file ??
                (it as { url?: string }).url?.split('/').pop() ??
                '')
          // Folder entries (e.g. "iOS") are packs — their files come from the
          // repo tree listing, so skip anything that is not an image file.
          if (!file || !IMG_RE.test(file)) return null
          const o = it as { name?: string; size?: number }
          return make(file, o.size, typeof it === 'string' ? undefined : o.name)
        })
        .filter(Boolean) as StoreAsset[]
      merge(indexed)
    }
  } catch {
    /* fall through */
  }

  // 1b) GitHub tree listing — authoritative and never stale.
  {
    const treePrefix = `${ROOT}/${kind}/`
    const tree = await fetchRepoTree(force)
    merge(
      tree
        .filter((path) => path.startsWith(treePrefix) && IMG_RE.test(path))
        .map((path) => make(path.slice(treePrefix.length))),
    )
  }

  // 2) jsDelivr flat listing (already recursive)
  let files: { name: string; size?: number }[] = []
  try {
    const res = await fetch(bust(await cdnListUrl()), noStore)
    if (res.ok) {
      const json = (await res.json()) as { files?: { name: string; size?: number }[] }
      files = json.files ?? []
    }
  } catch {
    files = []
  }
  merge(
    files
      .filter((f) => f.name.startsWith(prefix) && IMG_RE.test(f.name))
      .map((f) => make(f.name.slice(prefix.length), f.size)),
  )

  // 3) jsDelivr's browser-safe folder pages. The data API can retain an old
  // flat index even after individual files and directory pages are current.
  // Sub folders are packs (e.g. `Stickers/iOS`) and are walked one level deep.
  {
    const root = await readFolderPage(`${BASE}/`)
    merge(root.files.map((f) => make(f)))
    const packs = await Promise.all(
      root.folders.map(async (pack) => {
        const sub = await readFolderPage(`${BASE}/${encPath(pack)}/`)
        return sub.files.map((f) => make(`${pack}/${f}`))
      }),
    )
    for (const p of packs) merge(p)
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
