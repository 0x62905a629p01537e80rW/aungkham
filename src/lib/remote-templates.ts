/**
 * Templates published at https://cdn.jsdelivr.net/gh/0x62905a629p01537e80rW/0x62905a629p01537e80rW.github.io/Templates
 * Each file is an exported "my templates" JSON. Downloaded files are kept
 * offline in IndexedDB and registered as regular templates.
 */
import type { TextLayer } from '@/lib/text-layer'
import type { TemplateDef, TemplateLang } from '@/lib/templates'

/** jsDelivr edge CDN — no bandwidth cap, no rate limit */
import { cdnBase, cdnFetch, cdnListUrl, ghListUrl } from './cdn-ref'

const base = () => cdnBase('Templates')
const FILE_RE = /\.json$/i

export interface RemoteTemplatePack {
  /** display name (file name without extension) */
  name: string
  /** file name */
  file: string
  /** absolute download url */
  url: string
  size?: number
}

export interface RawTemplate {
  id: string
  name: string
  lang?: string
  group?: string
  bg?: string
  layers: TextLayer[]
}

/* ---------------- free / premium tiers ---------------- */

export type TemplateTier = 'free' | 'premium'

let tierCache: Record<string, TemplateTier> | null = null

const key = (v: string) => v.trim().toLowerCase()

export async function fetchTemplateTiers(force = false): Promise<Record<string, TemplateTier>> {
  if (tierCache && !force) return tierCache
  const map: Record<string, TemplateTier> = {}
  try {
    const res = await cdnFetch(`${await base()}/check.json?t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) {
      const json = (await res.json()) as {
        templates?: { premium?: string[]; free?: string[] }
        premium?: string[]
        free?: string[]
      }
      for (const f of json.templates?.free ?? json.free ?? []) map[key(f)] = 'free'
      for (const f of json.templates?.premium ?? json.premium ?? []) map[key(f)] = 'premium'
    }
  } catch {
    /* offline — treat everything as free */
  }
  tierCache = map
  return map
}

export function templateTier(
  pack: { file: string; name: string },
  tiers: Record<string, TemplateTier> | null,
): TemplateTier {
  if (!tiers) return 'free'
  return (
    tiers[key(pack.file)] ??
    tiers[key(pack.name)] ??
    tiers[key(pack.file.replace(FILE_RE, ''))] ??
    'free'
  )
}

function prettyName(file: string) {
  return file.replace(FILE_RE, '').replace(/[_-]+/g, ' ').trim()
}

/* ---------------- listing ---------------- */

let catalogCache: RemoteTemplatePack[] | null = null

export async function fetchRemoteTemplates(force = false): Promise<RemoteTemplatePack[]> {
  if (catalogCache && !force) return catalogCache
  const BASE = await base()

  // 1) optional hand-written index
  try {
    const res = await cdnFetch(`${BASE}/templates.json?t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) {
      const raw = (await res.json()) as unknown
      const arr = Array.isArray(raw) ? raw : ((raw as { templates?: unknown[] })?.templates ?? [])
      const list = (arr as unknown[])
        .map((it) => {
          if (typeof it === 'string') return { name: prettyName(it), file: it, url: `${BASE}/${it}` }
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
        .filter(Boolean) as RemoteTemplatePack[]
      if (list.length) {
        catalogCache = list
        return list
      }
    }
  } catch {
    /* fall through */
  }

  // 2) jsDelivr file listing (no rate limit)
  let files: { name: string; size?: number }[] = []
  try {
    const res = await fetch(await cdnListUrl())
    if (!res.ok) throw new Error('list failed')
    const json = (await res.json()) as { files?: { name: string; size?: number }[] }
    files = json.files ?? []
  } catch {
    files = []
  }
  const list = files
    .filter(
      (f) =>
        f.name.startsWith('/Templates/') &&
        FILE_RE.test(f.name) &&
        !/\/(check|templates)\.json$/i.test(f.name),
    )
    .map((f) => {
      const file = f.name.slice('/Templates/'.length)
      return {
        name: prettyName(file),
        file,
        url: `${BASE}/${encodeURIComponent(file)}`,
        size: f.size,
      }
    })
  if (!list.length) {
    // jsDelivr listing empty or stale — read the folder straight from GitHub
    const gh = await fetch(ghListUrl('Templates'))
    if (!gh.ok) throw new Error('Could not load the template list')
    const json = (await gh.json()) as { name: string; size?: number; type?: string }[]
    const ghList = (Array.isArray(json) ? json : [])
      .filter(
        (f) =>
          f.type !== 'dir' && FILE_RE.test(f.name) && !/^(check|templates)\.json$/i.test(f.name),
      )
      .map((f) => ({
        name: prettyName(f.name),
        file: f.name,
        url: `${BASE}/${encodeURIComponent(f.name)}`,
        size: f.size,
      }))
    catalogCache = ghList
    return ghList
  }
  catalogCache = list
  return list
}

/* ---------------- offline storage ---------------- */

const DB_NAME = 'myan-remote-templates'
const STORE = 'packs'

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

async function idbGet(k: string): Promise<RawTemplate[] | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(k)
    req.onsuccess = () => resolve(req.result as RawTemplate[] | undefined)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(k: string, value: RawTemplate[]) {
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

const KEY = 'myan.remoteTemplates'

const listeners = new Set<() => void>()
export function subscribeRemoteTemplates(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
function emit() {
  listeners.forEach((l) => l())
}

export function listInstalledTemplatePacks(): RemoteTemplatePack[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]') as RemoteTemplatePack[]
  } catch {
    return []
  }
}

function writeInstalled(list: RemoteTemplatePack[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  emit()
}

export function isTemplatePackInstalled(file: string) {
  return listInstalledTemplatePacks().some((p) => p.file === file)
}

/* ---------------- download + register ---------------- */

/** file -> template defs, ready to render/apply */
const registry = new Map<string, TemplateDef[]>()

function toDefs(file: string, raw: RawTemplate[]): TemplateDef[] {
  return raw.map((t, i) => ({
    id: `rt-${file}-${t.id ?? i}`,
    name: t.name || `Template ${i + 1}`,
    lang: (t.lang === 'EN' ? 'EN' : 'MM') as TemplateLang,
    group: t.group || 'Downloaded',
    bg: t.bg,
    build: () => t.layers.map((l, idx) => ({ ...l, id: `${t.id ?? i}-${idx}-${Date.now()}` })),
  }))
}

export function getTemplatePackDefs(file: string): TemplateDef[] {
  return registry.get(file) ?? []
}

export function listDownloadedTemplateDefs(): TemplateDef[] {
  return listInstalledTemplatePacks().flatMap((p) => registry.get(p.file) ?? [])
}

async function fetchPack(pack: RemoteTemplatePack): Promise<RawTemplate[]> {
  const res = await cdnFetch(pack.url)
  if (!res.ok) throw new Error('download failed')
  const json = (await res.json()) as { templates?: RawTemplate[] } | RawTemplate[]
  const list = Array.isArray(json) ? json : (json.templates ?? [])
  if (!list.length) throw new Error('empty template file')
  return list
}

/** Load a pack just for previewing — nothing is persisted. */
export async function previewTemplatePack(pack: RemoteTemplatePack): Promise<TemplateDef[]> {
  const hit = registry.get(pack.file)
  if (hit) return hit
  const cached = await idbGet(pack.file).catch(() => undefined)
  const raw = cached ?? (await fetchPack(pack))
  const defs = toDefs(pack.file, raw)
  registry.set(pack.file, defs)
  emit()
  return defs
}

export async function installTemplatePack(pack: RemoteTemplatePack): Promise<void> {
  let raw = await idbGet(pack.file).catch(() => undefined)
  if (!raw) raw = await fetchPack(pack)
  await idbSet(pack.file, raw).catch(() => {})
  registry.set(pack.file, toDefs(pack.file, raw))
  const list = listInstalledTemplatePacks()
  if (!list.some((p) => p.file === pack.file)) writeInstalled([...list, pack])
  else emit()
}

export async function removeTemplatePack(file: string) {
  await idbDel(file).catch(() => {})
  registry.delete(file)
  writeInstalled(listInstalledTemplatePacks().filter((p) => p.file !== file))
}

/** Install a template pack from a local JSON file picked by the user. */
export async function importTemplateFile(file: File): Promise<RemoteTemplatePack> {
  const text = await file.text()
  const json = JSON.parse(text) as { templates?: RawTemplate[] } | RawTemplate[]
  const list = Array.isArray(json) ? json : (json.templates ?? [])
  if (!Array.isArray(list) || !list.length) throw new Error('No templates in this file')

  let name = file.name.replace(FILE_RE, '')
  let key = file.name
  const taken = new Set(listInstalledTemplatePacks().map((p) => p.file))
  let n = 2
  while (taken.has(key)) {
    key = `${name} (${n}).json`
    n++
  }
  name = prettyName(key)

  const pack: RemoteTemplatePack = { name, file: key, url: '', size: file.size }
  await idbSet(key, list).catch(() => {})
  registry.set(key, toDefs(key, list))
  writeInstalled([...listInstalledTemplatePacks(), pack])
  return pack
}

/** Re-register every downloaded pack (works offline). */
export async function ensureTemplatePacksLoaded() {
  if (typeof window === 'undefined') return
  for (const pack of listInstalledTemplatePacks()) {
    if (registry.has(pack.file)) continue
    try {
      const raw = await idbGet(pack.file)
      if (raw) {
        registry.set(pack.file, toDefs(pack.file, raw))
        emit()
      } else {
        await installTemplatePack(pack).catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }
}